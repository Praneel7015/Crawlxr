const axios = require("axios");
const cheerio = require("cheerio");

function normalizeAndFilterLinks(baseUrl, rawLinks) {
  const normalized = new Set();

  rawLinks.forEach((href) => {
    if (!href || typeof href !== "string") {
      return;
    }

    try {
      const absolute = new URL(href, baseUrl);
      if (!["http:", "https:"].includes(absolute.protocol)) {
        return;
      }
      normalized.add(absolute.toString());
    } catch (_) {
      return;
    }
  });

  return Array.from(normalized).slice(0, 100);
}

async function crawlUrl(url) {
  const response = await axios.get(url, {
    timeout: 30000,
    maxContentLength: 10 * 1024 * 1024,
    maxBodyLength: 10 * 1024 * 1024,
    maxRedirects: 5,
    headers: {
      "User-Agent": "DecentralizedCrawler/1.0"
    },
    responseType: "text",
    validateStatus: (status) => status >= 200 && status < 400
  });

  const html = response.data;
  const $ = cheerio.load(html);
  const title = $("title").first().text().trim() || "Untitled";
  const links = normalizeAndFilterLinks(
    url,
    $("a")
      .map((_, el) => $(el).attr("href"))
      .get()
  );

  return { title, links, html };
}

module.exports = {
  crawlUrl
};
