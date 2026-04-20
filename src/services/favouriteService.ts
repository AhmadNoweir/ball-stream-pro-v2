import { API_BASE } from "@/lib/api";

function getToken(): string | null {
  return localStorage.getItem("token");
}

export const favouriteService = {
  async getFavourites(): Promise<string[]> {
    const response = await fetch(`${API_BASE}/favourites`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    return response.json();
  },

  async addFavourite(teamName: string): Promise<void> {
    await fetch(`${API_BASE}/favourites`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify({ teamName }),
    });
  },

  async removeFavourite(teamName: string): Promise<void> {
    await fetch(`${API_BASE}/favourites/${encodeURIComponent(teamName)}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${getToken()}` },
    });
  },
};
