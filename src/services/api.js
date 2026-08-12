// Fetch wrapper terpusat ke backend CodeIgniter.
// Semua service (auth, packages, booking) lewat sini supaya:
// - base URL cuma didefinisikan 1x
// - Authorization: Bearer <token> otomatis ditempel kalau user sudah login
// - parsing error response seragam

import { API_URL } from "../config/BaseUrl.js";

const TOKEN_KEY = "nama_marine_token";

export function getToken() {
  const token = localStorage.getItem(TOKEN_KEY);
  console.log("[getToken]", token ? "Found token" : "No token");
  return token;
}

export function setToken(token) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
    console.log("[setToken] Token saved:", token.substring(0, 20) + "...");
  } else {
    localStorage.removeItem(TOKEN_KEY);
    console.log("[setToken] Token cleared");
  }
}

class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

async function request(path, { method = "GET", body, auth = false } = {}) {
  const headers = { "Content-Type": "application/json" };

  if (auth) {
    const token = getToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
      console.log("[request] Auth header added");
    } else {
      console.log("[request] Auth requested but no token available");
    }
  }

  const url = `${API_URL}${path}`;
  console.log(`[request] ${method} ${url}`);

  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  // Backend selalu balas JSON (termasuk saat error), jadi aman di-parse langsung
  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const message = data?.error || "Terjadi kesalahan, silakan coba lagi.";
    console.error("[request] Error response:", res.status, message);
    throw new ApiError(message, res.status, data);
  }

  console.log("[request] Success:", data);
  return data;
}

export const api = {
  get: (path, options) => request(path, { ...options, method: "GET" }),
  post: (path, body, options) =>
    request(path, { ...options, method: "POST", body }),
  put: (path, body, options) =>
    request(path, { ...options, method: "PUT", body }),
  delete: (path, options) => request(path, { ...options, method: "DELETE" }),
};

export { ApiError };
