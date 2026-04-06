const express = require("express");
const helmet = require("helmet");
const cors = require("cors");

const crawlRoutes = require("./routes/crawlRoutes");
const limiter = require("./middleware/rateLimiter");
const errorHandler = require("./middleware/errorHandler");

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGIN || "*"
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(limiter);

app.get("/health", (_, res) => {
  res.json({ ok: true, service: "crawler-server" });
});

app.use("/api", crawlRoutes);
app.use(errorHandler);

module.exports = app;
