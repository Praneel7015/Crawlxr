# Decentralized Blockchain-Based Web Crawler with Crawl Verification

Production-structured full-stack project that crawls web pages, hashes content, stores crawl proof on Ethereum, avoids duplicate crawls via blockchain verification, and displays transaction proofs in a React UI.

## Architecture

User → React UI → Express API → Crawl URL → SHA256 → Smart Contract (Sepolia) → MongoDB history → UI result

## Project Structure

```
bc/
  client/
  contracts/
  server/
  README.md
```

## Features

- Crawl URL, extract title and links (`POST /api/crawl`)
- Dynamic link extraction fallback for JS-heavy pages using headless rendering (Playwright)
- Generate SHA256 content hash
- Store crawl proof on chain (`url + hash + timestamp + crawler`)
- Blockchain duplicate prevention (won't recrawl already stored URL)
- Verify URL crawl on chain (`GET /api/verify/:url`)
- MongoDB off-chain crawl history
- Security hardening: rate limiting, validation, SSRF checks, env-based secrets, centralized error handling
- Optional distributed mode: crawler node registration and task claiming in smart contract

## Smart Contract

Contract path: `contracts/contracts/Crawler.sol`

Includes:
- `CrawlData` struct
- Duplicate-preventing mapping by URL key
- `addCrawlRecord(url, contentHash)`
- `verifyCrawl(url)`
- `CrawlRecorded` event
- Advanced distributed mode:
  - `registerNode()`
  - `claimCrawlTask(url)`
  - `requireNodeRegistration` toggle

## Setup

### 1) Deploy Contract (Hardhat)

```bash
cd contracts
npm install
copy .env.example .env
```

Update `.env` with Sepolia RPC, deployer private key, and Etherscan API key.

Compile + deploy:

```bash
npm run compile
npm run deploy:sepolia
```

Copy deployed contract address.

### 2) Start Backend

```bash
cd ../server
npm install
copy .env.example .env
```

Set in `server/.env`:
- `MONGODB_URI`
- `RPC_URL`
- `PRIVATE_KEY` (server crawler wallet)
- `CRAWLER_CONTRACT_ADDRESS` (from deployment)
- `REQUIRE_NODE_REGISTRATION=true|false`
- `CRAWLER_NODE_ID=node-1`
- `BROWSER_CRAWL_ENABLED=true|false` (JS-rendered crawl fallback)
- `CRAWL_STATIC_TIMEOUT_MS=30000`
- `CRAWL_BROWSER_TIMEOUT_MS=45000`
- `CRAWL_BROWSER_WAIT_MS=6000`
- `CRAWL_MAX_LINKS=100`

Run:

```bash
npm run dev
```

Health check:

```bash
http://localhost:5000/health
```

### 3) Start Frontend

```bash
cd ../client
npm install
copy .env.example .env
npm run dev
```

Open Vite URL (usually `http://localhost:5173`).

## API

### POST `/api/crawl`

Request body:

```json
{
  "url": "https://example.com"
}
```

Response:

- `duplicate`: whether URL already exists on-chain
- `title`
- `links`
- `contentHash`
- `transactionHash`
- `crawler`
- `crawlerNodeId`
- `timestamp`

### GET `/api/verify/:url`

Use encoded URL in path:

`/api/verify/https%3A%2F%2Fexample.com`

Returns blockchain verification payload (`exists`, `contentHash`, `timestamp`, `crawler`).

## Security Controls

- `express-rate-limit` for abuse control
- `express-validator` for URL validation
- SSRF protections:
  - blocks localhost and internal IP ranges
  - blocks hostnames resolving to private IPs
- `helmet` security headers
- private keys and endpoints via environment variables only
- centralized error middleware

## Notes

- The server signs crawl transactions using `PRIVATE_KEY` from `server/.env`.
- If `REQUIRE_NODE_REGISTRATION=true`, the backend wallet auto-registers node and claims task before adding crawl record.
- JS-only pages can be crawled via Playwright fallback when `BROWSER_CRAWL_ENABLED=true`.
- IPFS support can be added by storing full HTML in IPFS and writing only CID hash on-chain.
