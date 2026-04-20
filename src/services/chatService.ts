import type { ChatContact, Message } from "@/types";
import { API_BASE } from "@/lib/api";

function getToken(): string | null {
  return localStorage.getItem("token");
}

export const chatService = {
  async getContacts(): Promise<ChatContact[]> {
    const response = await fetch(`${API_BASE}/chat/contacts`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    return response.json();
  },

  async getMessages(contactId: string): Promise<Message[]> {
    const response = await fetch(`${API_BASE}/chat/messages/${contactId}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    return response.json();
  },

  async sendMessage(senderId: string, receiverId: string, content: string): Promise<Message> {
    const response = await fetch(`${API_BASE}/chat/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify({ receiverId, content }),
    });
    return response.json();
  },

  async markAsRead(contactId: string): Promise<void> {
    await fetch(`${API_BASE}/chat/read/${contactId}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${getToken()}` },
    });
  },

  async getUnreadCount(): Promise<number> {
    const response = await fetch(`${API_BASE}/chat/unread`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    const data = await response.json();
    return data.unreadCount;
  },
};
