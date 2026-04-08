const express = require("express");
const crawlController = require("../controllers/crawlController");
const { validateCrawlRequest, handleValidation } = require("../middleware/validateRequest");

const router = express.Router();

router.post("/crawl",         validateCrawlRequest, handleValidation, crawlController.crawl);
router.get("/verify/:url",    crawlController.verify);
router.get("/history",        crawlController.history);
router.get("/stats",          crawlController.stats);
router.get("/graph",          crawlController.graph);

module.exports = router;
