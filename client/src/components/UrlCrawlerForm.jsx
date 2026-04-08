import { Search, ArrowRight, ShieldCheck } from "lucide-react";

export default function UrlCrawlerForm({ url, setUrl, onCrawl, onVerify, loading }) {
  function handleKey(e) {
    if (e.key === "Enter" && !loading) onCrawl();
  }

  return (
    <div className="card" style={{ padding: "1.5rem" }}>
      {/* Title row */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.25rem" }}>
        <div
          style={{
            width: 32,
            height: 32,
            background: "var(--accent-glow)",
            border: "1px solid var(--accent)",
            borderRadius: 8,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            color: "var(--accent)",
          }}
        >
          <Search size={15} />
        </div>
        <div>
          <div
            style={{
              fontSize: "0.9rem",
              fontWeight: 600,
              color: "var(--text-bright)",
              letterSpacing: "-0.01em",
            }}
          >
            Crawl a URL
          </div>
          <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: 1 }}>
            Content is hashed and stored on Ethereum Sepolia
          </div>
        </div>
      </div>

      {/* Input + buttons */}
      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
        <div style={{ flex: 1, position: "relative" }}>
          <span
            style={{
              position: "absolute",
              left: "0.75rem",
              top: "50%",
              transform: "translateY(-50%)",
              fontFamily: "var(--font-mono)",
              fontSize: "0.75rem",
              color: "var(--text-muted)",
              pointerEvents: "none",
              userSelect: "none",
            }}
          >
            https://
          </span>
          <input
            id="crawl-url-input"
            type="url"
            className="input-field"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={handleKey}
            placeholder="example.com"
            style={{ paddingLeft: "4.5rem" }}
            spellCheck={false}
            autoComplete="off"
          />
        </div>

        <button id="crawl-btn" className="btn-primary" onClick={onCrawl} disabled={loading || !url.trim()}>
          {loading ? (
            <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span className="dot-pulse" style={{ display: "inline-flex", gap: 3 }}>
                <span style={{ width: 4, height: 4 }} />
                <span style={{ width: 4, height: 4, margin: 0 }} />
                <span style={{ width: 4, height: 4 }} />
              </span>
              Crawling
            </span>
          ) : (
            <span style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
              <ArrowRight size={14} />
              Crawl
            </span>
          )}
        </button>

        <button id="verify-btn" className="btn-secondary" onClick={onVerify} disabled={loading || !url.trim()}>
          <span style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
            <ShieldCheck size={14} />
            Verify
          </span>
        </button>
      </div>

      {/* Progress bar */}
      {loading && <div className="progress-bar" style={{ marginTop: "0.75rem" }} />}

      {/* Hint */}
      <div
        style={{
          marginTop: "0.75rem",
          fontSize: "0.68rem",
          color: "var(--text-muted)",
          display: "flex",
          gap: "1.25rem",
        }}
      >
        <span>Press Enter to crawl</span>
        <span>SHA-256 content hash</span>
        <span>EVM duplicate detection</span>
      </div>
    </div>
  );
}
