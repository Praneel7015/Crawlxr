import { useState } from "react";
import {
  FileSearch, Copy, Check, ExternalLink,
  ChevronDown, ChevronUp, Link2, Hash, Clock, User, Cpu,
  TrendingUp
} from "lucide-react";

function CopyBtn({ text, label = "" }) {
  const [done, setDone] = useState(false);
  return (
    <button
      className="btn-ghost"
      onClick={() => navigator.clipboard.writeText(text).then(() => { setDone(true); setTimeout(() => setDone(false), 1400); })}
      style={{ padding: "0.18rem 0.45rem", fontSize: "0.62rem" }}
    >
      {done
        ? <><Check size={9} style={{ color: "var(--matrix)" }} /> Copied</>
        : <><Copy size={9} /> {label}</>
      }
    </button>
  );
}

function FieldRow({ icon: Icon, label, children }) {
  return (
    <div style={{ marginBottom: "0.7rem" }}>
      <div className="label">
        <Icon size={9} />{label}
      </div>
      {children}
    </div>
  );
}

export default function CrawlResultCard({ result, onCrawlLink }) {
  const [linksExpanded, setLinksExpanded] = useState(false);
  if (!result) return null;

  const explorerBase = import.meta.env.VITE_SEPOLIA_EXPLORER || "https://sepolia.etherscan.io/tx/";
  const links = result.links ?? [];
  const displayLinks = linksExpanded ? links : links.slice(0, 6);

  return (
    <div className="card card-pad fade-in">
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <FileSearch size={14} style={{ color: "var(--signal-dim)" }} />
          <span
            className="font-display"
            style={{ fontSize: "0.95rem", color: "var(--text-bright)", letterSpacing: "0.05em" }}
          >
            CRAWL RESULT
          </span>
        </div>
        <span className={result.duplicate ? "badge badge-dup" : "badge badge-new"}>
          {result.duplicate ? "⚡ Duplicate" : "✦ New Record"}
        </span>
      </div>

      {/* Page title */}
      {result.title && (
        <div
          style={{
            background: "var(--surface)", border: "1px solid var(--border)",
            borderRadius: "var(--r-sm)", padding: "0.65rem 0.85rem",
            fontWeight: 500, color: "var(--text-bright)", fontSize: "0.88rem",
            lineHeight: 1.4, marginBottom: "0.85rem",
          }}
        >
          {result.title}
        </div>
      )}

      {/* Transaction-style data grid */}
      <div style={{ borderTop: "1px solid var(--border-dim)", paddingTop: "0.85rem" }}>

        <FieldRow icon={Hash} label="Content Hash (SHA-256)">
          <div className="hash-box" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {result.contentHash}
            </span>
            <CopyBtn text={result.contentHash} />
          </div>
        </FieldRow>

        {result.transactionHash && (
          <FieldRow icon={TrendingUp} label="Blockchain TX">
            <div className="hash-box" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <a
                href={`${explorerBase}${result.transactionHash}`}
                target="_blank"
                rel="noreferrer"
                style={{
                  flex: 1, overflow: "hidden", textOverflow: "ellipsis",
                  whiteSpace: "nowrap", color: "var(--signal)", textDecoration: "none",
                  fontSize: "0.7rem",
                }}
              >
                {result.transactionHash}
              </a>
              <CopyBtn text={result.transactionHash} />
              <a
                href={`${explorerBase}${result.transactionHash}`}
                target="_blank"
                rel="noreferrer"
                className="btn-ghost"
                style={{ textDecoration: "none", padding: "0.18rem 0.45rem", fontSize: "0.62rem" }}
              >
                <ExternalLink size={9} /> Etherscan
              </a>
            </div>
          </FieldRow>
        )}

        {/* Meta grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.6rem", marginBottom: "0.7rem" }}>
          {result.crawler && (
            <div>
              <div className="label"><User size={9} /> Crawler</div>
              <div
                className="font-mono"
                style={{ fontSize: "0.7rem", color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                title={result.crawler}
              >
                {result.crawler.slice(0, 8)}…{result.crawler.slice(-6)}
              </div>
            </div>
          )}
          {result.crawlerNodeId && (
            <div>
              <div className="label"><Cpu size={9} /> Node</div>
              <div className="font-mono" style={{ fontSize: "0.7rem", color: "var(--text-secondary)" }}>
                {result.crawlerNodeId}
              </div>
            </div>
          )}
          {result.blockchainTimestamp && (
            <div>
              <div className="label"><Clock size={9} /> On-chain</div>
              <div style={{ fontSize: "0.72rem", color: "var(--text-secondary)" }}>
                {new Date(result.blockchainTimestamp * 1000).toLocaleString()}
              </div>
            </div>
          )}
          {result.timestamp && (
            <div>
              <div className="label"><Clock size={9} /> Crawled</div>
              <div style={{ fontSize: "0.72rem", color: "var(--text-secondary)" }}>
                {new Date(result.timestamp).toLocaleString()}
              </div>
            </div>
          )}
        </div>

        {/* Chain verified pill */}
        <div className="glow-pill" style={{ marginBottom: "0.85rem" }}>
          <div
            style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--signal)", boxShadow: "0 0 8px var(--signal)" }}
          />
          Immutably recorded on Ethereum Sepolia
        </div>

        {/* Links */}
        {links.length > 0 && (
          <div style={{ borderTop: "1px solid var(--border-dim)", paddingTop: "0.75rem" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
              <div className="label">
                <Link2 size={9} />
                Extracted Links
                <span className="font-mono" style={{ color: "var(--signal)", marginLeft: "0.3rem" }}>{links.length}</span>
              </div>
              {links.length > 6 && (
                <button
                  className="btn-ghost"
                  onClick={() => setLinksExpanded(x => !x)}
                  style={{ fontSize: "0.62rem" }}
                >
                  {linksExpanded
                    ? <><ChevronUp size={9} /> Show less</>
                    : <><ChevronDown size={9} /> Show all {links.length}</>
                  }
                </button>
              )}
            </div>
            <div
              style={{
                background: "var(--surface)", border: "1px solid var(--border)",
                borderRadius: "var(--r-sm)", padding: "0.3rem",
                maxHeight: linksExpanded ? 240 : "auto", overflowY: linksExpanded ? "auto" : "visible",
              }}
            >
              {displayLinks.map(link => (
                <div
                  key={link}
                  className="link-item"
                  style={{ cursor: "pointer" }}
                  onClick={() => onCrawlLink?.(link)}
                  title={`Click to crawl: ${link}`}
                >
                  <Link2 size={8} style={{ flexShrink: 0, opacity: 0.4 }} />
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{link}</span>
                </div>
              ))}
            </div>
            {!linksExpanded && links.length > 6 && (
              <div
                className="font-mono"
                style={{ fontSize: "0.58rem", color: "var(--text-muted)", marginTop: "0.25rem", textAlign: "right" }}
              >
                +{links.length - 6} more — click "Show all"
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
