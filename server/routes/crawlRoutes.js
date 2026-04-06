const express = require("express");

const crawlController = require("../controllers/crawlController");
const validateRequest = require("../middleware/validateRequest");

const router = express.Router();

router.post("/crawl", validateRequest.validateCrawlRequest, validateRequest.handleValidation, crawlController.crawl);
router.get("/verify/:url", crawlController.verify);

module.exports = router;
