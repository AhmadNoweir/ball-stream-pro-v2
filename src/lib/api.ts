const DEFAULT_API_BASE = "http://localhost:3000/api";

function normalizeApiBase(apiBase: string): string {
  return apiBase.replace(/\/+$/, "");
}

function inferSocketUrl(apiBase: string): string {
  return apiBase.replace(/\/api$/, "");
}

export const API_BASE = normalizeApiBase(import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE);
export const SOCKET_URL = inferSocketUrl(API_BASE);
