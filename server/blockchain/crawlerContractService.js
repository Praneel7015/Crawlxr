const { ethers } = require("ethers");

const abi = [
  "function addCrawlRecord(string url, bytes32 contentHash) external",
  "function verifyCrawl(string url) external view returns (bool exists, bytes32 contentHash, uint256 timestamp, address crawler)",
  "function hasCrawled(string url) external view returns (bool)",
  "function registerNode() external",
  "function registeredNodes(address) external view returns (bool)",
  "function claimCrawlTask(string url) external returns (bool)"
];

const { RPC_URL, PRIVATE_KEY, CRAWLER_CONTRACT_ADDRESS } = process.env;

if (!RPC_URL || !PRIVATE_KEY || !CRAWLER_CONTRACT_ADDRESS) {
  throw new Error("RPC_URL, PRIVATE_KEY, and CRAWLER_CONTRACT_ADDRESS are required in environment variables");
}

const provider = new ethers.JsonRpcProvider(RPC_URL);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
const contract = new ethers.Contract(CRAWLER_CONTRACT_ADDRESS, abi, wallet);

async function registerNodeIfRequired() {
  const isRegistered = await contract.registeredNodes(wallet.address);
  if (isRegistered) {
    return;
  }
  const tx = await contract.registerNode();
  await tx.wait();
}

async function claimTask(url) {
  const tx = await contract.claimCrawlTask(url);
  await tx.wait();
}

async function addCrawlRecord(url, contentHashBytes32) {
  const tx = await contract.addCrawlRecord(url, contentHashBytes32);
  const receipt = await tx.wait();
  return {
    hash: receipt.hash,
    from: wallet.address
  };
}

async function verifyCrawl(url) {
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
