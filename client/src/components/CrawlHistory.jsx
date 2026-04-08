import { useState, useEffect, useCallback } from "react";
import { getHistory } from "../services/api";
import { Clock, RefreshCw, ChevronRight } from "lucide-react";

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 60) return `${Math.floor(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function truncateUrl(url, max = 40) {
  try {
    const u = new URL(url);
    const display = u.hostname + u.pathname;
    return display.length > max ? display.slice(0, max) + "..." : display;
  } catch {
    return url.length > max ? url.slice(0, max) + "..." : url;
  }
}

export default function CrawlHistory({ refreshKey, onSelect }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    getHistory(20)
      .then((data) => setItems(Array.isArray(data) ? data : []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  return (
    <div
      className="card"
      style={{
        padding: "1.25rem",
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
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
          <Clock size={14} style={{ color: "var(--text-muted)" }} />
          <span
            style={{
              fontSize: "0.72rem",
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--text-muted)",
            }}
          >
            Recent Crawls
          </span>
        </div>
        <button className="btn-icon" onClick={load} title="Refresh">
          <RefreshCw size={11} />
        </button>
      </div>

      {/* List */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: "2px",
        }}
      >
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "2rem" }}>
            <div className="dot-pulse">
              <span />
              <span />
              <span />
            </div>
          </div>
        ) : items.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "2rem",
              color: "var(--text-muted)",
              fontSize: "0.8rem",
            }}
          >
            No crawls yet. Submit a URL to get started.
          </div>
        ) : (
          items.map((item, i) => (
            <div
              key={item._id || i}
              className="history-item fade-in"
              style={{ animationDelay: `${i * 0.03}s` }}
              onClick={() => onSelect && onSelect(item.url)}
            >
              {/* Status dot */}
              <div
                className="history-dot"
                style={{
                  background: item.duplicate ? "var(--amber)" : "var(--green)",
                  boxShadow: item.duplicate
                    ? "0 0 4px var(--amber)"
                    : "0 0 4px var(--green)",
                }}
              />

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.72rem",
                    color: "var(--text-primary)",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                  title={item.url}
                >
                  {truncateUrl(item.url)}
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    marginTop: "0.2rem",
                  }}
                >
                  <span style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>
                    {item.crawledAt ? timeAgo(item.crawledAt) : "--"}
                  </span>
                  {item.links?.length > 0 && (
                    <span style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>
                      {item.links.length} links
                    </span>
                  )}
                  {item.duplicate && (
                    <span
                      className="badge badge-dup"
                      style={{ fontSize: "0.55rem", padding: "0.1rem 0.35rem" }}
                    >
                      dup
                    </span>
                  )}
                </div>
              </div>

              {/* Arrow */}
              <ChevronRight
                size={12}
                style={{ color: "var(--text-muted)", flexShrink: 0, marginTop: 4 }}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
