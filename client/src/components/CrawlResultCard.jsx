function CrawlResultCard({ result }) {
  if (!result) {
    return null;
  }

  const explorerBase = import.meta.env.VITE_SEPOLIA_EXPLORER || "https://sepolia.etherscan.io/tx/";

  return (
    <div className="rounded-lg bg-white p-6 shadow-sm">
      <h3 className="mb-3 text-lg font-semibold">Crawl Result</h3>
      {result.duplicate && <p className="mb-2 text-amber-600">Duplicate detected: already recorded on blockchain.</p>}
      <div className="space-y-2 text-sm text-slate-700">
        <p>
          <span className="font-medium">Title:</span> {result.title || "N/A"}
        </p>
        <p>
          <span className="font-medium">Content Hash:</span> {result.contentHash}
        </p>
        {result.transactionHash && (
          <p>
            <span className="font-medium">Transaction:</span>{" "}
            <a
              href={`${explorerBase}${result.transactionHash}`}
              target="_blank"
              rel="noreferrer"
              className="break-all text-blue-600 underline"
            >
              {result.transactionHash}
            </a>
          </p>
        )}
        {result.crawler && (
          <p>
            <span className="font-medium">Crawler:</span> {result.crawler}
          </p>
        )}
        {result.crawlerNodeId && (
          <p>
            <span className="font-medium">Node ID:</span> {result.crawlerNodeId}
          </p>
        )}
        {result.blockchainTimestamp && (
          <p>
            <span className="font-medium">On-chain Timestamp:</span>{" "}
            {new Date(result.blockchainTimestamp * 1000).toLocaleString()}
          </p>
        )}
        {result.timestamp && (
          <p>
            <span className="font-medium">Crawled At:</span>{" "}
            {new Date(result.timestamp).toLocaleString()}
          </p>
        )}
      </div>

      {Array.isArray(result.links) && result.links.length > 0 && (
        <div className="mt-4">
          <h4 className="mb-2 font-medium">Extracted Links ({result.links.length})</h4>
          <ul className="max-h-64 list-inside list-disc overflow-auto text-sm text-slate-700">
            {result.links.map((link) => (
              <li key={link} className="truncate">
                <a href={link} target="_blank" rel="noreferrer" className="text-blue-600 underline">
                  {link}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default CrawlResultCard;
