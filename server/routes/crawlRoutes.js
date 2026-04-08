const express = require("express");
const c = require("../controllers/crawlController");
const { validateCrawlRequest, handleValidation } = require("../middleware/validateRequest");

const router = express.Router();

// Core
router.post("/crawl",          validateCrawlRequest, handleValidation, c.crawl);
router.get("/verify/:url",     c.verify);
router.get("/history",         c.history);
router.get("/stats",           c.stats);
router.get("/graph",           c.graph);

// Enhanced
router.get("/search",          c.search);        // ?q=query
router.get("/domains",         c.domainStats);   // domain breakdown
router.get("/url-history/:url", c.urlHistory);   // hash change timeline
router.get("/export",          c.exportData);    // ?format=json|csv
router.get("/wallet/:address/summary", c.walletSummary);

module.exports = router;
