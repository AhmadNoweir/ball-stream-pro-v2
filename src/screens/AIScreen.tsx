import { useState, useRef, useEffect } from "react";
import { aiService } from "@/services/aiService";
import type { AIMessage } from "@/types";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Bot, Loader2, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";

const suggestedQuestions = [
  "What live matches are on right now?",
  "Show me today's upcoming fixtures",
  "Best formation for counter-attacking?",
  "How does gegenpressing work?",
];

export default function AIScreen() {
  const [messages, setMessages] = useState<AIMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hey there! I'm your **Football AI Assistant**. Ask me about live matches, today's fixtures, tactics, formations, transfers, or stats.",
      timestamp: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSend = async (text?: string) => {
    const content = (text || input).trim();
    if (!content || isTyping) return;

    const userMsg: AIMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      content,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    const response = await aiService.askAI(content);
    setIsTyping(false);
    setMessages((prev) => [...prev, response]);
  };

  const showSuggestions = messages.length <= 1;

  return (
    <div className="mx-auto flex max-w-3xl flex-col px-5 py-6" style={{ height: "calc(100vh - 70px)" }}>
      <div className="mb-4 flex items-center gap-3">
        <div className="gradient-primary flex h-9 w-9 items-center justify-center rounded-xl">
          <Bot className="h-4.5 w-4.5 text-white" />
        </div>
        <div>
          <h1 className="font-heading text-base font-bold text-foreground">AI Assistant</h1>
          <p className="font-body text-[10px] text-muted-foreground">Powered by Gemini</p>
        </div>
      </div>

      <div className="mb-3 flex-1 space-y-3 overflow-y-auto rounded-2xl bg-card p-4">
        <AnimatePresence>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "assistant" && (
                <div className="gradient-primary mr-2 mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lg">
                  <Bot className="h-3 w-3 text-white" />
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 ${
                  msg.role === "user"
                    ? "gradient-primary rounded-br-md text-white"
                    : "rounded-bl-md bg-secondary text-foreground"
                }`}
              >
                {msg.role === "assistant" ? (
                  <div className="prose prose-sm max-w-none text-[13px] font-body leading-relaxed [&>ol]:mb-1.5 [&>p]:mb-1.5 [&>ul]:mb-1.5 prose-headings:text-foreground prose-li:text-foreground prose-p:text-foreground prose-strong:text-foreground">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="font-body text-[13px] leading-relaxed">{msg.content}</p>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isTyping && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2">
            <div className="gradient-primary flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lg">
              <Bot className="h-3 w-3 text-white" />
            </div>
            <div className="rounded-2xl rounded-bl-md bg-secondary px-4 py-2.5">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
            </div>
          </motion.div>
        )}

        {showSuggestions && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="pt-3">
            <p className="mb-2 flex items-center gap-1 font-body text-[10px] uppercase tracking-wider text-muted-foreground">
              <Sparkles className="h-3 w-3" /> Try asking
            </p>
            <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
              {suggestedQuestions.map((question) => (
                <button
                  key={question}
                  onClick={() => handleSend(question)}
                  className="rounded-xl bg-secondary/60 px-3 py-2 text-left font-body text-[12px] text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                >
                  {question}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        <div ref={bottomRef} />
      </div>

      <div className="flex items-center gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Ask about football or current matches..."
          className="flex-1 rounded-xl bg-card px-4 py-3 font-body text-[13px] text-foreground placeholder:text-muted-foreground transition-all focus:outline-none focus:ring-1 focus:ring-primary/30"
        />
        <button
          onClick={() => handleSend()}
          disabled={!input.trim() || isTyping}
          className="gradient-primary flex h-10 w-10 items-center justify-center rounded-xl text-white transition-opacity disabled:opacity-30"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
