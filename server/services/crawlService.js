const axios = require("axios");
const cheerio = require("cheerio");

function asPositiveInt(value, fallback) {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  if (Number.isNaN(parsed) || parsed <= 0) {
    return fallback;
  }
  return parsed;
}

const MAX_LINKS = asPositiveInt(process.env.CRAWL_MAX_LINKS, 100);
const STATIC_TIMEOUT_MS = asPositiveInt(process.env.CRAWL_STATIC_TIMEOUT_MS, 30000);
const BROWSER_TIMEOUT_MS = asPositiveInt(process.env.CRAWL_BROWSER_TIMEOUT_MS, 45000);
const BROWSER_WAIT_MS = asPositiveInt(process.env.CRAWL_BROWSER_WAIT_MS, 6000);
const BROWSER_FALLBACK_ENABLED = process.env.BROWSER_CRAWL_ENABLED !== "false";

const DEFAULT_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

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
    } catch (error) {
      if (process.env.DEBUG_CRAWLER === "true") {
        console.debug("Discarded invalid link while normalizing:", error.message);
      }
      return;
    }
  });

  return Array.from(normalized).slice(0, MAX_LINKS);
}

function extractLinksAndTitle(baseUrl, html) {
  const $ = cheerio.load(html);
  const title = $("title").first().text().trim() || "Untitled";
  const links = normalizeAndFilterLinks(
    baseUrl,
    $("a")
      .map((_, el) => $(el).attr("href"))
      .get()
  );

  return { title, links };
}

function looksLikeDynamicOrBotProtected(html, linkCount) {
  const lower = String(html || "").toLowerCase();
  const markers = [
    "enable javascript",
    "checking your browser",
    "cf-browser-verification",
    "challenge-platform",
    "captcha",
    "data-reactroot",
    "id=\"__next\"",
    "id=\"app\"",
    "type=\"module\"",
  ];

  if (linkCount === 0) {
    return true;
  }

  return markers.some((marker) => lower.includes(marker)) && linkCount < 5;
}

async function fetchStatic(url) {
  const response = await axios.get(url, {
    timeout: STATIC_TIMEOUT_MS,
    maxContentLength: 10 * 1024 * 1024,
    maxBodyLength: 10 * 1024 * 1024,
    maxRedirects: 5,
    headers: {
      "User-Agent": DEFAULT_USER_AGENT,
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
      "Cache-Control": "no-cache",
    },
    responseType: "text",
    validateStatus: (status) => status >= 200 && status < 400,
  });

  const html = response.data;
  const { title, links } = extractLinksAndTitle(url, html);
  return { title, links, html, source: "static" };
}

function loadPlaywrightChromium() {
  try {
    const { chromium } = require("playwright");
    return chromium;
  } catch (error) {
    if (process.env.DEBUG_CRAWLER === "true") {
      console.warn("Playwright unavailable, using static crawl only:", error.message);
    }
    return null;
  }
}

async function fetchRendered(url) {
  const chromium = loadPlaywrightChromium();
  if (!chromium) {
    throw new Error("Playwright is not installed. Run: npm install playwright");
  }

  let browser;
  try {
    browser = await chromium.launch({ headless: true });

    const context = await browser.newContext({
      userAgent: DEFAULT_USER_AGENT,
      locale: "en-US",
      viewport: { width: 1440, height: 900 },
      extraHTTPHeaders: {
        "Accept-Language": "en-US,en;q=0.9",
      },
    });

    await context.addInitScript(() => {
      Object.defineProperty(navigator, "webdriver", {
        get: () => undefined,
      });
    });

    const page = await context.newPage();
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: BROWSER_TIMEOUT_MS });

    await page.waitForLoadState("networkidle", { timeout: BROWSER_WAIT_MS }).catch(() => {});
    await page
      .waitForFunction(() => document.querySelectorAll("a[href]").length > 0, {
        timeout: BROWSER_WAIT_MS,
      })
      .catch(() => {});

    const [title, html, rawLinks] = await Promise.all([
      page.title(),
      page.content(),
      page.$$eval("a[href]", (anchors) => anchors.map((a) => a.getAttribute("href"))),
    ]);

    await context.close();

    return {
      title: String(title || "").trim() || "Untitled",
      links: normalizeAndFilterLinks(url, rawLinks),
      html,
      source: "browser",
    };
  } finally {
    if (browser) {
      await browser.close().catch(() => {});
    }
  }
}

async function crawlUrl(url) {
  let staticResult = null;
  let staticError = null;

  try {
    staticResult = await fetchStatic(url);
  } catch (error) {
    staticError = error;
  }

  const shouldRender =
    BROWSER_FALLBACK_ENABLED &&
    (!staticResult || looksLikeDynamicOrBotProtected(staticResult.html, staticResult.links.length));

  if (shouldRender) {
    try {
      const renderedResult = await fetchRendered(url);
      if (!staticResult) {
        return renderedResult;
      }

      if (renderedResult.links.length >= staticResult.links.length) {
        return renderedResult;
      }

      return {
        title: staticResult.title === "Untitled" ? renderedResult.title : staticResult.title,
        links: normalizeAndFilterLinks(url, [...staticResult.links, ...renderedResult.links]),
        html: renderedResult.html || staticResult.html,
      };
    } catch (renderError) {
      if (process.env.DEBUG_CRAWLER === "true") {
        console.warn("Rendered crawl fallback failed:", renderError.message);
      }
    }
  }

  if (staticResult) {
    return staticResult;
  }

  throw staticError || new Error("Failed to crawl URL");
}

module.exports = {
  crawlUrl
};
