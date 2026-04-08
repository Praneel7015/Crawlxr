import { useState } from "react";
import { Shield, Copy, Check, Link2 } from "lucide-react";

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

export default function VerifyCard({ verifyResult }) {
  if (!verifyResult) return null;

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
          <Shield size={14} style={{ color: "var(--text-muted)" }} />
          <span
            style={{
              fontSize: "0.72rem",
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--text-muted)",
            }}
          >
            Chain Verification
          </span>
        </div>
        <span className={verifyResult.exists ? "badge badge-ok" : "badge badge-err"}>
          {verifyResult.exists ? "Verified" : "Not Found"}
        </span>
      </div>

      {!verifyResult.exists ? (
        <div
          style={{
            background: "rgba(229,56,59,0.05)",
            border: "1px solid rgba(229,56,59,0.15)",
            borderRadius: "var(--radius-sm)",
            padding: "0.8rem 1rem",
            fontSize: "0.8rem",
            color: "var(--red)",
            lineHeight: 1.5,
          }}
        >
          No on-chain crawl record found for this URL. The URL has not been
          crawled and verified on Sepolia.
        </div>
      ) : (
        <>
          {/* URL */}
          <div style={{ marginBottom: "0.75rem" }}>
            <div className="label">Verified URL</div>
            <div
              className="hash-display"
              style={{
                fontFamily: "var(--font-ui)",
                fontSize: "0.8rem",
                color: "var(--text-primary)",
                wordBreak: "break-all",
              }}
            >
              {verifyResult.url}
            </div>
          </div>

          {/* Hash */}
          <div style={{ marginBottom: "0.75rem" }}>
            <div className="label">Content Hash</div>
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
                {verifyResult.contentHash}
              </span>
              <CopyButton text={verifyResult.contentHash} />
            </div>
          </div>

          {/* Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "0.6rem",
            }}
          >
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
                title={verifyResult.crawler}
              >
                {verifyResult.crawler?.slice(0, 6)}...
                {verifyResult.crawler?.slice(-4)}
              </div>
            </div>
            <div>
              <div className="label">Recorded At</div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                {new Date(verifyResult.timestamp * 1000).toLocaleString()}
              </div>
            </div>
          </div>

          {/* Chain indicator */}
          <div
            style={{
              marginTop: "1rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              background: "var(--accent-glow)",
              border: "1px solid var(--accent)",
              borderRadius: "var(--radius-sm)",
              padding: "0.55rem 0.8rem",
            }}
          >
            <Link2 size={13} style={{ color: "var(--accent)" }} />
            <span
              style={{
                fontSize: "0.72rem",
                color: "var(--accent)",
                fontWeight: 500,
              }}
            >
              Immutably recorded on Ethereum Sepolia testnet
            </span>
          </div>
        </>
      )}
    </div>
  );
}
