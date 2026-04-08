import { useState } from "react";
import { BrowserProvider } from "ethers";
import Layout from "../components/Layout";
import NodeVisualization from "../components/NodeVisualization";

export default function GraphPage() {
  const [walletAddress, setWalletAddress] = useState("");

  async function connectWallet() {
    try {
      if (!window.ethereum) return;
      const provider = new BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      setWalletAddress(accounts[0] || "");
    } catch {
      // silently fail
    }
  }

  return (
    <Layout walletAddress={walletAddress} onConnectWallet={connectWallet}>
      <div style={{ padding: "1rem 1.5rem" }}>
        {/* Page header */}
        <div style={{ marginBottom: "1rem" }}>
          <h1
            style={{
              fontSize: "1.1rem",
              fontWeight: 600,
              color: "var(--text-bright)",
              margin: "0 0 0.25rem 0",
            }}
          >
            Link Graph
          </h1>
          <p
            style={{
              fontSize: "0.78rem",
              color: "var(--text-muted)",
              margin: 0,
            }}
          >
            3D visualization of crawled URLs and their connections. Click any
            node to view details.
          </p>
        </div>

        {/* Graph */}
        <NodeVisualization />
      </div>
    </Layout>
  );
}
