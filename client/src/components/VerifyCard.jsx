import { useState } from "react";
import { ShieldCheck, ShieldX, Copy, Check, Link2, Clock, User } from "lucide-react";

function CopyBtn({ text }) {
  const [done, setDone] = useState(false);
  return (
    <button
      className="btn-ghost"
      onClick={() => navigator.clipboard.writeText(text).then(() => { setDone(true); setTimeout(() => setDone(false), 1400); })}
      style={{ padding: "0.18rem 0.45rem", fontSize: "0.62rem" }}
    >
      {done ? <><Check size={9} style={{ color: "var(--matrix)" }} /> Copied</> : <><Copy size={9} /></>}
    </button>
  );
}

export default function VerifyCard({ verifyResult }) {
  if (!verifyResult) return null;

  return (
    <div className="card card-pad fade-in">
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          {verifyResult.exists
            ? <ShieldCheck size={14} style={{ color: "var(--matrix)" }} />
            : <ShieldX    size={14} style={{ color: "var(--red)" }} />
          }
          <span
            className="font-display"
            style={{ fontSize: "0.95rem", color: "var(--text-bright)", letterSpacing: "0.05em" }}
          >
            CHAIN VERIFICATION
          </span>
        </div>
        <span className={verifyResult.exists ? "badge badge-new" : "badge badge-err"}>
          {verifyResult.exists ? "✦ Verified" : "✗ Not Found"}
        </span>
      </div>

      {!verifyResult.exists ? (
        <div
          style={{
            background: "var(--red-dim)", border: "1px solid rgba(255,51,102,0.18)",
            borderRadius: "var(--r-sm)", padding: "0.85rem 1rem",
            fontSize: "0.8rem", color: "var(--red)", lineHeight: 1.5,
          }}
        >
          No on-chain crawl record found for this URL. Submit it for crawling to create an immutable blockchain record.
        </div>
      ) : (
        <>
          <div style={{ marginBottom: "0.7rem" }}>
            <div className="label"><Link2 size={9} /> Verified URL</div>
            <div
              className="hash-box"
              style={{ fontFamily: "var(--font-body)", fontSize: "0.8rem", color: "var(--text-primary)", wordBreak: "break-all" }}
            >
              {verifyResult.url}
            </div>
          </div>

          <div style={{ marginBottom: "0.7rem" }}>
            <div className="label">Content Hash</div>
            <div className="hash-box" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {verifyResult.contentHash}
              </span>
              <CopyBtn text={verifyResult.contentHash} />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.6rem", marginBottom: "1rem" }}>
            <div>
              <div className="label"><User size={9} /> Crawler Address</div>
              <div
                className="font-mono"
                style={{ fontSize: "0.7rem", color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                title={verifyResult.crawler}
              >
                {verifyResult.crawler?.slice(0, 8)}…{verifyResult.crawler?.slice(-6)}
              </div>
            </div>
            <div>
              <div className="label"><Clock size={9} /> Recorded</div>
              <div style={{ fontSize: "0.72rem", color: "var(--text-secondary)" }}>
                {new Date(verifyResult.timestamp * 1000).toLocaleString()}
              </div>
            </div>
          </div>

          <div className="glow-pill">
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--signal)", boxShadow: "0 0 8px var(--signal)" }} />
            Immutably recorded on Ethereum Sepolia
          </div>
        </>
      )}
    </div>
  );
}
