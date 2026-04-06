function UrlCrawlerForm({ url, setUrl, onCrawl, onVerify, loading }) {
  return (
    <div className="rounded-lg bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-xl font-semibold">Decentralized Blockchain Web Crawler</h2>
      <div className="flex flex-col gap-3 md:flex-row">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com"
          className="w-full rounded-md border border-slate-300 px-3 py-2 focus:border-slate-500 focus:outline-none"
        />
        <button
          type="button"
          onClick={onCrawl}
          disabled={loading}
          className="rounded-md bg-slate-900 px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Crawling..." : "Crawl"}
        </button>
        <button
          type="button"
          onClick={onVerify}
          disabled={loading}
          className="rounded-md border border-slate-800 px-4 py-2 text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Verify
        </button>
      </div>
    </div>
  );
}

export default UrlCrawlerForm;
