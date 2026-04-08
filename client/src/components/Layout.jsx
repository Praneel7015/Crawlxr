import { useLocation, useNavigate } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext";
import {
  Link2,
  Wallet,
  Sun,
  Moon,
  LayoutDashboard,
  Network,
} from "lucide-react";

export default function Layout({ children, walletAddress, onConnectWallet }) {
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <header
        style={{
          borderBottom: "1px solid var(--border)",
          background: "var(--bg-base)",
          padding: "0 1.5rem",
          height: 56,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "sticky",
          top: 0,
          zIndex: 100,
          backdropFilter: "blur(12px)",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        {/* Left: Logo + Nav */}
        <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
          {/* Logo */}
          <div
            style={{ display: "flex", alignItems: "center", gap: "0.6rem", cursor: "pointer" }}
            onClick={() => navigate("/")}
          >
            <div
              style={{
                width: 32,
                height: 32,
                background: "var(--accent-glow)",
                border: "1px solid var(--accent)",
                borderRadius: 8,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--accent)",
              }}
            >
              <Link2 size={16} />
            </div>
            <div>
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontWeight: 700,
                  fontSize: "0.9rem",
                  color: "var(--text-bright)",
                  letterSpacing: "-0.02em",
                }}
              >
                Crawlxr
              </span>
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.6rem",
                  color: "var(--text-muted)",
                  marginLeft: "0.4rem",
                }}
              >
                v2.0
              </span>
            </div>
          </div>

          {/* Nav Tabs */}
          <nav style={{ display: "flex", gap: "0.25rem" }}>
            <button
              className={`nav-tab ${location.pathname === "/" ? "active" : ""}`}
              onClick={() => navigate("/")}
            >
              <LayoutDashboard size={14} />
              Dashboard
            </button>
            <button
              className={`nav-tab ${location.pathname === "/graph" ? "active" : ""}`}
              onClick={() => navigate("/graph")}
            >
              <Network size={14} />
              Graph
            </button>
          </nav>
        </div>

        {/* Right side */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          {/* Network badge */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.35rem",
              background: "var(--bg-surface)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-sm)",
              padding: "0.3rem 0.65rem",
              fontSize: "0.68rem",
              color: "var(--text-muted)",
              fontFamily: "var(--font-mono)",
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "var(--green)",
                boxShadow: "0 0 6px var(--green)",
                display: "inline-block",
              }}
            />
            Sepolia
          </div>

          {/* Theme toggle */}
          <button
            className="theme-toggle"
            onClick={toggleTheme}
            title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
          >
            {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
          </button>

          {/* Wallet */}
          <button
            className="btn-secondary"
            onClick={onConnectWallet}
            style={{
              padding: "0.35rem 0.85rem",
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
            }}
          >
            <Wallet size={14} />
            {walletAddress
              ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
              : "Connect Wallet"}
          </button>
        </div>
      </header>

      {/* Content */}
      <main style={{ flex: 1 }}>{children}</main>

      {/* Footer */}
      <footer
        style={{
          borderTop: "1px solid var(--border)",
          background: "var(--bg-base)",
          padding: "0.8rem 1.5rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontSize: "0.68rem",
          color: "var(--text-muted)",
          fontFamily: "var(--font-mono)",
        }}
      >
        <span>Crawlxr -- Decentralized Web Crawler</span>
        <span>Ethereum Sepolia / MongoDB / SHA-256</span>
      </footer>
    </div>
  );
}
