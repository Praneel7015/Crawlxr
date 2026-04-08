import { useState, useCallback } from "react";
import { Play, Trash2, X, ListOrdered, CheckCircle2, Loader, Clock } from "lucide-react";

const STATUS = { PENDING: "pending", PROCESSING: "processing", DONE: "done", ERROR: "error" };

export default function CrawlQueue({ onCrawlUrl }) {
  const [items, setItems]   = useState([]);
  const [running, setRunning] = useState(false);
  const [input, setInput]   = useState("");

  function addItem(urlStr) {
    const url = urlStr.trim();
    if (!url) return;
    try {
      const parsed = url.startsWith("http") ? url : `https://${url}`;
      new URL(parsed);
      if (items.find(i => i.url === parsed)) return;
      setItems(prev => [...prev, { id: Date.now(), url: parsed, status: STATUS.PENDING, result: null }]);
      setInput("");
    } catch { /* invalid url */ }
  }

  function removeItem(id) {
    setItems(prev => prev.filter(i => i.id !== id));
  }
  function clearDone() {
    setItems(prev => prev.filter(i => i.status !== STATUS.DONE));
  }

  const runQueue = useCallback(async () => {
    const pending = items.filter(i => i.status === STATUS.PENDING);
    if (!pending.length || running) return;
    setRunning(true);

    for (const item of pending) {
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, status: STATUS.PROCESSING } : i));
      try {
        const result = await onCrawlUrl(item.url);
        setItems(prev => prev.map(i =>
          i.id === item.id ? { ...i, status: STATUS.DONE, result } : i
        ));
      } catch (err) {
        setItems(prev => prev.map(i =>
          i.id === item.id ? { ...i, status: STATUS.ERROR, result: { error: err.message } } : i
        ));
      }
    }
    setRunning(false);
  }, [items, running, onCrawlUrl]);

  const pendingCount    = items.filter(i => i.status === STATUS.PENDING).length;
  const processingCount = items.filter(i => i.status === STATUS.PROCESSING).length;
  const doneCount       = items.filter(i => i.status === STATUS.DONE).length;
  const errorCount      = items.filter(i => i.status === STATUS.ERROR).length;

  return (
    <div className="card card-pad" style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <ListOrdered size={14} style={{ color: "var(--signal-dim)" }} />
          <span
            className="font-display"
            style={{ fontSize: "0.95rem", color: "var(--text-bright)", letterSpacing: "0.05em" }}
          >
            CRAWL QUEUE
          </span>
          {items.length > 0 && (
            <span
              className="font-mono"
              style={{
                background: "var(--raised)", border: "1px solid var(--border)",
                borderRadius: "99px", padding: "0 0.5rem", fontSize: "0.62rem",
                color: "var(--text-secondary)",
              }}
            >
              {items.length}
            </span>
          )}
        </div>
        <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
          {doneCount > 0 && (
            <button className="btn-ghost" onClick={clearDone} style={{ fontSize: "0.65rem" }}>
              <Trash2 size={10} /> Clear done
            </button>
          )}
          <button
            className="btn-primary"
            onClick={runQueue}
            disabled={!pendingCount || running}
            style={{ padding: "0.4rem 0.85rem", fontSize: "0.72rem" }}
          >
            {running
              ? <><Loader size={11} style={{ animation: "spin 1s linear infinite" }} /> Running</>
              : <><Play size={11} /> Run {pendingCount > 0 ? `(${pendingCount})` : ""}</>
            }
          </button>
        </div>
      </div>

      {/* Add URL row */}
      <div style={{ display: "flex", gap: "0.4rem" }}>
        <input
          type="text"
          className="input-field"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && addItem(input)}
          placeholder="Add URL to queue…"
          style={{ fontSize: "0.75rem", padding: "0.5rem 0.75rem" }}
        />
        <button
          className="btn-secondary"
          onClick={() => addItem(input)}
          disabled={!input.trim()}
          style={{ padding: "0 0.75rem", fontSize: "0.72rem" }}
        >
          Add
        </button>
      </div>

      {/* Queue items */}
      {items.length === 0 ? (
        <div
          className="font-mono"
          style={{ textAlign: "center", padding: "1rem", color: "var(--text-muted)", fontSize: "0.7rem" }}
        >
          No URLs queued — add URLs above or use + button in the crawler form
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem", maxHeight: 220, overflowY: "auto" }}>
          {items.map((item, idx) => (
            <div key={item.id} className={`queue-item ${item.status}`}>
              {/* Index */}
              <span className="font-mono" style={{ fontSize: "0.6rem", color: "var(--text-muted)", width: 18, flexShrink: 0 }}>
                {String(idx + 1).padStart(2, "0")}
              </span>

              {/* Status icon */}
              <span style={{ flexShrink: 0 }}>
                {item.status === STATUS.PENDING    && <Clock    size={11} style={{ color: "var(--text-muted)" }} />}
                {item.status === STATUS.PROCESSING && <Loader   size={11} style={{ color: "var(--signal)", animation: "spin 0.8s linear infinite" }} />}
                {item.status === STATUS.DONE       && <CheckCircle2 size={11} style={{ color: "var(--matrix)" }} />}
                {item.status === STATUS.ERROR      && <X        size={11} style={{ color: "var(--red)" }} />}
              </span>

              {/* URL */}
              <span
                className="font-mono"
                style={{
                  flex: 1, fontSize: "0.68rem",
                  color: item.status === STATUS.DONE ? "var(--text-muted)"
                       : item.status === STATUS.ERROR ? "var(--red)"
                       : item.status === STATUS.PROCESSING ? "var(--signal)"
                       : "var(--text-primary)",
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}
                title={item.url}
              >
                {item.url}
              </span>

              {/* Result badge */}
              {item.result && (
                <span
                  className="badge"
                  style={{
                    fontSize: "0.55rem",
                    background: item.result.duplicate ? "var(--amber-dim)" : "var(--matrix-dim)",
                    color: item.result.duplicate ? "var(--amber)" : "var(--matrix)",
                    border: `1px solid ${item.result.duplicate ? "rgba(255,160,64,0.2)" : "rgba(45,255,122,0.2)"}`,
                  }}
                >
                  {item.result.error ? "ERR" : item.result.duplicate ? "DUP" : "NEW"}
                </span>
              )}

              {/* Remove */}
              {item.status !== STATUS.PROCESSING && (
                <button
                  onClick={() => removeItem(item.id)}
                  style={{
                    background: "none", border: "none", color: "var(--text-muted)",
                    cursor: "pointer", padding: "0.1rem", flexShrink: 0, display: "flex",
                  }}
                >
                  <X size={10} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Stats footer */}
      {items.length > 0 && (
        <div
          className="font-mono"
          style={{
            display: "flex", gap: "1rem", fontSize: "0.6rem",
            color: "var(--text-muted)", borderTop: "1px solid var(--border-dim)", paddingTop: "0.5rem",
          }}
        >
          {pendingCount > 0    && <span style={{ color: "var(--text-secondary)" }}>{pendingCount} pending</span>}
          {processingCount > 0 && <span style={{ color: "var(--signal)" }}>{processingCount} crawling</span>}
          {doneCount > 0       && <span style={{ color: "var(--matrix)" }}>{doneCount} done</span>}
          {errorCount > 0      && <span style={{ color: "var(--red)" }}>{errorCount} errors</span>}
        </div>
      )}
    </div>
  );
}
