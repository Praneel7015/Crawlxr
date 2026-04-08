import { useState } from "react";
import { FileText, Copy, Check, ExternalLink, ChevronDown, ChevronUp, Link as LinkIcon } from "lucide-react";

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  function handleCopy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }
  return (
    <button className="btn-icon" onClick={handleCopy} style={{ fontSize: "0.65rem" }}>
      {copied ? (
        <>
          <Check size={10} style={{ color: "var(--green)" }} />
          Copied
        </>
      ) : (
        <>
          <Copy size={10} />
          Copy
        </>
      )}
    </button>
  );
}

function InfoRow({ label, children }) {
  return (
    <div style={{ marginBottom: "0.75rem" }}>
      <div className="label">{label}</div>
      {children}
    </div>
  );
}

export default function CrawlResultCard({ result, onCrawlLink }) {
  const [linksExpanded, setLinksExpanded] = useState(false);

  if (!result) return null;

  const explorerBase =
    import.meta.env.VITE_SEPOLIA_EXPLORER || "https://sepolia.etherscan.io/tx/";
  const displayLinks = linksExpanded ? result.links : result.links?.slice(0, 5);

  return (
    <div className="card fade-in" style={{ padding: "1.25rem" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "1rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <FileText size={14} style={{ color: "var(--text-muted)" }} />
          <span
            style={{
              fontSize: "0.72rem",
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--text-muted)",
            }}
          >
            Crawl Result
          </span>
        </div>
        <span className={result.duplicate ? "badge badge-dup" : "badge badge-new"}>
          {result.duplicate ? "Duplicate" : "New Crawl"}
        </span>
      </div>

      {/* Page title */}
      {result.title && (
        <InfoRow label="Page Title">
          <div
            style={{
              fontSize: "0.85rem",
              color: "var(--text-primary)",
              fontWeight: 500,
              lineHeight: 1.5,
            }}
          >
            {result.title}
          </div>
        </InfoRow>
      )}

      <hr className="sep" />

      {/* Content Hash */}
      <InfoRow label="Content Hash (SHA-256)">
        <div
          className="hash-display"
          style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
        >
          <span
            style={{
              flex: 1,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {result.contentHash}
          </span>
          <CopyButton text={result.contentHash} />
        </div>
      </InfoRow>

      {/* Transaction Hash */}
      {result.transactionHash && (
        <InfoRow label="Transaction Hash">
          <div
            className="hash-display"
            style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
          >
            <a
              href={`${explorerBase}${result.transactionHash}`}
              target="_blank"
              rel="noreferrer"
              style={{
                flex: 1,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                color: "var(--blue)",
                textDecoration: "none",
              }}
            >
              {result.transactionHash}
            </a>
            <CopyButton text={result.transactionHash} />
            <a
              href={`${explorerBase}${result.transactionHash}`}
              target="_blank"
              rel="noreferrer"
              className="btn-icon"
              style={{ textDecoration: "none" }}
            >
              <ExternalLink size={10} />
              View
            </a>
          </div>
        </InfoRow>
      )}

      {/* Metadata grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "0.6rem",
          marginBottom: "0.75rem",
        }}
      >
        {result.crawler && (
          <div>
            <div className="label">Crawler Address</div>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.72rem",
                color: "var(--text-secondary)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
              title={result.crawler}
            >
              {result.crawler.slice(0, 6)}...{result.crawler.slice(-4)}
            </div>
          </div>
        )}
        {result.crawlerNodeId && (
          <div>
            <div className="label">Node ID</div>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.72rem",
                color: "var(--text-secondary)",
              }}
            >
              {result.crawlerNodeId}
            </div>
          </div>
        )}
        {result.blockchainTimestamp && (
          <div>
            <div className="label">On-chain Time</div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
              {new Date(result.blockchainTimestamp * 1000).toLocaleString()}
            </div>
          </div>
        )}
        {result.timestamp && (
          <div>
            <div className="label">Crawled At</div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
              {new Date(result.timestamp).toLocaleString()}
            </div>
          </div>
        )}
      </div>

      {/* Extracted links */}
      {Array.isArray(result.links) && result.links.length > 0 && (
        <>
          <hr className="sep" />
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "0.5rem",
              }}
            >
              <div className="label" style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <LinkIcon size={11} />
                Extracted Links
                <span
                  style={{
                    marginLeft: "0.25rem",
                    color: "var(--accent)",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  {result.links.length}
                </span>
              </div>
              {result.links.length > 5 && (
                <button
                  className="btn-icon"
                  onClick={() => setLinksExpanded((x) => !x)}
                  style={{ fontSize: "0.65rem" }}
                >
                  {linksExpanded ? (
                    <>
                      <ChevronUp size={10} /> Show less
                    </>
                  ) : (
                    <>
                      <ChevronDown size={10} /> Show all {result.links.length}
                    </>
                  )}
                </button>
              )}
            </div>
            <div
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-sm)",
                padding: "0.3rem",
                maxHeight: linksExpanded ? "220px" : "auto",
                overflowY: linksExpanded ? "auto" : "visible",
              }}
            >
              {displayLinks.map((link) => (
                <div
                  key={link}
                  className="link-item"
                  style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "0.4rem" }}
                  onClick={() => onCrawlLink && onCrawlLink(link)}
                  title={`Click to crawl: ${link}`}
                >
                  <LinkIcon size={9} style={{ flexShrink: 0, opacity: 0.5 }} />
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{link}</span>
                </div>
              ))}
            </div>
            {!linksExpanded && result.links.length > 5 && (
              <div
                style={{
                  fontSize: "0.65rem",
                  color: "var(--text-muted)",
                  marginTop: "0.3rem",
                  textAlign: "right",
                }}
              >
                +{result.links.length - 5} more links
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
