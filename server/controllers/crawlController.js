const CrawlRecord = require("../models/CrawlRecord");
const { ethers } = require("ethers");
const crawlService = require("../services/crawlService");
const hashService = require("../services/hashService");
const ssrfService = require("../services/ssrfService");
const contractService = require("../blockchain/crawlerContractService");

const rpcProvider = new ethers.JsonRpcProvider(process.env.RPC_URL);

async function sendDuplicateCrawlResponse(res, url, onChainRecord) {
  const prior = await CrawlRecord.findOne({ url }).sort({ crawledAt: -1 }).lean();

  return res.status(200).json({
    duplicate: true,
    message: "URL already crawled on-chain",
    url,
    title: prior?.title || "N/A",
    links: prior?.links || [],
    contentHash: onChainRecord.contentHash,
    transactionHash: prior?.txHash || null,
    crawler: onChainRecord.crawler,
    crawlerNodeId: prior?.crawlerNodeId || "unknown",
    blockchainTimestamp: onChainRecord.timestamp,
    timestamp: prior?.crawledAt || null,
  });
}

async function handleClaimPreconditions(res, url) {
  if (process.env.REQUIRE_NODE_REGISTRATION !== "true") {
    return null;
  }

  await contractService.registerNodeIfRequired();
  const claimResult = await contractService.claimTask(url);

  if (claimResult.reason === "already-crawled") {
    const latestOnChain = await contractService.verifyCrawl(url);
    if (latestOnChain.exists) {
      return sendDuplicateCrawlResponse(res, url, latestOnChain);
    }
  }

  if (claimResult.reason === "already-claimed") {
    return res.status(409).json({
      duplicate: false,
      message: "Crawl task already claimed by another node. Try again shortly.",
      url,
      claimer: claimResult.claimer || null,
    });
  }

  return null;
}

async function addCrawlRecordWithConflictHandling(res, url, contentHashBytes32) {
  try {
    const tx = await contractService.addCrawlRecord(url, contentHashBytes32);
    return { tx };
  } catch (chainError) {
    if (chainError.code === "URL_ALREADY_CRAWLED_ON_CHAIN") {
      const latestOnChain = await contractService.verifyCrawl(url);
      if (latestOnChain.exists) {
        return { response: await sendDuplicateCrawlResponse(res, url, latestOnChain) };
      }
    }

    if (chainError.code === "TASK_CLAIMED_BY_ANOTHER_NODE") {
      return {
        response: res.status(409).json({
          duplicate: false,
          message: "Crawl task claimed by another node. Retry later.",
          url,
        }),
      };
    }

    throw chainError;
  }
}

/* ── POST /api/crawl ─────────────────────────────────── */
async function crawl(req, res, next) {
  try {
    const { url } = req.body;
    await ssrfService.assertSafeUrl(url);

    const existing = await contractService.verifyCrawl(url);
    if (existing.exists) {
      return sendDuplicateCrawlResponse(res, url, existing);
    }

    const page = await crawlService.crawlUrl(url);
    const contentHash = hashService.sha256(page.html);
    const contentHashBytes32 = hashService.toBytes32(contentHash);

    const claimResponse = await handleClaimPreconditions(res, url);
    if (claimResponse) {
      return claimResponse;
    }

    const chainWrite = await addCrawlRecordWithConflictHandling(res, url, contentHashBytes32);
    if (chainWrite.response) {
      return chainWrite.response;
    }
    const tx = chainWrite.tx;

    const record = await CrawlRecord.create({
      url,
      title: page.title,
      links: page.links,
      contentHash,
      txHash: tx.hash,
      crawlerAddress: tx.from,
      crawlerNodeId: process.env.CRAWLER_NODE_ID || "node-1",
      crawledAt: new Date(),
    });

    return res.status(201).json({
      duplicate: false, url,
      title: record.title, links: record.links,
      contentHash: record.contentHash, transactionHash: record.txHash,
      crawler: record.crawlerAddress, crawlerNodeId: record.crawlerNodeId,
      timestamp: record.crawledAt,
    });
  } catch (error) { return next(error); }
}

/* ── GET /api/verify/:url ────────────────────────────── */
async function verify(req, res, next) {
  try {
    const decodedUrl = decodeURIComponent(req.params.url);
    const result = await contractService.verifyCrawl(decodedUrl);
    if (!result.exists) {
      return res.status(404).json({ exists: false, url: decodedUrl, message: "No blockchain crawl record found" });
    }
    return res.status(200).json({
      exists: true, url: decodedUrl,
      contentHash: result.contentHash,
      timestamp: result.timestamp,
      crawler: result.crawler,
    });
  } catch (error) { return next(error); }
}

/* ── GET /api/history ────────────────────────────────── */
async function history(req, res, next) {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const records = await CrawlRecord.find({})
      .sort({ crawledAt: -1 }).limit(limit)
      .select("url title links crawledAt txHash crawlerNodeId").lean();

    const seenUrls = new Set();
    const enriched = records.map(r => {
      const isDup = seenUrls.has(r.url);
      seenUrls.add(r.url);
      return { ...r, duplicate: isDup };
    });
    return res.status(200).json(enriched);
  } catch (error) { return next(error); }
}

/* ── GET /api/stats ──────────────────────────────────── */
async function stats(req, res, next) {
  try {
    const [total, uniqueUrls] = await Promise.all([
      CrawlRecord.countDocuments(),
      CrawlRecord.distinct("url").then(u => u.length),
    ]);
    const duplicates = total - uniqueUrls;
    return res.status(200).json({ total, unique: uniqueUrls, duplicates, verified: uniqueUrls });
  } catch (error) { return next(error); }
}

/* ── GET /api/graph ──────────────────────────────────── */
async function graph(req, res, next) {
  try {
    const records = await CrawlRecord.find({})
      .select("url title links crawledAt contentHash").lean();

    const nodesMap = new Map();
    const links = [];
    const addNode = (id, data = {}) => {
      nodesMap.set(id, { ...nodesMap.get(id), id, ...data });
    };

    records.forEach(record => {
      addNode(record.url, {
        crawled: true, title: record.title,
        crawledAt: record.crawledAt, contentHash: record.contentHash,
        linkCount: record.links?.length ?? 0,
      });
      (record.links || []).forEach(linkUrl => {
        addNode(linkUrl, { discovered: true });
        links.push({ source: record.url, target: linkUrl });
      });
    });

    return res.status(200).json({ nodes: Array.from(nodesMap.values()), links });
  } catch (error) { return next(error); }
}

/* ── GET /api/search?q=... ───────────────────────────── */
async function search(req, res, next) {
  try {
    const { q, limit = 20 } = req.query;
    if (!q || !q.trim()) return res.status(400).json({ message: "Query required" });

    const regex = new RegExp(q.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    const records = await CrawlRecord.find({ $or: [{ url: regex }, { title: regex }] })
      .sort({ crawledAt: -1 })
      .limit(Math.min(parseInt(limit), 50))
      .select("url title links crawledAt txHash contentHash")
      .lean();

    return res.status(200).json(records);
  } catch (error) { return next(error); }
}

/* ── GET /api/domains ────────────────────────────────── */
async function domainStats(req, res, next) {
  try {
    const records = await CrawlRecord.find({}).select("url links crawledAt").lean();
    const domains = new Map();

    records.forEach(r => {
      let host;
      try { host = new URL(r.url).hostname.replace(/^www\./, ""); }
      catch { return; }
      const d = domains.get(host) || { domain: host, crawls: 0, links: 0, lastCrawled: null };
      d.crawls++;
      d.links += r.links?.length ?? 0;
      if (!d.lastCrawled || new Date(r.crawledAt) > new Date(d.lastCrawled)) {
        d.lastCrawled = r.crawledAt;
      }
      domains.set(host, d);
    });

    const result = Array.from(domains.values()).sort((a, b) => b.crawls - a.crawls);
    return res.status(200).json(result);
  } catch (error) { return next(error); }
}

/* ── GET /api/url-history/:url ───────────────────────── */
async function urlHistory(req, res, next) {
  try {
    const decodedUrl = decodeURIComponent(req.params.url);
    const records = await CrawlRecord.find({ url: decodedUrl })
      .sort({ crawledAt: -1 })
      .select("contentHash crawledAt txHash crawlerNodeId")
      .lean();

    // Annotate with hash change detection
    const annotated = records.map((r, i) => ({
      ...r,
      hashChanged: i < records.length - 1 ? r.contentHash !== records[i + 1].contentHash : null,
    }));

    return res.status(200).json(annotated);
  } catch (error) { return next(error); }
}

/* ── GET /api/export ─────────────────────────────────── */
async function exportData(req, res, next) {
  try {
    const { format = "json", limit = 500 } = req.query;
    const records = await CrawlRecord.find({})
      .sort({ crawledAt: -1 })
      .limit(Math.min(parseInt(limit), 1000))
      .lean();

    if (format === "csv") {
      const header = "url,title,contentHash,txHash,crawlerAddress,crawlerNodeId,crawledAt,linkCount";
      const rows = records.map(r =>
        [r.url, r.title, r.contentHash, r.txHash, r.crawlerAddress, r.crawlerNodeId, r.crawledAt, r.links?.length ?? 0]
          .map(v => `"${String(v ?? "").replace(/"/g, '""')}"`)
          .join(",")
      );
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", "attachment; filename=crawlxr-export.csv");
      return res.send([header, ...rows].join("\n"));
    }

    res.setHeader("Content-Type", "application/json");
    res.setHeader("Content-Disposition", "attachment; filename=crawlxr-export.json");
    return res.json({ exported: records.length, records });
  } catch (error) { return next(error); }
}

/* ── GET /api/wallet/:address/summary ──────────────── */
async function walletSummary(req, res, next) {
  try {
    const rawAddress = req.params.address;
    if (!ethers.isAddress(rawAddress)) {
      return res.status(400).json({ message: "Invalid wallet address" });
    }

    const address = ethers.getAddress(rawAddress);

    const [network, balanceWei, txCount] = await Promise.all([
      rpcProvider.getNetwork(),
      rpcProvider.getBalance(address),
      rpcProvider.getTransactionCount(address, "latest"),
    ]);

    const records = await CrawlRecord.find({
      crawlerAddress: new RegExp(`^${address}$`, "i"),
    })
      .sort({ crawledAt: -1 })
      .limit(25)
      .select("url txHash crawledAt")
      .lean();

    const txBreakdown = await Promise.all(
      records.map(async (record) => {
        if (!record.txHash) return null;
        try {
          const receipt = await rpcProvider.getTransactionReceipt(record.txHash);
          if (!receipt) return null;
          const gasUsed = receipt.gasUsed ?? 0n;
          const gasPriceWei = receipt.effectiveGasPrice ?? receipt.gasPrice ?? 0n;
          const costWei = gasUsed * gasPriceWei;
          return {
            hash: record.txHash,
            url: record.url,
            crawledAt: record.crawledAt,
            gasUsed,
            gasPriceWei,
            costWei,
          };
        } catch {
          return null;
        }
      })
    );

    const validTx = txBreakdown.filter(Boolean);
    const gasUsedTotal = validTx.reduce((sum, tx) => sum + tx.gasUsed, 0n);
    const gasCostWeiTotal = validTx.reduce((sum, tx) => sum + tx.costWei, 0n);
    const lastAppTx = validTx[0]
      ? {
          hash: validTx[0].hash,
          url: validTx[0].url,
          crawledAt: validTx[0].crawledAt,
          gasUsed: validTx[0].gasUsed.toString(),
          gasPriceWei: validTx[0].gasPriceWei.toString(),
          costWei: validTx[0].costWei.toString(),
          costEth: ethers.formatEther(validTx[0].costWei),
        }
      : null;

    return res.status(200).json({
      address,
      network: {
        chainId: Number(network.chainId),
        name: network.name || "unknown",
      },
      balanceWei: balanceWei.toString(),
      balanceEth: ethers.formatEther(balanceWei),
      txCount,
      appTransactions: records.length,
      gasUsedTotal: gasUsedTotal.toString(),
      gasCostWeiTotal: gasCostWeiTotal.toString(),
      gasCostEthTotal: ethers.formatEther(gasCostWeiTotal),
      tokensLeftEth: ethers.formatEther(balanceWei),
      tokensUsedEth: ethers.formatEther(gasCostWeiTotal),
      lastAppTx,
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  crawl,
  verify,
  history,
  stats,
  graph,
  search,
  domainStats,
  urlHistory,
  exportData,
  walletSummary,
};
