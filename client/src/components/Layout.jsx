import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Link2,
  LayoutDashboard,
  Network,
  Hexagon,
  Moon,
  Sun,
  PanelLeftClose,
  PanelLeftOpen,
  RefreshCw,
  Wallet,
} from "lucide-react";
import { useWallet } from "../contexts/WalletContext";

const THEME_KEY = "crawlxr-theme";

function resolveInitialTheme() {
  if (typeof window === "undefined") return "dark";
  const savedTheme = window.localStorage.getItem(THEME_KEY);
  if (savedTheme === "light" || savedTheme === "dark") return savedTheme;
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function formatAddress(address) {
  if (!address) return "Not connected";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function shortenHash(hash) {
  if (!hash) return "";
  return `${hash.slice(0, 10)}...${hash.slice(-8)}`;
}

function SidebarBrand({ onClick }) {
  return (
    <button
      type="button"
      style={{
        padding: "0.15rem 0",
        background: "none",
        border: "none",
        textAlign: "left",
        cursor: "pointer",
      }}
      onClick={onClick}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
        <div
          style={{
            width: 36,
            height: 36,
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "var(--r-sm)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--text-primary)",
          }}
        >
          <Link2 size={16} />
        </div>
        <div>
          <div
            className="font-display"
            style={{
              fontSize: "1.24rem",
              color: "var(--text-bright)",
              lineHeight: 1,
            }}
          >
            CRAWLXR
          </div>
          <div
            className="font-mono"
            style={{
              fontSize: "0.54rem",
              color: "var(--text-muted)",
              letterSpacing: "0.14em",
            }}
          >
            BLOCKCHAIN CRAWLER
          </div>
        </div>
      </div>
    </button>
  );
}

function NetworkBadge() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.4rem",
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "var(--r-sm)",
        padding: "0.42rem 0.65rem",
      }}
    >
      <span className="status-dot online" style={{ width: 6, height: 6 }} />
      <span
        className="font-mono"
        style={{ fontSize: "0.62rem", color: "var(--text-secondary)", flex: 1 }}
      >
        Sepolia Testnet
      </span>
      <Hexagon size={10} style={{ color: "var(--text-muted)" }} />
    </div>
  );
}

export default function Layout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();

  const {
    address,
    isConnected,
    details,
    loading: walletLoading,
    connecting,
    error: walletError,
    connectWallet,
    refreshWalletDetails,
  } = useWallet();

  const [theme, setTheme] = useState(resolveInitialTheme);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [desktopSidebarCollapsed, setDesktopSidebarCollapsed] = useState(true);

  const explorerBase =
    import.meta.env.VITE_SEPOLIA_EXPLORER || "https://sepolia.etherscan.io/tx/";

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 960px)");
    const syncScreenState = () => {
      setIsMobile(mediaQuery.matches);
      if (!mediaQuery.matches) {
        setMobileSidebarOpen(false);
      }
    };

    syncScreenState();

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", syncScreenState);
      return () => mediaQuery.removeEventListener("change", syncScreenState);
    }

    mediaQuery.addListener(syncScreenState);
    return () => mediaQuery.removeListener(syncScreenState);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    window.localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  useEffect(() => {
    if (!mobileSidebarOpen) return;
    const onEsc = (event) => {
      if (event.key === "Escape") setMobileSidebarOpen(false);
    };
    document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  }, [mobileSidebarOpen]);

  const navItems = [
    { path: "/", icon: LayoutDashboard, label: "Dashboard" },
    { path: "/graph", icon: Network, label: "Signal Graph" },
  ];

  const sidebarOpen = isMobile ? mobileSidebarOpen : !desktopSidebarCollapsed;

  function toggleSidebar() {
    if (isMobile) {
      setMobileSidebarOpen((prev) => !prev);
      return;
    }
    setDesktopSidebarCollapsed((prev) => !prev);
  }

  function closeSidebar() {
    if (isMobile) {
      setMobileSidebarOpen(false);
      return;
    }
    setDesktopSidebarCollapsed(true);
  }

  function handleNavigate(path) {
    navigate(path);
    if (isMobile) setMobileSidebarOpen(false);
  }

  function toggleTheme() {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  }

  const walletRows = useMemo(
    () => [
      { label: "Tokens left", value: `${details.tokensLeftEth} ${details.tokenSymbol}` },
      { label: "Tokens used", value: `${details.tokensUsedEth} ${details.tokenSymbol}` },
      { label: "Gas spent", value: `${details.gasCostEthTotal} ${details.tokenSymbol}` },
      { label: "Last tx cost", value: `${details.lastTxCostEth} ${details.tokenSymbol}` },
      { label: "Tx sent", value: String(details.txCount) },
      { label: "App tx", value: String(details.appTransactions) },
    ],
    [details]
  );

  return (
    <>
      <div className="scan-overlay" />

      <div className={`app-shell ${desktopSidebarCollapsed ? "sidebar-collapsed" : ""}`}>
        {isMobile && mobileSidebarOpen && (
          <button
            className="sidebar-backdrop"
            onClick={() => setMobileSidebarOpen(false)}
            aria-label="Close navigation"
          />
        )}

        <aside className={`sidebar ${isMobile && mobileSidebarOpen ? "open" : ""}`}>
          <div className="sidebar-header-wrap">
            <SidebarBrand onClick={() => handleNavigate("/")} />
            <button
              className="btn-ghost"
              onClick={closeSidebar}
              aria-label="Close sidebar"
              style={{ padding: "0.34rem 0.5rem" }}
            >
              <PanelLeftClose size={13} />
            </button>
          </div>

          <div style={{ padding: "0 0.95rem 0.8rem" }}>
            <NetworkBadge />
          </div>

          <div style={{ padding: "0.15rem 0.65rem" }}>
            <div className="section-label" style={{ padding: "0.35rem 0.45rem", marginBottom: "0.15rem" }}>
              Navigation
            </div>
            {navItems.map(({ path, icon: Icon, label }) => (
              <button
                key={path}
                className={`nav-item ${location.pathname === path ? "active" : ""}`}
                onClick={() => handleNavigate(path)}
              >
                <Icon size={15} />
                {label}
              </button>
            ))}
          </div>

          <div style={{ padding: "0.4rem 0.65rem" }}>
            <div className="section-label" style={{ padding: "0.35rem 0.45rem", marginBottom: "0.15rem" }}>
              Appearance
            </div>
            <button className="nav-item" onClick={toggleTheme}>
              {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
              {theme === "dark" ? "Switch to Light" : "Switch to Dark"}
            </button>
          </div>

          <div style={{ padding: "0.5rem 0.65rem 0.35rem", marginTop: "auto" }}>
            <div className="section-label" style={{ padding: "0.35rem 0.45rem", marginBottom: "0.25rem" }}>
              Wallet
            </div>

            <button
              className={isConnected ? "btn-secondary" : "btn-primary"}
              onClick={connectWallet}
              disabled={connecting}
              style={{ width: "100%", justifyContent: "center", marginBottom: "0.5rem" }}
            >
              <Wallet size={13} />
              {connecting
                ? "Connecting..."
                : isConnected
                ? formatAddress(address)
                : "Connect Wallet"}
            </button>

            <div className="wallet-panel">
              {!isConnected ? (
                <div className="font-mono" style={{ fontSize: "0.64rem", color: "var(--text-muted)", lineHeight: 1.6 }}>
                  Connect your wallet to view token balance, gas usage, and transaction cost details.
                </div>
              ) : (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                    <span className="font-mono" style={{ fontSize: "0.58rem", color: "var(--text-muted)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                      {details.chainName}
                    </span>
                    <button
                      className="btn-ghost"
                      onClick={() => refreshWalletDetails(address)}
                      disabled={walletLoading}
                      style={{ padding: "0.2rem 0.45rem", fontSize: "0.58rem" }}
                    >
                      <RefreshCw size={10} style={{ animation: walletLoading ? "spin 1s linear infinite" : "none" }} />
                      Refresh
                    </button>
                  </div>

                  <div className="wallet-metric-grid">
                    {walletRows.map((row) => (
                      <div className="wallet-metric" key={row.label}>
                        <span>{row.label}</span>
                        <strong>{row.value}</strong>
                      </div>
                    ))}
                  </div>

                  {details.lastTxHash && (
                    <a
                      href={`${explorerBase}${details.lastTxHash}`}
                      target="_blank"
                      rel="noreferrer"
                      className="font-mono"
                      style={{
                        display: "inline-flex",
                        marginTop: "0.5rem",
                        fontSize: "0.58rem",
                        color: "var(--text-secondary)",
                        textDecoration: "none",
                      }}
                    >
                      Last tx: {shortenHash(details.lastTxHash)}
                    </a>
                  )}
                </>
              )}
            </div>

            {walletError && (
              <div className="font-mono" style={{ marginTop: "0.35rem", color: "var(--red)", fontSize: "0.58rem" }}>
                {walletError}
              </div>
            )}
          </div>

          <div
            style={{
              padding: "0.85rem 1rem",
              borderTop: "1px solid var(--border-dim)",
              marginTop: "0.5rem",
            }}
          >
            <div
              className="font-mono"
              style={{
                fontSize: "0.56rem",
                color: "var(--text-muted)",
                lineHeight: 1.6,
              }}
            >
              SHA-256 · EVM · MongoDB
              <br />
              <span style={{ color: "var(--text-secondary)" }}>v2.0 · CrawlXR</span>
            </div>
          </div>
        </aside>

        <main className="main-content">
          {!sidebarOpen && (
            <button className="menu-fab" onClick={toggleSidebar} aria-label="Open menu">
              <PanelLeftOpen size={14} />
              Menu
            </button>
          )}
          {children}
        </main>
      </div>
    </>
  );
}
