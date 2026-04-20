import { useEffect, useState, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { chatService } from "@/services/chatService";
import { useAuth } from "@/context/AuthContext";
import type { ChatContact, Message } from "@/types";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { EmptyState } from "@/components/EmptyState";
import { SOCKET_URL } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Send, MessageCircle } from "lucide-react";

export default function ChatScreen() {
  const { user } = useAuth();
  const currentUserId = user!.id;

  const [contacts, setContacts] = useState<ChatContact[]>([]);
  const [selected, setSelected] = useState<ChatContact | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [msgLoading, setMsgLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const selectedRef = useRef<ChatContact | null>(null);

  useEffect(() => { selectedRef.current = selected; }, [selected]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    const socket = io(SOCKET_URL, { auth: { token } });
    socketRef.current = socket;

    socket.on("message:receive", (message: Message) => {
      if (selectedRef.current && message.sender_id === selectedRef.current.id) {
        setMessages((prev) => [...prev, message]);
        chatService.markAsRead(message.sender_id).then(() => {
          window.dispatchEvent(new Event("chat:read"));
        });
      } else {
        setContacts((prev) =>
          prev.map((c) =>
            c.id === message.sender_id
              ? { ...c, unreadCount: (c.unreadCount || 0) + 1, lastMessage: message.content }
              : c
          )
        );
      }
    });

    socket.on("user:online", ({ userId, online }: { userId: string; online: boolean }) => {
      setContacts((prev) => prev.map((c) => (c.id === userId ? { ...c, online } : c)));
    });

    return () => { socket.disconnect(); };
  }, []);

  useEffect(() => {
    chatService.getContacts().then((data) => { setContacts(data); setLoading(false); });
  }, []);

  useEffect(() => {
    if (selected) {
      setMsgLoading(true);
      chatService.getMessages(selected.id).then((data) => { setMessages(data); setMsgLoading(false); });
      chatService.markAsRead(selected.id).then(() => {
        window.dispatchEvent(new Event("chat:read"));
      });
      setContacts((prev) => prev.map((c) => (c.id === selected.id ? { ...c, unreadCount: 0 } : c)));
    }
  }, [selected]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !selected) return;
    const msg = await chatService.sendMessage(currentUserId, selected.id, input.trim());
    setMessages((prev) => [...prev, msg]);
    socketRef.current?.emit("message:send", { receiverId: selected.id, message: msg });
    setInput("");
  };

  if (loading) return <div className="mx-auto max-w-7xl px-5 py-6"><LoadingSpinner /></div>;

  return (
    <div className="mx-auto max-w-7xl px-5 py-6">
      <h1 className="font-heading text-xl font-bold text-foreground mb-5">Messages</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4" style={{ height: "calc(100vh - 180px)" }}>
        {/* Contacts */}
        <div className={`lg:block ${selected ? "hidden" : "block"} rounded-2xl bg-card overflow-y-auto`}>
          <div className="p-3.5 border-b border-border/60">
            <p className="text-xs font-body font-semibold text-muted-foreground uppercase tracking-wider">Contacts</p>
          </div>
          {contacts.length === 0 ? (
            <EmptyState icon={<MessageCircle className="h-8 w-8" />} title="No conversations" />
          ) : (
            <div>
              {contacts.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelected(c)}
                  className={`w-full flex items-center gap-3 px-3.5 py-3 text-left transition-colors hover:bg-secondary/50 ${
                    selected?.id === c.id ? "bg-secondary/60" : ""
                  }`}
                >
                  <div className="relative flex-shrink-0">
                    <div className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center">
                      <span className="font-heading text-xs font-bold text-primary">{c.username[0]}</span>
                    </div>
                    {c.online && <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-live border-2 border-card" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-body font-semibold text-xs text-foreground">{c.username}</p>
                      {(c.unreadCount ?? 0) > 0 && (
                        <span className="flex h-4.5 min-w-[18px] items-center justify-center rounded-full bg-live px-1 text-[9px] font-bold text-white">
                          {c.unreadCount}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground font-body truncate">{c.lastMessage}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Chat Area */}
        <div className={`lg:col-span-2 lg:flex ${selected ? "flex" : "hidden lg:flex"} flex-col rounded-2xl bg-card overflow-hidden`}>
          {selected ? (
            <>
              {/* Header */}
              <div className="flex items-center gap-3 border-b border-border/60 px-4 py-3">
                <button onClick={() => setSelected(null)} className="lg:hidden text-muted-foreground hover:text-foreground">
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <div className="relative">
                  <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center">
                    <span className="font-heading text-[10px] font-bold text-primary">{selected.username[0]}</span>
                  </div>
                  {selected.online && <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-live border border-card" />}
                </div>
                <div>
                  <p className="font-body font-semibold text-xs text-foreground">{selected.username}</p>
                  <p className="text-[10px] text-muted-foreground font-body">{selected.online ? "Online" : "Offline"}</p>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2.5">
                {msgLoading ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <AnimatePresence>
                    {messages.map((msg) => {
                      const isMine = msg.sender_id === currentUserId;
                      return (
                        <motion.div
                          key={msg.id}
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                        >
                          <div className={`max-w-[70%] rounded-2xl px-3.5 py-2 ${
                            isMine
                              ? "gradient-primary text-white rounded-br-md"
                              : "bg-secondary text-foreground rounded-bl-md"
                          }`}>
                            <p className="text-[13px] font-body leading-relaxed">{msg.content}</p>
                            <p className={`text-[9px] mt-0.5 ${isMine ? "text-white/50" : "text-muted-foreground"}`}>
                              {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </p>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                )}
                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <div className="border-t border-border/60 px-4 py-3">
                <div className="flex items-center gap-2">
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                    placeholder="Type a message..."
                    className="flex-1 rounded-xl bg-secondary px-3.5 py-2.5 text-[13px] text-foreground font-body placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all"
                  />
                  <button
                    onClick={handleSend}
                    disabled={!input.trim()}
                    className="flex h-9 w-9 items-center justify-center rounded-xl gradient-primary text-white disabled:opacity-30 transition-opacity"
                  >
                    <Send className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageCircle className="h-10 w-10 text-border mx-auto mb-2" />
                <p className="text-xs text-muted-foreground font-body">Select a conversation</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
