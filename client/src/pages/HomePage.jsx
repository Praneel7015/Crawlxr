import { useState, useCallback } from "react";
import { BrowserProvider } from "ethers";
import Layout from "../components/Layout";
import UrlCrawlerForm from "../components/UrlCrawlerForm";
import CrawlResultCard from "../components/CrawlResultCard";
import VerifyCard from "../components/VerifyCard";
import CrawlHistory from "../components/CrawlHistory";
import StatsBar from "../components/StatsBar";
import { crawlUrl, verifyUrl } from "../services/api";
import { AlertCircle, X } from "lucide-react";

export default function HomePage() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [verifyResult, setVerifyResult] = useState(null);
  const [walletAddress, setWalletAddress] = useState("");
  const [error, setError] = useState("");
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);
  const [activeTab, setActiveTab] = useState("result");

  const refreshHistory = useCallback(() => {
    setHistoryRefreshKey((k) => k + 1);
  }, []);

  async function connectWallet() {
    try {
      if (!window.ethereum) {
        setError("MetaMask not detected");
        return;
      }
      const provider = new BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      setWalletAddress(accounts[0] || "");
      setError("");
    } catch (err) {
      setError(err?.message || "Failed to connect wallet");
    }
  }

  async function handleCrawl() {
    if (!url.trim()) return;
    try {
      setLoading(true);
      setError("");
      setVerifyResult(null);
      const data = await crawlUrl(url.trim());
      setResult(data);
      setActiveTab("result");
      refreshHistory();
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Crawl failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify() {
    if (!url.trim()) return;
    try {
      setLoading(true);
      setError("");
      setResult(null);
      const data = await verifyUrl(url.trim());
      setVerifyResult(data);
      setActiveTab("verify");
    } catch (err) {
      if (err?.response?.status === 404) {
        setVerifyResult({ exists: false, url: url.trim() });
        setActiveTab("verify");
        return;
      }
      setError(err?.response?.data?.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  }

  function handleHistorySelect(selectedUrl) {
    setUrl(selectedUrl);
  }

  const hasOutput = result || verifyResult;

  return (
    <Layout walletAddress={walletAddress} onConnectWallet={connectWallet}>
      <div style={{ padding: "1.5rem", maxWidth: 1200, margin: "0 auto", width: "100%" }}>
        {/* Stats bar */}
        <div style={{ marginBottom: "1.25rem" }}>
          <StatsBar />
        </div>

        {/* Main grid */}
        <div
          className="main-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 400px",
            gap: "1.25rem",
            alignItems: "start",
          }}
        >
          {/* Left column: form + results */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <UrlCrawlerForm
              url={url}
              setUrl={setUrl}
              onCrawl={handleCrawl}
              onVerify={handleVerify}
              loading={loading}
            />

            {/* Error banner */}
            {error && (
              <div
                className="fade-in"
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "0.5rem",
                  background: "rgba(229,56,59,0.06)",
                  border: "1px solid rgba(229,56,59,0.18)",
                  borderRadius: "var(--radius-sm)",
                  padding: "0.7rem 1rem",
                  fontSize: "0.8rem",
                  color: "var(--red)",
                }}
              >
                <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 2 }} />
                <span style={{ flex: 1 }}>{error}</span>
                <button
                  onClick={() => setError("")}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--red)",
                    cursor: "pointer",
                    padding: 0,
                    flexShrink: 0,
                    display: "flex",
                  }}
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
                    display: "flex",
                    gap: "0",
                    marginBottom: "0.75rem",
                    borderBottom: "1px solid var(--border)",
                  }}
                >
                  {result && (
                    <button
                      className={`nav-tab ${activeTab === "result" ? "active" : ""}`}
                      onClick={() => setActiveTab("result")}
                    >
                      Crawl Result
                    </button>
                  )}
                  {verifyResult && (
                    <button
                      className={`nav-tab ${activeTab === "verify" ? "active" : ""}`}
                      onClick={() => setActiveTab("verify")}
                    >
                      Verification
                    </button>
                  )}
                </div>

                {activeTab === "result" && result && <CrawlResultCard result={result} onCrawlLink={handleHistorySelect} />}
                {activeTab === "verify" && verifyResult && (
                  <VerifyCard verifyResult={verifyResult} />
                )}
              </div>
            )}

            {/* Empty state */}
            {!hasOutput && !loading && !error && (
              <div
                style={{
                  textAlign: "center",
                  padding: "3.5rem 2rem",
                  border: "1px dashed var(--border)",
                  borderRadius: "var(--radius-md)",
                  color: "var(--text-muted)",
                  background: "var(--bg-card)",
                }}
              >
                <div
                  style={{
                    width: 48,
                    height: 48,
                    margin: "0 auto 1rem",
                    background: "var(--bg-surface)",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--text-muted)",
                  }}
                >
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <path d="M21 21l-4.35-4.35" />
                  </svg>
                </div>
                <div
                  style={{
                    fontSize: "0.85rem",
                    fontWeight: 500,
                    color: "var(--text-secondary)",
                    marginBottom: "0.35rem",
                  }}
                >
                  No results yet
                </div>
                <div style={{ fontSize: "0.75rem" }}>
                  Enter a URL above and click Crawl to begin
                </div>
              </div>
            )}
          </div>

          {/* Right column: history */}
          <div style={{ position: "sticky", top: 72 }}>
            <CrawlHistory
              refreshKey={historyRefreshKey}
              onSelect={handleHistorySelect}
            />
          </div>
        </div>
      </div>
    </Layout>
  );
}
