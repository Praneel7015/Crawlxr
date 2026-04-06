function VerifyCard({ verifyResult }) {
  if (!verifyResult) {
    return null;
  }

  return (
    <div className="rounded-lg bg-white p-6 shadow-sm">
      <h3 className="mb-3 text-lg font-semibold">Verification Result</h3>
      {!verifyResult.exists ? (
        <p className="text-red-600">No on-chain crawl proof found.</p>
      ) : (
        <div className="space-y-2 text-sm text-slate-700">
          <p>
            <span className="font-medium">URL:</span> {verifyResult.url}
          </p>
          <p>
            <span className="font-medium">Content Hash:</span> {verifyResult.contentHash}
          </p>
          <p>
            <span className="font-medium">Crawler:</span> {verifyResult.crawler}
          </p>
          <p>
            <span className="font-medium">Timestamp:</span> {new Date(verifyResult.timestamp * 1000).toLocaleString()}
          </p>
        </div>
      )}
    </div>
  );
}

export default VerifyCard;
