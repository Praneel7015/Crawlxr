import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api",
  timeout: 35000,
});

export async function crawlUrl(url) {
  const { data } = await api.post("/crawl", { url });
  return data;
}

export async function verifyUrl(url) {
  const { data } = await api.get(`/verify/${encodeURIComponent(url)}`);
  return data;
}

export async function getHistory(limit = 30) {
  const { data } = await api.get(`/history?limit=${limit}`);
  return data;
}

export async function getStats() {
  const { data } = await api.get("/stats");
  return data;
}

export async function getGraphData() {
  const { data } = await api.get("/graph");
  return data;
}

export async function searchHistory(query, limit = 20) {
  const { data } = await api.get(`/search?q=${encodeURIComponent(query)}&limit=${limit}`);
  return data;
}

export async function getDomainStats() {
  const { data } = await api.get("/domains");
  return data;
}

export async function exportData(format = "json") {
  const response = await api.get(`/export?format=${format}`, {
    responseType: format === "csv" ? "blob" : "json",
  });
  return response.data;
}

export async function getUrlHistory(url) {
  const { data } = await api.get(`/url-history/${encodeURIComponent(url)}`);
  return data;
}

export async function getWalletSummary(address) {
  const { data } = await api.get(`/wallet/${encodeURIComponent(address)}/summary`);
  return data;
}

export default api;
