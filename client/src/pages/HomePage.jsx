import { useState } from "react";
import { BrowserProvider } from "ethers";
import UrlCrawlerForm from "../components/UrlCrawlerForm";
import CrawlResultCard from "../components/CrawlResultCard";
import VerifyCard from "../components/VerifyCard";
import { crawlUrl, verifyUrl } from "../services/api";

function HomePage() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [verifyResult, setVerifyResult] = useState(null);
  const [walletAddress, setWalletAddress] = useState("");
  const [error, setError] = useState("");

  async function connectWallet() {
    try {
      if (!window.ethereum) {
        setError("MetaMask not detected");
        return;
      }
      const provider = new BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      setWalletAddress(accounts[0] || "");
    } catch (err) {
      setError(err?.message || "Failed to connect wallet");
    }
  }

  async function handleCrawl() {
    try {
      setLoading(true);
      setError("");
      const data = await crawlUrl(url);
      setResult(data);
    } catch (err) {
      const message = err?.response?.data?.message || "Crawl failed";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify() {
    try {
      setLoading(true);
      setError("");
      const data = await verifyUrl(url);
      setVerifyResult(data);
    } catch (err) {
      if (err?.response?.status === 404) {
        setVerifyResult({ exists: false, url });
        return;
      }
      const message = err?.response?.data?.message || "Verification failed";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Crawl Verification Dashboard</h1>
        <button
          type="button"
          onClick={connectWallet}
          className="rounded-md border border-slate-900 px-4 py-2 text-sm font-medium"
        >
          {walletAddress ? `Wallet: ${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : "Connect MetaMask"}
        </button>
      </div>

      <UrlCrawlerForm url={url} setUrl={setUrl} onCrawl={handleCrawl} onVerify={handleVerify} loading={loading} />

      {error && <p className="mt-4 rounded-md bg-red-100 px-4 py-2 text-red-700">{error}</p>}

      <div className="mt-6 grid gap-6">
        <CrawlResultCard result={result} />
        <VerifyCard verifyResult={verifyResult} />
      </div>
    </main>
  );
}

export default HomePage;
