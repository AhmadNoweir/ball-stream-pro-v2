import { useEffect, useState, useRef } from "react";
import { matchService } from "@/services/matchService";
import { useAuth } from "@/context/AuthContext";
import type { Match, MatchDetail, MatchComment, TeamDetail } from "@/types";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, Send, MapPin, Calendar, Flag, Users, Clock, MessageSquare, Trophy, Swords, Shield, User, Globe } from "lucide-react";

interface Props {
  match: Match;
  onClose: () => void;
}

function TeamCrest({ logo, shortName, size = "lg" }: { logo: string; shortName: string; size?: "md" | "lg" }) {
  const dim = size === "lg" ? "h-14 w-14" : "h-10 w-10";
  if (logo && logo.startsWith("http")) {
    return <img src={logo} alt={shortName} className={`${dim} object-contain`} />;
  }
  return (
    <div className={`${dim} rounded-full bg-secondary flex items-center justify-center`}>
      <span className="text-xs font-heading font-bold text-muted-foreground">{shortName}</span>
    </div>
  );
}

function SquadSection({ team, color }: { team: TeamDetail; color: string }) {
  const grouped: Record<string, typeof team.squad> = {};
  const order = ["Goalkeeper", "Defence", "Midfield", "Offence", "Unknown"];
  for (const p of team.squad) {
    const pos = p.position || "Unknown";
    if (!grouped[pos]) grouped[pos] = [];
    grouped[pos].push(p);
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <TeamCrest logo={team.crest} shortName={team.shortName} size="md" />
        <div>
          <p className="text-sm font-body font-semibold text-foreground">{team.shortName}</p>
          {team.coach && <p className="text-[11px] text-muted-foreground font-body">Coach: {team.coach.name}</p>}
        </div>
      </div>

      {/* Team info chips */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {team.founded && (
          <span className="text-[10px] font-body text-muted-foreground bg-muted rounded px-2 py-0.5">Est. {team.founded}</span>
        )}
        {team.venue && (
          <span className="text-[10px] font-body text-muted-foreground bg-muted rounded px-2 py-0.5">{team.venue}</span>
        )}
        {team.clubColors && (
          <span className="text-[10px] font-body text-muted-foreground bg-muted rounded px-2 py-0.5">{team.clubColors}</span>
        )}
      </div>

      {/* Squad by position */}
      <div className="space-y-2.5">
        {order.map((pos) => {
          const players = grouped[pos];
          if (!players || players.length === 0) return null;
          return (
            <div key={pos}>
              <p className="text-[10px] font-body font-semibold text-muted-foreground uppercase tracking-wider mb-1">{pos}</p>
              <div className="flex flex-wrap gap-1">
                {players.map((p, i) => (
                  <span key={i} className={`text-[11px] font-body rounded-md border px-2 py-0.5 ${color}`}>
                    {p.name}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function MatchDetailModal({ match, onClose }: Props) {
  const { user } = useAuth();
  const [detail, setDetail] = useState<MatchDetail | null>(null);
  const [comments, setComments] = useState<MatchComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingComments, setLoadingComments] = useState(true);
  const [commentText, setCommentText] = useState("");
  const [sending, setSending] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "squads" | "comments">("overview");

  useEffect(() => {
    matchService.getMatchDetails(match.id).then((data) => {
      setDetail(data);
      setLoading(false);
    });
    matchService.getComments(match.id).then((data) => {
      setComments(data);
      setLoadingComments(false);
    });
  }, [match.id]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleSendComment = async () => {
    if (!commentText.trim() || sending) return;
    setSending(true);
    const comment = await matchService.addComment(match.id, commentText.trim());
    setComments((prev) => [comment, ...prev]);
    setCommentText("");
    setSending(false);
  };

  const isLive = match.status === "live";
  const d = detail?.details;
  const h2h = detail?.headToHead;

  const tabs = [
    { id: "overview" as const, label: "Overview", icon: Trophy },
    { id: "squads" as const, label: "Squads", icon: Users },
    { id: "comments" as const, label: `Comments (${comments.length})`, icon: MessageSquare },
  ];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-2xl max-h-[90vh] bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        >
          {/* Score Header */}
          <div className={`relative p-6 pb-4 ${isLive ? "bg-live/5" : "bg-secondary/20"}`}>
            <button onClick={onClose} className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground z-10">
              <X className="h-5 w-5" />
            </button>

            <div className="text-center mb-1">
              <span className="text-[11px] font-body font-semibold text-muted-foreground">{match.league}</span>
              {d?.stage && d.stage !== "REGULAR_SEASON" && (
                <span className="text-[11px] text-muted-foreground font-body"> &middot; {d.stage.replace(/_/g, " ")}</span>
              )}
              {d?.group && <span className="text-[11px] text-muted-foreground font-body"> &middot; {d.group.replace(/_/g, " ")}</span>}
            </div>

            {isLive && (
              <div className="flex items-center justify-center gap-1.5 mb-2">
                <span className="h-2 w-2 rounded-full bg-live animate-pulse" />
                <span className="text-xs font-body font-bold text-live uppercase">Live {match.time}</span>
              </div>
            )}

            <div className="flex items-center justify-center gap-5 mt-2">
              <div className="text-center flex-1">
                <TeamCrest logo={match.teamA.logo} shortName={match.teamA.shortName} />
                <p className="font-body font-semibold text-foreground text-sm mt-2">{match.teamA.name}</p>
                {detail?.homeTeamInfo?.coach && (
                  <p className="text-[10px] text-muted-foreground font-body mt-0.5">{detail.homeTeamInfo.coach.name}</p>
                )}
              </div>

              <div className="text-center">
                <div className={`rounded-xl px-5 py-3 ${isLive ? "bg-live/10" : "bg-secondary"}`}>
                  <p className={`font-heading text-3xl font-bold ${isLive ? "text-live" : "text-foreground"}`}>
                    {match.score}
                  </p>
                </div>
                {d?.halfTime && (
                  <p className="text-[10px] text-muted-foreground font-body mt-1.5">Half-time: {d.halfTime}</p>
                )}
                {match.status === "upcoming" && (
                  <p className="text-xs text-warning font-body font-semibold mt-1.5">{match.time}</p>
                )}
                {match.status === "finished" && (
                  <p className="text-[10px] text-muted-foreground font-body mt-1.5">Full Time</p>
                )}
              </div>

              <div className="text-center flex-1">
                <TeamCrest logo={match.teamB.logo} shortName={match.teamB.shortName} />
                <p className="font-body font-semibold text-foreground text-sm mt-2">{match.teamB.name}</p>
                {detail?.awayTeamInfo?.coach && (
                  <p className="text-[10px] text-muted-foreground font-body mt-0.5">{detail.awayTeamInfo.coach.name}</p>
                )}
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-border px-4">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-body font-semibold border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto p-5">
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : activeTab === "overview" ? (
              <div className="space-y-6">
                {/* Match Info */}
                <div className="flex flex-wrap gap-2">
                  {d?.date && (
                    <div className="flex items-center gap-1.5 rounded-lg bg-muted px-3 py-1.5 text-[11px] font-body text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {new Date(d.date).toLocaleDateString([], { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
                      {" at "}
                      {new Date(d.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  )}
                  {d?.venue && (
                    <div className="flex items-center gap-1.5 rounded-lg bg-muted px-3 py-1.5 text-[11px] font-body text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {d.venue}
                    </div>
                  )}
                  {d?.matchday && (
                    <div className="flex items-center gap-1.5 rounded-lg bg-muted px-3 py-1.5 text-[11px] font-body text-muted-foreground">
                      <Flag className="h-3 w-3" />
                      Matchday {d.matchday}
                    </div>
                  )}
                </div>

                {/* Referees */}
                {d && d.referees.length > 0 && (
                  <div>
                    <h4 className="flex items-center gap-1.5 text-xs font-heading font-bold text-foreground uppercase tracking-wide mb-2">
                      <Shield className="h-3.5 w-3.5 text-primary" />
                      Officials
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {d.referees.map((r, i) => (
                        <div key={i} className="flex items-center gap-1.5 rounded-lg bg-muted px-3 py-1.5 text-[11px] font-body text-muted-foreground">
                          <User className="h-3 w-3" />
                          {r.name}
                          <span className="text-muted-foreground/50">{r.role}</span>
                          {r.nationality && <span className="text-muted-foreground/50">({r.nationality})</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Head to Head */}
                {h2h && h2h.totalMatches > 0 && (
                  <div>
                    <h4 className="flex items-center gap-1.5 text-xs font-heading font-bold text-foreground uppercase tracking-wide mb-3">
                      <Swords className="h-3.5 w-3.5 text-primary" />
                      Head to Head
                      <span className="text-muted-foreground font-body font-normal normal-case tracking-normal">
                        ({h2h.totalMatches} matches, {h2h.totalGoals} goals)
                      </span>
                    </h4>

                    {/* H2H Summary */}
                    <div className="rounded-xl border border-border bg-muted/30 p-4 mb-4">
                      {/* Three-column: Home wins | Draws | Away wins */}
                      <div className="grid grid-cols-3 text-center gap-2 mb-3">
                        <div>
                          <p className="font-heading text-2xl font-bold text-primary">{h2h.homeWins}</p>
                          <p className="text-[10px] font-body text-muted-foreground mt-0.5">{match.teamA.shortName} Wins</p>
                        </div>
                        <div>
                          <p className="font-heading text-2xl font-bold text-muted-foreground">{h2h.draws}</p>
                          <p className="text-[10px] font-body text-muted-foreground mt-0.5">Draws</p>
                        </div>
                        <div>
                          <p className="font-heading text-2xl font-bold text-destructive">{h2h.awayWins}</p>
                          <p className="text-[10px] font-body text-muted-foreground mt-0.5">{match.teamB.shortName} Wins</p>
                        </div>
                      </div>

                      {/* Visual bar */}
                      <div className="flex h-2.5 rounded-full overflow-hidden bg-muted">
                        {h2h.homeWins > 0 && (
                          <div className="bg-primary transition-all rounded-l-full" style={{ width: `${(h2h.homeWins / h2h.totalMatches) * 100}%` }} />
                        )}
                        {h2h.draws > 0 && (
                          <div className="bg-muted-foreground/40 transition-all" style={{ width: `${(h2h.draws / h2h.totalMatches) * 100}%` }} />
                        )}
                        {h2h.awayWins > 0 && (
                          <div className="bg-destructive/70 transition-all rounded-r-full" style={{ width: `${(h2h.awayWins / h2h.totalMatches) * 100}%` }} />
                        )}
                      </div>
                    </div>

                    {/* Recent Meetings */}
                    {h2h.recentMatches.length > 0 && (
                      <div>
                        <p className="text-[10px] font-body font-semibold text-muted-foreground uppercase tracking-wider mb-2">Recent Meetings</p>
                        <div className="space-y-1.5">
                          {h2h.recentMatches.map((rm, i) => (
                            <div key={i} className="flex items-center gap-2 rounded-lg bg-muted/50 border border-border/50 px-3 py-2 text-[11px] font-body">
                              <span className="text-muted-foreground w-16 flex-shrink-0">
                                {new Date(rm.date).toLocaleDateString([], { month: "short", day: "numeric" })}
                              </span>
                              <span className={`flex-1 truncate text-right ${rm.winner === "HOME_TEAM" ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
                                {rm.homeTeam}
                              </span>
                              <span className="font-heading font-bold text-primary px-2 flex-shrink-0">{rm.score}</span>
                              <span className={`flex-1 truncate ${rm.winner === "AWAY_TEAM" ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
                                {rm.awayTeam}
                              </span>
                              <span className="text-muted-foreground/50 text-[10px] flex-shrink-0 truncate max-w-[60px]">{rm.competition}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : activeTab === "squads" ? (
              <div>
                {!detail?.homeTeamInfo && !detail?.awayTeamInfo ? (
                  <p className="text-sm text-muted-foreground font-body text-center py-8">Squad data not available for this match</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {detail?.homeTeamInfo && (
                      <SquadSection team={detail.homeTeamInfo} color="border-primary/30 text-foreground" />
                    )}
                    {detail?.awayTeamInfo && (
                      <SquadSection team={detail.awayTeamInfo} color="border-destructive/30 text-foreground" />
                    )}
                  </div>
                )}
              </div>
            ) : (
              /* Comments tab */
              <div>
                {/* Comment input */}
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-8 w-8 rounded-full gradient-primary flex items-center justify-center flex-shrink-0">
                    <span className="text-[10px] font-heading font-bold text-primary-foreground">
                      {user?.username?.[0] || "?"}
                    </span>
                  </div>
                  <input
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSendComment()}
                    placeholder="Add a comment..."
                    className="flex-1 rounded-xl border border-border bg-muted px-3.5 py-2 text-sm text-foreground font-body placeholder:text-muted-foreground focus:border-primary focus:outline-none transition-colors"
                  />
                  <button
                    onClick={handleSendComment}
                    disabled={!commentText.trim() || sending}
                    className="flex h-9 w-9 items-center justify-center rounded-xl gradient-primary text-primary-foreground disabled:opacity-40 transition-opacity"
                  >
                    {sending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                  </button>
                </div>

                {/* Comment list */}
                {loadingComments ? (
                  <div className="flex justify-center py-6">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  </div>
                ) : comments.length === 0 ? (
                  <p className="text-sm text-muted-foreground font-body text-center py-8">
                    No comments yet. Be the first to share your thoughts!
                  </p>
                ) : (
                  <div className="space-y-3">
                    {comments.map((c) => (
                      <div key={c.id} className="flex gap-2.5">
                        <div className="h-7 w-7 rounded-full bg-secondary flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-[9px] font-heading font-bold text-primary">
                            {c.user.username[0]}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-body font-semibold text-foreground">{c.user.username}</span>
                            <span className="text-[10px] text-muted-foreground font-body">
                              {new Date(c.timestamp).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </div>
                          <p className="text-sm font-body text-foreground/90 mt-0.5">{c.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
