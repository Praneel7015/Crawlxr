const mongoose = require("mongoose");

const crawlRecordSchema = new mongoose.Schema(
  {
    url: { type: String, required: true, index: true },
    title: { type: String, default: "Untitled" },
    links: { type: [String], default: [] },
    contentHash: { type: String, required: true },
    txHash: { type: String, required: true, unique: true },
    crawlerAddress: { type: String, required: true },
    crawlerNodeId: { type: String, required: true },
    crawledAt: { type: Date, required: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model("CrawlRecord", crawlRecordSchema);
