const dns = require("dns").promises;
const net = require("net");

function isPrivateIPv4(ip) {
  return (
    ip.startsWith("10.") ||
    ip.startsWith("127.") ||
    ip.startsWith("169.254.") ||
    ip.startsWith("172.16.") ||
    ip.startsWith("172.17.") ||
    ip.startsWith("172.18.") ||
    ip.startsWith("172.19.") ||
    ip.startsWith("172.2") ||
    ip.startsWith("192.168.")
  );
}

function isPrivateIPv6(ip) {
  return ip === "::1" || ip.toLowerCase().startsWith("fc") || ip.toLowerCase().startsWith("fd") || ip.toLowerCase().startsWith("fe80");
}

async function assertSafeUrl(urlString) {
  let parsed;
  try {
    parsed = new URL(urlString);
  } catch (_) {
    const error = new Error("Invalid URL format");
    error.status = 400;
    throw error;
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    const error = new Error("Only HTTP/HTTPS URLs are allowed");
    error.status = 400;
    throw error;
  }

  const hostname = parsed.hostname.toLowerCase();
  if (["localhost", "0.0.0.0"].includes(hostname) || hostname.endsWith(".local")) {
    const error = new Error("Blocked hostname");
    error.status = 400;
    throw error;
  }

  if (net.isIP(hostname)) {
    if ((net.isIPv4(hostname) && isPrivateIPv4(hostname)) || (net.isIPv6(hostname) && isPrivateIPv6(hostname))) {
      const error = new Error("Private/internal IPs are not allowed");
      error.status = 400;
      throw error;
    }
    return;
  }

  const lookupResults = await dns.lookup(hostname, { all: true });
  for (const result of lookupResults) {
    const ip = result.address;
    if ((result.family === 4 && isPrivateIPv4(ip)) || (result.family === 6 && isPrivateIPv6(ip))) {
      const error = new Error("Resolved private/internal IP is not allowed");
      error.status = 400;
      throw error;
    }
  }
}

module.exports = {
  assertSafeUrl
};
