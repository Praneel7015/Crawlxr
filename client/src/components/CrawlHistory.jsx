import { useState, useEffect, useCallback } from "react";
import { getHistory } from "../services/api";
import { Clock, RefreshCw, ChevronRight, Search, X } from "lucide-react";

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 60)    return `${Math.floor(diff)}s`;
  if (diff < 3600)  return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

function truncateUrl(url, max = 38) {
  try {
    const u = new URL(url);
    const s = u.hostname + u.pathname.slice(0, 20);
    return s.length > max ? s.slice(0, max) + "…" : s;
  } catch {
    return url.length > max ? url.slice(0, max) + "…" : url;
  }
}

function getDomain(url) {
  try { return new URL(url).hostname; }
  catch { return url; }
}

export default function CrawlHistory({ refreshKey, onSelect }) {
  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [query,   setQuery]   = useState("");

  const load = useCallback(() => {
    setLoading(true);
    getHistory(30)
      .then(data => setItems(Array.isArray(data) ? data : []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load, refreshKey]);

  const filtered = query.trim()
    ? items.filter(i => i.url.toLowerCase().includes(query.toLowerCase()))
    : items;

  return (
    <div
      className="card card-pad"
      style={{ height: "100%", display: "flex", flexDirection: "column" }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Clock size={13} style={{ color: "var(--signal-dim)" }} />
          <span
            className="font-display"
            style={{ fontSize: "0.9rem", color: "var(--text-bright)", letterSpacing: "0.05em" }}
          >
            RECENT CRAWLS
          </span>
        </div>
        <button className="btn-ghost" onClick={load} title="Refresh" style={{ padding: "0.25rem 0.5rem" }}>
          <RefreshCw size={11} />
        </button>
      </div>

      {/* Search */}
      <div style={{ position: "relative", marginBottom: "0.65rem" }}>
        <Search size={11} style={{
          position: "absolute", left: "0.65rem", top: "50%",
          transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none",
        }} />
        <input
          type="text"
          className="input-field"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Filter by URL…"
          style={{ paddingLeft: "1.9rem", paddingRight: "1.9rem", fontSize: "0.72rem", padding: "0.42rem 1.9rem" }}
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            style={{
              position: "absolute", right: "0.6rem", top: "50%",
              transform: "translateY(-50%)", background: "none",
              border: "none", cursor: "pointer", color: "var(--text-muted)",
              display: "flex", padding: 0,
            }}
          >
            <X size={10} />
          </button>
        )}
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "2px" }}>
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "2rem" }}>
            <div className="dot-pulse"><span/><span/><span/></div>
          </div>
        ) : filtered.length === 0 ? (
          <div
            className="font-mono"
            style={{ textAlign: "center", padding: "2rem 1rem", color: "var(--text-muted)", fontSize: "0.7rem" }}
          >
            {query ? "No matches found" : "No crawls yet. Enter a URL to begin."}
          </div>
        ) : (
          filtered.map((item, i) => (
            <div
              key={item._id || i}
              className="history-item fade-in"
              style={{ animationDelay: `${i * 0.02}s` }}
              onClick={() => onSelect?.(item.url)}
              title={item.url}
            >
              {/* Status dot */}
              <div
                className="status-dot"
                style={{
                  width: 6, height: 6, marginTop: 5, flexShrink: 0,
                  background: item.duplicate ? "var(--amber)" : "var(--matrix)",
                  boxShadow: item.duplicate ? "0 0 5px var(--amber)" : "0 0 5px var(--matrix)",
                }}
              />

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  className="font-mono"
                  style={{
                    fontSize: "0.68rem", color: "var(--text-primary)",
                    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                  }}
                >
                  {truncateUrl(item.url)}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.15rem" }}>
                  <span className="font-mono" style={{ fontSize: "0.58rem", color: "var(--text-muted)" }}>
                    {item.crawledAt ? timeAgo(item.crawledAt) + " ago" : "--"}
                  </span>
                  <span className="font-mono" style={{ fontSize: "0.58rem", color: "var(--text-muted)" }}>
                    {getDomain(item.url)}
                  </span>
                  {item.links?.length > 0 && (
                    <span className="font-mono" style={{ fontSize: "0.58rem", color: "var(--text-muted)" }}>
                      {item.links.length}L
                    </span>
                  )}
                  {item.duplicate && (
                    <span className="badge badge-dup" style={{ fontSize: "0.52rem", padding: "0.05rem 0.3rem" }}>
                      dup
                    </span>
                  )}
                </div>
              </div>

              <ChevronRight size={10} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
            </div>
          ))
        )}
      </div>

      {/* Footer count */}
      {!loading && items.length > 0 && (
        <div
          className="font-mono"
          style={{
            borderTop: "1px solid var(--border-dim)", paddingTop: "0.5rem", marginTop: "0.5rem",
            fontSize: "0.58rem", color: "var(--text-muted)", textAlign: "right",
          }}
        >
          {filtered.length} / {items.length} records
        </div>
      )}
    </div>
  );
}
