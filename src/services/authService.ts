import type { AuthResponse, User } from "@/types";
import { API_BASE } from "@/lib/api";

function getToken(): string | null {
  return localStorage.getItem("token");
}

export const authService = {
  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    return response.json();
  },

  async register(username: string, email: string, password: string): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password }),
    });
    return response.json();
  },

  async logout(): Promise<{ success: boolean }> {
    const token = getToken();
    const response = await fetch(`${API_BASE}/auth/logout`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    localStorage.removeItem("token");
    return response.json();
  },

  async getProfile(): Promise<User> {
    const token = getToken();
    const response = await fetch(`${API_BASE}/auth/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error("Failed to fetch profile");
    return response.json();
  },
};
