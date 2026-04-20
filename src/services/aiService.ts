import type { AIMessage } from "@/types";
import { API_BASE } from "@/lib/api";

function getToken(): string | null {
  return localStorage.getItem("token");
}

export const aiService = {
  async askAI(question: string): Promise<AIMessage> {
    const response = await fetch(`${API_BASE}/ai/ask`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify({ question }),
    });
    return response.json();
  },
};
