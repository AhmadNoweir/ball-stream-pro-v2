import type { Match, MatchDetail, MatchComment } from "@/types";
import { API_BASE } from "@/lib/api";

function getToken(): string | null {
  return localStorage.getItem("token");
}

export const matchService = {
  async getLiveMatches(): Promise<Match[]> {
    const response = await fetch(`${API_BASE}/matches/live`);
    return response.json();
  },

  async getMatchById(id: string): Promise<Match | undefined> {
    const response = await fetch(`${API_BASE}/matches/${id}`);
    if (!response.ok) return undefined;
    return response.json();
  },

  async getMatchDetails(id: string): Promise<MatchDetail> {
    const response = await fetch(`${API_BASE}/matches/${id}/details`);
    return response.json();
  },

  async getComments(matchId: string): Promise<MatchComment[]> {
    const response = await fetch(`${API_BASE}/matches/${matchId}/comments`);
    return response.json();
  },

  async addComment(matchId: string, content: string): Promise<MatchComment> {
    const response = await fetch(`${API_BASE}/matches/${matchId}/comments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify({ content }),
    });
    return response.json();
  },
};
