import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api",
  timeout: 30000
});

export async function crawlUrl(url) {
  const response = await api.post("/crawl", { url });
  return response.data;
}

export async function verifyUrl(url) {
  const encoded = encodeURIComponent(url);
  const response = await api.get(`/verify/${encoded}`);
  return response.data;
}

export default api;
