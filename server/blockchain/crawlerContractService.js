const { ethers } = require("ethers");

const { RPC_URL, PRIVATE_KEY, CRAWLER_CONTRACT_ADDRESS } = process.env;

if (!RPC_URL || !PRIVATE_KEY || !CRAWLER_CONTRACT_ADDRESS) {
  // We keep a fallback for dev, but notify that real logic is expected
  console.warn("Blockchain environment variables missing. Contract service will fail in production.");
}

const provider = RPC_URL ? new ethers.JsonRpcProvider(RPC_URL) : null;
const wallet = (PRIVATE_KEY && provider) ? new ethers.Wallet(PRIVATE_KEY, provider) : null;

// The ABI based on Crawler.sol shared in the contracts folder
const ABI = [
  "function addCrawlRecord(string url, bytes32 contentHash) external",
  "function verifyCrawl(string url) external view returns (bool exists, bytes32 contentHash, uint256 timestamp, address crawler)",
  "function registerNode() external",
  "function claimCrawlTask(string url) external returns (bool)",
  "function hasCrawled(string url) external view returns (bool)"
];

const contract = (wallet && CRAWLER_CONTRACT_ADDRESS) 
  ? new ethers.Contract(CRAWLER_CONTRACT_ADDRESS, ABI, wallet) 
  : null;

/**
 * PRODUCTION CONTRACT LOGIC
 * Reverted from mock state. Ensure .env has valid RPC_URL and PRIVATE_KEY.
 */

async function registerNodeIfRequired() {
  if (!contract) return;
  try {
    const tx = await contract.registerNode();
    await tx.wait();
  } catch (err) {
    // Likely already registered
    console.log("Node registration check:", err.message);
  }
}

async function claimTask(url) {
  if (!contract) return;
  const tx = await contract.claimCrawlTask(url);
  return await tx.wait();
}

async function addCrawlRecord(url, contentHash) {
  if (!contract) {
    throw new Error("Blockchain contract not initialized. Check .env");
  }
  const tx = await contract.addCrawlRecord(url, contentHash);
  return await tx.wait();
}

async function verifyCrawl(url) {
  if (!contract) {
    throw new Error("Blockchain contract not initialized. Check .env");
  }
  const [exists, contentHash, timestamp, crawler] = await contract.verifyCrawl(url);
  return {
    exists,
    contentHash,
    timestamp: Number(timestamp),
    crawler
  };
}

module.exports = {
  addCrawlRecord,
  verifyCrawl,
  registerNodeIfRequired,
  claimTask
};
