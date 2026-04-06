const CrawlRecord = require("../models/CrawlRecord");
const crawlService = require("../services/crawlService");
const hashService = require("../services/hashService");
const ssrfService = require("../services/ssrfService");
const contractService = require("../blockchain/crawlerContractService");

async function crawl(req, res, next) {
  try {
    const { url } = req.body;
    await ssrfService.assertSafeUrl(url);

    const existing = await contractService.verifyCrawl(url);
    if (existing.exists) {
      const priorRecord = await CrawlRecord.findOne({ url }).sort({ crawledAt: -1 }).lean();

      return res.status(200).json({
        duplicate: true,
        message: "URL already crawled on-chain",
        url,
        title: priorRecord?.title || "N/A",
        links: priorRecord?.links || [],
        contentHash: existing.contentHash,
        transactionHash: priorRecord?.txHash || null,
        crawler: existing.crawler,
        crawlerNodeId: priorRecord?.crawlerNodeId || "unknown",
        blockchainTimestamp: existing.timestamp,
        timestamp: priorRecord?.crawledAt || null
      });
    }

    const page = await crawlService.crawlUrl(url);
    const contentHash = hashService.sha256(page.html);
    const contentHashBytes32 = hashService.toBytes32(contentHash);

    if (process.env.REQUIRE_NODE_REGISTRATION === "true") {
      await contractService.registerNodeIfRequired();
      await contractService.claimTask(url);
    }

    const tx = await contractService.addCrawlRecord(url, contentHashBytes32);

    const record = await CrawlRecord.create({
      url,
      title: page.title,
      links: page.links,
      contentHash,
      txHash: tx.hash,
      crawlerAddress: tx.from,
      crawlerNodeId: process.env.CRAWLER_NODE_ID || "node-1",
      crawledAt: new Date()
    });

    return res.status(201).json({
      duplicate: false,
      url,
      title: record.title,
      links: record.links,
      contentHash: record.contentHash,
      transactionHash: record.txHash,
      crawler: record.crawlerAddress,
      crawlerNodeId: record.crawlerNodeId,
      timestamp: record.crawledAt
    });
  } catch (error) {
    return next(error);
  }
}

async function verify(req, res, next) {
  try {
    const decodedUrl = decodeURIComponent(req.params.url);

    const result = await contractService.verifyCrawl(decodedUrl);
    if (!result.exists) {
      return res.status(404).json({
        exists: false,
        url: decodedUrl,
        message: "No blockchain crawl record found"
      });
    }

    return res.status(200).json({
      exists: true,
      url: decodedUrl,
      contentHash: result.contentHash,
      timestamp: result.timestamp,
      crawler: result.crawler
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  crawl,
  verify
};
