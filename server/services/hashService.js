const crypto = require("crypto");

function sha256(content) {
  return crypto.createHash("sha256").update(content).digest("hex");
}

function toBytes32(hashHex) {
  const normalized = hashHex.startsWith("0x") ? hashHex.slice(2) : hashHex;
  if (normalized.length !== 64) {
    throw new Error("SHA256 hash must be 32 bytes (64 hex chars)");
  }
  return `0x${normalized}`;
}

module.exports = {
  sha256,
  toBytes32
};
