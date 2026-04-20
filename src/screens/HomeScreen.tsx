import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { matchService } from "@/services/matchService";
import { chatService } from "@/services/chatService";
import type { Match } from "@/types";
import { MatchCard } from "@/components/MatchCard";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { motion } from "framer-motion";
import { Trophy, MessageCircle, Bot, ChevronRight, Zap, Users, BarChart3, Flame, ArrowRight } from "lucide-react";

export default function HomeScreen() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [allMatches, setAllMatches] = useState<Match[]>([]);
  const [liveMatches, setLiveMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [contactCount, setContactCount] = useState(0);

  useEffect(() => {
    matchService.getLiveMatches().then((data) => {
      setAllMatches(data);
      setLiveMatches(data.filter((m) => m.status === "live"));
      setLoading(false);
    });
    chatService.getContacts().then((data) => setContactCount(data.length)).catch(() => {});
  }, []);

  const upcomingCount = allMatches.filter((m) => m.status === "upcoming").length;

  return (
    <div className="mx-auto max-w-7xl px-5 py-6">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl p-7 md:p-9 mb-7 bg-secondary border border-border/60"
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,hsl(var(--primary)/0.08),transparent_60%)]" />
        <div className="absolute -right-16 -bottom-16 h-48 w-48 rounded-full bg-primary/5 blur-3xl" />
        <div className="relative z-10">
          <p className="text-muted-foreground font-body text-xs uppercase tracking-widest mb-2">Welcome back</p>
          <h1 className="font-heading text-2xl md:text-3xl font-bold text-foreground mb-2">
            {user?.username || "Player"}
          </h1>
          <p className="text-muted-foreground font-body text-sm max-w-md">
            {liveMatches.length > 0
              ? `${liveMatches.length} match${liveMatches.length > 1 ? "es" : ""} live right now.`
              : upcomingCount > 0
                ? `${upcomingCount} upcoming match${upcomingCount > 1 ? "es" : ""} on schedule.`
                : "Your football hub awaits."}
          </p>
          <button
            onClick={() => navigate("/matches")}
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg gradient-primary px-4 py-2 text-xs font-body font-semibold text-white hover:opacity-90 transition-opacity"
          >
            View Matches <ArrowRight className="h-3 w-3" />
          </button>
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-7">
        {[
          { icon: Zap, label: "Live", value: liveMatches.length, color: "text-live", bg: "bg-live/10", to: "/matches" },
          { icon: Trophy, label: "Total", value: allMatches.length, color: "text-primary", bg: "bg-primary/10", to: "/matches" },
          { icon: MessageCircle, label: "Chats", value: contactCount, color: "text-primary", bg: "bg-primary/10", to: "/chat" },
          { icon: Bot, label: "AI", value: "Go", color: "text-warning", bg: "bg-warning/10", to: "/ai" },
        ].map((stat) => (
          <button
            key={stat.label}
            onClick={() => navigate(stat.to)}
            className="group rounded-2xl bg-card p-4 hover:shadow-md transition-all text-left border border-transparent hover:border-border/60"
          >
            <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${stat.bg} mb-2`}>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </div>
            <p className="font-heading text-lg font-bold text-foreground">{stat.value}</p>
            <p className="text-[10px] text-muted-foreground font-body uppercase tracking-wider">{stat.label}</p>
          </button>
        ))}
      </motion.div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Matches */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-body text-sm font-semibold text-foreground flex items-center gap-2">
              {liveMatches.length > 0 ? (
                <><Flame className="h-4 w-4 text-live" /> Live Now</>
              ) : (
                <><Trophy className="h-4 w-4 text-primary" /> Recent</>
              )}
            </h2>
            <button onClick={() => navigate("/matches")} className="flex items-center gap-1 text-[11px] text-muted-foreground font-body hover:text-primary transition-colors">
              All Matches <ChevronRight className="h-3 w-3" />
            </button>
          </div>

          {loading ? (
            <LoadingSpinner size="sm" />
          ) : (liveMatches.length > 0 || allMatches.length > 0) ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {(liveMatches.length > 0 ? liveMatches : allMatches).slice(0, 4).map((match) => (
                <MatchCard key={match.id} match={match} onClick={() => navigate("/matches")} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl bg-card p-10 text-center">
              <Trophy className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-xs text-muted-foreground font-body">No matches right now</p>
            </div>
          )}
        </motion.div>

        {/* Sidebar */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <div className="rounded-2xl bg-card p-4">
            <h3 className="font-body text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-1">Quick Access</h3>
            <div className="space-y-1">
              {[
                { icon: Users, label: "Chat with Fans", desc: "Join conversations", to: "/chat", color: "text-primary" },
                { icon: BarChart3, label: "All Matches", desc: "Scores & fixtures", to: "/matches", color: "text-live" },
                { icon: Bot, label: "AI Insights", desc: "Ask anything", to: "/ai", color: "text-warning" },
              ].map((item) => (
                <button
                  key={item.to + item.label}
                  onClick={() => navigate(item.to)}
                  className="w-full flex items-center gap-3 rounded-xl p-2.5 text-left hover:bg-secondary/60 transition-colors group"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary group-hover:bg-muted transition-colors">
                    <item.icon className={`h-3.5 w-3.5 ${item.color}`} />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-body font-medium text-foreground">{item.label}</p>
                    <p className="text-[10px] text-muted-foreground font-body">{item.desc}</p>
                  </div>
                  <ChevronRight className="h-3 w-3 text-border group-hover:text-muted-foreground transition-colors" />
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
