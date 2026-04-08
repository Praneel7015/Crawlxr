import { useState, useCallback } from "react";
import Layout from "../components/Layout";
import UrlCrawlerForm from "../components/UrlCrawlerForm";
import CrawlResultCard from "../components/CrawlResultCard";
import VerifyCard from "../components/VerifyCard";
import CrawlHistory from "../components/CrawlHistory";
import CrawlQueue from "../components/CrawlQueue";
import StatsBar from "../components/StatsBar";
import { crawlUrl, verifyUrl } from "../services/api";
import { AlertCircle, X, FileSearch, ShieldCheck } from "lucide-react";

export default function HomePage() {
  const [url,              setUrl]              = useState("");
  const [loading,          setLoading]          = useState(false);
  const [result,           setResult]           = useState(null);
  const [verifyResult,     setVerifyResult]     = useState(null);
  const [error,            setError]            = useState("");
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);
  const [activeTab,        setActiveTab]        = useState("result");
  const [showQueue,        setShowQueue]        = useState(false);

  const refreshHistory = useCallback(() => setHistoryRefreshKey(k => k + 1), []);

  async function handleCrawl() {
    const target = url.trim().startsWith("http") ? url.trim() : `https://${url.trim()}`;
    if (!target || target === "https://") return;
    try {
      setLoading(true); setError(""); setVerifyResult(null);
      const data = await crawlUrl(target);
      setResult(data); setActiveTab("result");
      refreshHistory();
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Crawl failed");
    } finally { setLoading(false); }
  }

  async function handleVerify() {
    const target = url.trim().startsWith("http") ? url.trim() : `https://${url.trim()}`;
    if (!target || target === "https://") return;
    try {
      setLoading(true); setError(""); setResult(null);
      const data = await verifyUrl(target);
      setVerifyResult(data); setActiveTab("verify");
    } catch (err) {
      if (err?.response?.status === 404) {
        setVerifyResult({ exists: false, url: target });
        setActiveTab("verify");
        return;
      }
      setError(err?.response?.data?.message || "Verification failed");
    } finally { setLoading(false); }
  }

  // Used by queue
  async function crawlSingleUrl(targetUrl) {
    const data = await crawlUrl(targetUrl);
    refreshHistory();
    return data;
  }

  function addToQueue(urlStr) {
    setShowQueue(true);
    // Queue component handles its own state; this just opens it
  }

  const hasOutput = result || verifyResult;

  return (
    <Layout>
      <div style={{ padding: "1.5rem", maxWidth: 1280, margin: "0 auto" }}>

        {/* Stats */}
        <div style={{ marginBottom: "1.25rem" }}>
          <StatsBar />
        </div>

        {/* Main 2-col grid */}
        <div
          className="main-grid-2"
          style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: "1.25rem", alignItems: "start" }}
        >
          {/* Left column */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>

            {/* Crawler form */}
            <UrlCrawlerForm
              url={url}
              setUrl={setUrl}
              onCrawl={handleCrawl}
              onVerify={handleVerify}
              loading={loading}
              onAddToQueue={addToQueue}
            />

            {/* Queue toggle */}
            <button
              className="btn-ghost"
              onClick={() => setShowQueue(s => !s)}
              style={{ alignSelf: "flex-start", fontSize: "0.7rem" }}
            >
              {showQueue ? "− Hide Queue" : "+ Show Crawl Queue"}
            </button>

            {/* Crawl queue */}
            {showQueue && (
              <div className="fade-in">
                <CrawlQueue onCrawlUrl={crawlSingleUrl} />
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="error-banner fade-in">
                <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 2 }} />
                <span style={{ flex: 1 }}>{error}</span>
                <button
                  onClick={() => setError("")}
                  style={{ background: "none", border: "none", color: "var(--red)", cursor: "pointer", display: "flex" }}
                >
                  <X size={14} />
                </button>
              </div>
            )}

            {/* Result tabs */}
            {hasOutput && (
              <div className="fade-in">
                <div
                  style={{
                    display: "flex", gap: 0,
                    borderBottom: "1px solid var(--border)", marginBottom: "0.75rem",
                  }}
                >
                  {result && (
                    <button
                      onClick={() => setActiveTab("result")}
                      style={{
                        display: "flex", alignItems: "center", gap: "0.4rem",
                        padding: "0.55rem 1rem",
                        fontSize: "0.72rem", fontWeight: 500,
                        color: activeTab === "result" ? "var(--signal)" : "var(--text-secondary)",
                        borderBottom: activeTab === "result" ? "2px solid var(--signal)" : "2px solid transparent",
                        background: "none", border: "none",
                        cursor: "pointer",
                      }}
                    >
                      <FileSearch size={12} /> Crawl Result
                    </button>
                  )}
                  {verifyResult && (
                    <button
                      onClick={() => setActiveTab("verify")}
                      style={{
                        display: "flex", alignItems: "center", gap: "0.4rem",
                        padding: "0.55rem 1rem",
                        fontSize: "0.72rem", fontWeight: 500,
                        color: activeTab === "verify" ? "var(--signal)" : "var(--text-secondary)",
                        borderBottom: activeTab === "verify" ? "2px solid var(--signal)" : "2px solid transparent",
                        background: "none", border: "none",
                        cursor: "pointer",
                      }}
                    >
                      <ShieldCheck size={12} /> Verification
                    </button>
                  )}
                </div>

                {activeTab === "result" && result && (
                  <CrawlResultCard result={result} onCrawlLink={u => setUrl(u)} />
                )}
                {activeTab === "verify" && verifyResult && (
                  <VerifyCard verifyResult={verifyResult} />
                )}
              </div>
            )}

            {/* Empty state */}
            {!hasOutput && !loading && !error && (
              <div
                style={{
                  textAlign: "center", padding: "3rem 2rem",
                  border: "1px dashed var(--border)", borderRadius: "var(--r-lg)",
                  background: "var(--card)",
                }}
              >
                <div
                  style={{
                    width: 48, height: 48, margin: "0 auto 1rem",
                    background: "var(--surface)", border: "1px solid var(--border)",
                    borderRadius: "var(--r-md)", display: "flex", alignItems: "center",
                    justifyContent: "center", color: "var(--text-muted)",
                  }}
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <circle cx="11" cy="11" r="8"/>
                    <path d="M21 21l-4.35-4.35"/>
                  </svg>
                </div>
                <div
                  className="font-display"
                  style={{ fontSize: "1.1rem", color: "var(--text-secondary)", letterSpacing: "0.06em", marginBottom: "0.35rem" }}
                >
                  AWAITING TARGET
                </div>
                <div className="font-mono" style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>
                  Enter a URL above to begin blockchain-verified crawling
                </div>
              </div>
            )}
          </div>

          {/* Right column — history */}
          <div style={{ position: "sticky", top: "1.5rem" }}>
            <CrawlHistory
              refreshKey={historyRefreshKey}
              onSelect={u => setUrl(u.replace(/^https?:\/\//, ""))}
            />
          </div>
        </div>
      </div>
    </Layout>
  );
}
