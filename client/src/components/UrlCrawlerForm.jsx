import { useState } from "react";
import { ArrowRight, ShieldCheck, Plus, Loader } from "lucide-react";

export default function UrlCrawlerForm({ url, setUrl, onCrawl, onVerify, loading, onAddToQueue }) {
  const [isValidUrl, setIsValidUrl] = useState(null);

  function handleChange(e) {
    const val = e.target.value;
    setUrl(val);
    if (!val.trim()) { setIsValidUrl(null); return; }
    try { new URL(val.startsWith("http") ? val : `https://${val}`); setIsValidUrl(true); }
    catch { setIsValidUrl(false); }
  }

  function handleKey(e) {
    if (e.key === "Enter" && !loading) onCrawl();
  }

  const normalizedUrl = url.trim()
    ? (url.startsWith("http") ? url : `https://${url}`)
    : "";

  const canSubmit = !loading && url.trim() && isValidUrl !== false;

  return (
    <div className="card card-pad">
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
        <div>
          <div
            className="font-display"
            style={{ fontSize: "1.15rem", color: "var(--text-bright)", letterSpacing: "0.05em" }}
          >
            CRAWL TARGET
          </div>
          <div className="font-mono" style={{ fontSize: "0.62rem", color: "var(--text-muted)", marginTop: "0.1rem" }}>
            URL HASHED · SHA-256 · STORED ON SEPOLIA
          </div>
        </div>
        {loading && (
          <div className="badge badge-live" style={{ gap: "0.4rem" }}>
            <Loader size={9} style={{ animation: "spin 1s linear infinite" }} />
            Crawling
          </div>
        )}
      </div>

      {/* Input row */}
      <div style={{ display: "flex", gap: "0.5rem", alignItems: "stretch" }}>
        <div style={{ flex: 1, position: "relative" }}>
          <input
            type="text"
            className="input-field"
            value={url}
            onChange={handleChange}
            onKeyDown={handleKey}
            placeholder="https://example.com/path"
            style={{
              padding: "0.6rem 0.8rem",
              borderColor: isValidUrl === false
                ? "var(--red)"
                : isValidUrl === true
                ? "var(--border-bright)"
                : undefined,
            }}
            spellCheck={false}
            autoComplete="off"
            aria-label="URL to crawl"
          />
          {/* Validity indicator */}
          {isValidUrl !== null && (
            <span
              style={{
                position: "absolute", right: "0.75rem", top: "50%",
                transform: "translateY(-50%)",
                width: 6, height: 6, borderRadius: "50%",
                background: isValidUrl ? "var(--matrix)" : "var(--red)",
                boxShadow: isValidUrl ? "0 0 6px var(--matrix)" : "0 0 6px var(--red)",
              }}
            />
          )}
        </div>

        <button
          className="btn-primary"
          onClick={onCrawl}
          disabled={!canSubmit}
          title="Crawl URL (Enter)"
          style={{ minWidth: 100 }}
        >
          {loading
            ? <><div className="dot-pulse"><span/><span/><span/></div> Crawling</>
            : <><ArrowRight size={14} /> Crawl</>
          }
        </button>

        <button
          className="btn-secondary"
          onClick={onVerify}
          disabled={!canSubmit}
          title="Verify on blockchain"
          style={{ minWidth: 90 }}
        >
          <ShieldCheck size={14} /> Verify
        </button>

        {onAddToQueue && (
          <button
            className="btn-ghost"
            onClick={() => onAddToQueue(normalizedUrl)}
            disabled={!canSubmit}
            title="Add to queue"
            style={{ padding: "0 0.65rem" }}
          >
            <Plus size={14} />
          </button>
        )}
      </div>

      {/* Progress bar */}
      {loading && <div className="progress-bar" style={{ marginTop: "0.65rem" }} />}

      {/* Hints */}
      <div
        className="font-mono"
        style={{
          display: "flex", gap: "1.5rem", marginTop: "0.65rem",
          fontSize: "0.58rem", color: "var(--text-muted)",
        }}
      >
        <span>↵ Enter to crawl</span>
        <span>Duplicates detected on-chain</span>
        <span>Max 100 links extracted</span>
      </div>
    </div>
  );
}
