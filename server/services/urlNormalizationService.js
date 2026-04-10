const TRACKING_PARAM_PATTERNS = [
  /^utm_/i,
  /^fbclid$/i,
  /^gclid$/i,
  /^igshid$/i,
  /^mc_cid$/i,
  /^mc_eid$/i,
  /^mkt_tok$/i,
];

function hasScheme(value) {
  return /^[a-z][a-z\d+\-.]*:\/\//i.test(value);
}

function ensureHttpScheme(value) {
  const trimmed = String(value || "").trim();
  if (!trimmed) {
    throw new Error("URL is required");
  }
  return hasScheme(trimmed) ? trimmed : `https://${trimmed}`;
}

function shouldDropParam(name) {
  return TRACKING_PARAM_PATTERNS.some((pattern) => pattern.test(name));
}

function normalizeHostname(parsed, stripWww) {
  const normalizedHostname = parsed.hostname.toLowerCase();
  parsed.hostname = stripWww ? normalizedHostname.replace(/^www\./i, "") : normalizedHostname;
}

function normalizePort(parsed) {
  if ((parsed.protocol === "https:" && parsed.port === "443") ||
      (parsed.protocol === "http:" && parsed.port === "80")) {
    parsed.port = "";
  }
}

function normalizePathname(parsed, removeTrailingSlash) {
  if (!removeTrailingSlash) {
    return;
  }

  const collapsedPath = parsed.pathname.replaceAll(/\/{2,}/g, "/");
  parsed.pathname = collapsedPath === "/" ? "" : collapsedPath.replace(/\/+$/, "");
}

function collectQueryEntries(parsed, dropTrackingParams) {
  const entries = Array.from(parsed.searchParams.entries());
  if (!dropTrackingParams) {
    return entries;
  }

  return entries.filter(([name]) => !shouldDropParam(name));
}

function sortQueryEntries(entries, sortQuery) {
  if (!sortQuery) {
    return entries;
  }

  return [...entries].sort(([aKey, aVal], [bKey, bVal]) => {
    if (aKey === bKey) {
      return aVal.localeCompare(bVal);
    }
    return aKey.localeCompare(bKey);
  });
}

function applyQueryEntries(parsed, entries) {
  parsed.search = "";
  for (const [name, value] of entries) {
    parsed.searchParams.append(name, value);
  }
}

function normalizeUrl(input, options = {}) {
  const {
    stripWww = true,
    removeTrailingSlash = true,
    dropTrackingParams = true,
    sortQuery = true,
  } = options;

  const parsed = new URL(ensureHttpScheme(input));

  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error("Only HTTP/HTTPS URLs are supported");
  }

  parsed.protocol = parsed.protocol.toLowerCase();
  parsed.username = "";
  parsed.password = "";
  parsed.hash = "";

  normalizeHostname(parsed, stripWww);
  normalizePort(parsed);
  normalizePathname(parsed, removeTrailingSlash);

  const queryEntries = collectQueryEntries(parsed, dropTrackingParams);
  const sortedEntries = sortQueryEntries(queryEntries, sortQuery);
  applyQueryEntries(parsed, sortedEntries);

  return parsed.toString();
}

function buildDuplicateCandidates(input) {
  const candidates = new Set();
  const raw = String(input || "").trim();

  if (!raw) {
    return [];
  }

  candidates.add(raw);

  const optionVariants = [
    { stripWww: true, removeTrailingSlash: true },
    { stripWww: true, removeTrailingSlash: false },
    { stripWww: false, removeTrailingSlash: true },
    { stripWww: false, removeTrailingSlash: false },
  ];

  for (const variant of optionVariants) {
    try {
      candidates.add(normalizeUrl(raw, variant));
    } catch (error) {
      if (process.env.DEBUG_CRAWLER === "true") {
        console.debug("URL candidate normalization skipped:", error.message);
      }
    }
  }

  return Array.from(candidates);
}

module.exports = {
  ensureHttpScheme,
  normalizeUrl,
  buildDuplicateCandidates,
};
