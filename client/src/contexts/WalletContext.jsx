import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { BrowserProvider, isAddress } from "ethers";
import { getWalletSummary } from "../services/api";

const WalletContext = createContext(null);

const EMPTY_DETAILS = {
  chainId: null,
  chainName: "Not connected",
  tokenSymbol: "ETH",
  tokensLeftEth: "0",
  tokensUsedEth: "0",
  txCount: 0,
  appTransactions: 0,
  gasCostEthTotal: "0",
  lastTxCostEth: "0",
  lastTxHash: "",
};

function normalizeDecimal(value, digits = 6) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return "0";
  if (numeric === 0) return "0";
  if (numeric < 0.000001) return numeric.toExponential(2);
  return numeric.toFixed(digits).replace(/\.0+$/, "").replace(/(\.\d*?)0+$/, "$1");
}

function getTokenSymbol(chainId) {
  if (chainId === 11155111 || chainId === 1) return "ETH";
  return "NATIVE";
}

export function WalletProvider({ children }) {
  const [address, setAddress] = useState("");
  const [details, setDetails] = useState(EMPTY_DETAILS);
  const [loading, setLoading] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState("");

  const resetWallet = useCallback(() => {
    setAddress("");
    setDetails(EMPTY_DETAILS);
    setError("");
  }, []);

  const refreshWalletDetails = useCallback(
    async (targetAddress) => {
      const activeAddress = targetAddress || address;
      if (!activeAddress || !isAddress(activeAddress) || !window.ethereum) return;

      setLoading(true);
      setError("");

      try {
        const provider = new BrowserProvider(window.ethereum);
        const [network, summary] = await Promise.all([
          provider.getNetwork(),
          getWalletSummary(activeAddress),
        ]);

        const chainId = Number(network.chainId);
        const tokenSymbol = getTokenSymbol(chainId);

        setDetails({
          chainId,
          chainName: summary?.network?.name || network.name || "unknown",
          tokenSymbol,
          tokensLeftEth: normalizeDecimal(summary?.tokensLeftEth ?? summary?.balanceEth ?? "0"),
          tokensUsedEth: normalizeDecimal(summary?.tokensUsedEth ?? summary?.gasCostEthTotal ?? "0"),
          txCount: summary?.txCount ?? 0,
          appTransactions: summary?.appTransactions ?? 0,
          gasCostEthTotal: normalizeDecimal(summary?.gasCostEthTotal ?? "0"),
          lastTxCostEth: normalizeDecimal(summary?.lastAppTx?.costEth ?? "0"),
          lastTxHash: summary?.lastAppTx?.hash ?? "",
        });
      } catch (refreshError) {
        setError(refreshError?.message || "Unable to load wallet details");
      } finally {
        setLoading(false);
      }
    },
    [address]
  );

  const connectWallet = useCallback(async () => {
    if (!window.ethereum) {
      setError("MetaMask not detected");
      return;
    }

    setConnecting(true);
    setError("");

    try {
      const provider = new BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      const nextAddress = accounts?.[0] || "";
      if (!nextAddress) {
        resetWallet();
        return;
      }
      setAddress(nextAddress);
      await refreshWalletDetails(nextAddress);
    } catch (connectError) {
      setError(connectError?.message || "Failed to connect wallet");
    } finally {
      setConnecting(false);
    }
  }, [refreshWalletDetails, resetWallet]);

  useEffect(() => {
    if (!window.ethereum) return;
    let cancelled = false;

    const bootstrapWallet = async () => {
      try {
        const provider = new BrowserProvider(window.ethereum);
        const accounts = await provider.send("eth_accounts", []);
        const nextAddress = accounts?.[0] || "";
        if (!nextAddress || cancelled) return;
        setAddress(nextAddress);
        await refreshWalletDetails(nextAddress);
      } catch {
        // Ignore bootstrap errors and wait for manual connection.
      }
    };

    bootstrapWallet();
    return () => {
      cancelled = true;
    };
  }, [refreshWalletDetails]);

  useEffect(() => {
    if (!window.ethereum?.on) return;

    const handleAccountsChanged = (accounts) => {
      const nextAddress = accounts?.[0] || "";
      if (!nextAddress) {
        resetWallet();
        return;
      }
      setAddress(nextAddress);
      refreshWalletDetails(nextAddress);
    };

    const handleChainChanged = () => {
      if (address) {
        refreshWalletDetails(address);
      }
    };

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);

    return () => {
      if (window.ethereum.removeListener) {
        window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
        window.ethereum.removeListener("chainChanged", handleChainChanged);
      }
    };
  }, [address, refreshWalletDetails, resetWallet]);

  const value = useMemo(
    () => ({
      address,
      isConnected: Boolean(address),
      details,
      loading,
      connecting,
      error,
      connectWallet,
      refreshWalletDetails,
      disconnectWallet: resetWallet,
    }),
    [address, details, loading, connecting, error, connectWallet, refreshWalletDetails, resetWallet]
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet must be used within WalletProvider");
  }
  return context;
}
