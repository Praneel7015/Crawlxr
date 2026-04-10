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
  "function hasCrawled(string url) external view returns (bool)",
  "function registeredNodes(address node) external view returns (bool)",
  "function taskClaimed(bytes32 key) external view returns (bool)",
  "function taskClaimer(bytes32 key) external view returns (address)"
];

const contract = (wallet && CRAWLER_CONTRACT_ADDRESS) 
  ? new ethers.Contract(CRAWLER_CONTRACT_ADDRESS, ABI, wallet) 
  : null;

function collectErrorText(err) {
  const textParts = [
    err?.reason,
    err?.shortMessage,
    err?.message,
    err?.info?.error?.message,
  ];

  if (Array.isArray(err?.revert?.args)) {
    textParts.push(...err.revert.args.map(String));
  }

  return textParts.filter(Boolean).join(" | ").toLowerCase();
}

function hasRevertReason(err, reasons) {
  const haystack = collectErrorText(err);
  return reasons.some((reason) => haystack.includes(reason.toLowerCase()));
}

function buildAppError(status, code, message, cause) {
  const err = new Error(message);
  err.status = status;
  err.code = code;
  err.cause = cause;
  return err;
}

/**
 * PRODUCTION CONTRACT LOGIC
 * Reverted from mock state. Ensure .env has valid RPC_URL and PRIVATE_KEY.
 */

async function registerNodeIfRequired() {
  if (!contract || !wallet) {
    return { skipped: true, reason: "contract-uninitialized" };
  }

  const isRegistered = await contract.registeredNodes(wallet.address);
  if (isRegistered) {
    return { skipped: true, reason: "already-registered" };
  }

  try {
    const tx = await contract.registerNode();
    const receipt = await tx.wait();
    return { registered: true, txHash: receipt?.hash || tx?.hash || null };
  } catch (err) {
    if (hasRevertReason(err, ["Already registered"])) {
      return { skipped: true, reason: "already-registered" };
    }
    throw err;
  }
}

async function claimTask(url) {
  if (!contract || !wallet) {
    return { skipped: true, claimed: false, reason: "contract-uninitialized" };
  }

  const alreadyCrawled = await contract.hasCrawled(url);
  if (alreadyCrawled) {
    return { claimed: false, reason: "already-crawled" };
  }

  const taskKey = ethers.keccak256(ethers.toUtf8Bytes(url));
  const alreadyClaimed = await contract.taskClaimed(taskKey);
  if (alreadyClaimed) {
    const claimer = await contract.taskClaimer(taskKey);
    const sameClaimer =
      typeof claimer === "string" &&
      claimer.toLowerCase() === wallet.address.toLowerCase();

    return {
      claimed: false,
      reason: sameClaimer ? "already-claimed-by-self" : "already-claimed",
      claimer,
    };
  }

  try {
    const tx = await contract.claimCrawlTask(url);
    const receipt = await tx.wait();
    return { claimed: true, txHash: receipt?.hash || tx?.hash || null };
  } catch (err) {
    if (hasRevertReason(err, ["Task already claimed"])) {
      return { claimed: false, reason: "already-claimed" };
    }
    if (hasRevertReason(err, ["Already crawled", "URL already crawled"])) {
      return { claimed: false, reason: "already-crawled" };
    }
    throw err;
  }
}

async function addCrawlRecord(url, contentHash) {
  if (!contract) {
    throw new Error("Blockchain contract not initialized. Check .env");
  }

  try {
    const tx = await contract.addCrawlRecord(url, contentHash);
    return await tx.wait();
  } catch (err) {
    if (hasRevertReason(err, ["URL already crawled", "Already crawled"])) {
      throw buildAppError(409, "URL_ALREADY_CRAWLED_ON_CHAIN", "URL already crawled on-chain", err);
    }
    if (hasRevertReason(err, ["Task claimed by another node"])) {
      throw buildAppError(409, "TASK_CLAIMED_BY_ANOTHER_NODE", "Task claimed by another node", err);
    }
    throw err;
  }
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
