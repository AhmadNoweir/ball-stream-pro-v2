import { useEffect, useState } from "react";
import { matchService } from "@/services/matchService";
import { favouriteService } from "@/services/favouriteService";
import type { Match } from "@/types";
import { MatchCard } from "@/components/MatchCard";
import { MatchDetailModal } from "@/components/MatchDetailModal";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { EmptyState } from "@/components/EmptyState";
import { motion } from "framer-motion";
import { Trophy, Zap, Clock, CheckCircle2, Star, Heart, Filter } from "lucide-react";

type StatusTab = "all" | "live" | "upcoming" | "finished" | "favourites";

function groupByLeague(matches: Match[]): Record<string, Match[]> {
  const groups: Record<string, Match[]> = {};
  for (const m of matches) {
    if (!groups[m.league]) groups[m.league] = [];
    groups[m.league].push(m);
  }
  return groups;
}

const statusConfig = {
  live: { label: "Live", icon: Zap, accent: "text-live", bg: "bg-live/10", dot: "bg-live" },
  upcoming: { label: "Upcoming", icon: Clock, accent: "text-warning", bg: "bg-warning/10", dot: "bg-warning" },
  finished: { label: "Finished", icon: CheckCircle2, accent: "text-muted-foreground", bg: "bg-muted", dot: "bg-muted-foreground" },
};

function MatchSection({
  status, matches, favTeams, onToggleFav, onMatchClick,
}: {
  status: "live" | "upcoming" | "finished";
  matches: Match[];
  favTeams: Set<string>;
  onToggleFav: (name: string) => void;
  onMatchClick: (match: Match) => void;
}) {
  const config = statusConfig[status];
  const Icon = config.icon;
  const byLeague = groupByLeague(matches);

  if (matches.length === 0) return null;

  return (
    <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
      <div className="flex items-center gap-2.5 mb-5">
        <div className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 ${config.bg}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${config.dot} ${status === "live" ? "animate-pulse" : ""}`} />
          <Icon className={`h-3.5 w-3.5 ${config.accent}`} />
          <span className={`text-[11px] font-body font-bold uppercase tracking-wider ${config.accent}`}>{config.label}</span>
          <span className={`text-[10px] font-body ${config.accent} opacity-60`}>{matches.length}</span>
        </div>
        <div className="flex-1 h-px bg-border/60" />
      </div>

      <div className="space-y-6">
        {Object.entries(byLeague).map(([league, leagueMatches]) => (
          <div key={league}>
            <div className="flex items-center gap-2 mb-3 pl-1">
              <Trophy className="h-3 w-3 text-muted-foreground/40" />
              <span className="text-[10px] font-body font-semibold text-muted-foreground uppercase tracking-wider">{league}</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {leagueMatches.map((match, i) => (
                <motion.div key={match.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                  <MatchCard
                    match={match}
                    favouriteTeams={favTeams}
                    onToggleFavourite={onToggleFav}
                    onClick={() => onMatchClick(match)}
                  />
                </motion.div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </motion.section>
  );
}

export default function MatchScreen() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<StatusTab>("all");
  const [selectedLeague, setSelectedLeague] = useState<string | null>(null);
  const [favTeams, setFavTeams] = useState<Set<string>>(new Set());
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);

  useEffect(() => {
    Promise.all([
      matchService.getLiveMatches(),
      favouriteService.getFavourites(),
    ]).then(([matchData, favData]) => {
      setMatches(matchData);
      setFavTeams(new Set(favData));
      setLoading(false);
    });
  }, []);

  const toggleFav = async (teamName: string) => {
    const next = new Set(favTeams);
    if (next.has(teamName)) {
      next.delete(teamName);
      favouriteService.removeFavourite(teamName);
    } else {
      next.add(teamName);
      favouriteService.addFavourite(teamName);
    }
    setFavTeams(next);
  };

  const leagues = [...new Set(matches.map((m) => m.league))];
  let filtered = selectedLeague ? matches.filter((m) => m.league === selectedLeague) : matches;

  if (tab === "favourites") {
    filtered = filtered.filter((m) => favTeams.has(m.teamA.name) || favTeams.has(m.teamB.name));
  } else if (tab !== "all") {
    filtered = filtered.filter((m) => m.status === tab);
  }

  const live = filtered.filter((m) => m.status === "live");
  const upcoming = filtered.filter((m) => m.status === "upcoming");
  const finished = filtered.filter((m) => m.status === "finished");

  const tabs: { value: StatusTab; label: string; icon: any; count: number }[] = [
    { value: "all", label: "All", icon: Trophy, count: matches.length },
    { value: "live", label: "Live", icon: Zap, count: matches.filter((m) => m.status === "live").length },
    { value: "upcoming", label: "Upcoming", icon: Clock, count: matches.filter((m) => m.status === "upcoming").length },
    { value: "finished", label: "Finished", icon: CheckCircle2, count: matches.filter((m) => m.status === "finished").length },
    { value: "favourites", label: "Favs", icon: Star, count: matches.filter((m) => favTeams.has(m.teamA.name) || favTeams.has(m.teamB.name)).length },
  ];

  return (
    <div className="mx-auto max-w-7xl px-5 py-6">
      {/* Header */}
      <div className="mb-5">
        <h1 className="font-heading text-xl font-bold text-foreground">Matches</h1>
        <p className="text-xs text-muted-foreground font-body mt-1">Live scores, fixtures & results</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-3 mb-3 scrollbar-none">
        {tabs.map((t) => {
          const Icon = t.icon;
          const active = tab === t.value;
          const isLiveTab = t.value === "live";
          const isFavTab = t.value === "favourites";
          return (
            <button
              key={t.value}
              onClick={() => setTab(t.value)}
              className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[11px] font-body font-semibold transition-all whitespace-nowrap ${
                active
                  ? isFavTab
                    ? "bg-warning/15 text-warning border border-warning/25"
                    : isLiveTab
                      ? "gradient-live text-white shadow-sm"
                      : "gradient-primary text-primary-foreground shadow-sm"
                  : "bg-card border border-border/60 text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-3 w-3" />
              {t.label}
              {t.count > 0 && (
                <span className={`text-[9px] ${active ? "opacity-70" : "opacity-50"}`}>{t.count}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* League filter */}
      {leagues.length > 1 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-3 mb-1 scrollbar-none">
          <Filter className="h-3 w-3 text-muted-foreground/50 flex-shrink-0" />
          <button
            onClick={() => setSelectedLeague(null)}
            className={`rounded-full px-2.5 py-1 text-[10px] font-body font-medium transition-colors whitespace-nowrap ${
              !selectedLeague ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            All
          </button>
          {leagues.map((league) => (
            <button
              key={league}
              onClick={() => setSelectedLeague(selectedLeague === league ? null : league)}
              className={`rounded-full px-2.5 py-1 text-[10px] font-body font-medium transition-colors whitespace-nowrap ${
                selectedLeague === league ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {league}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <LoadingSpinner />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={tab === "favourites" ? <Heart className="h-12 w-12" /> : <Trophy className="h-12 w-12" />}
          title={tab === "favourites" ? "No favourite matches" : "No matches found"}
          description={tab === "favourites" ? "Star teams from any match to see them here" : "Check back later for updates"}
        />
      ) : tab === "favourites" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 mt-4">
          {filtered.map((match, i) => (
            <motion.div key={match.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
              <MatchCard match={match} favouriteTeams={favTeams} onToggleFavourite={toggleFav} onClick={() => setSelectedMatch(match)} />
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="mt-4">
          <MatchSection status="live" matches={live} favTeams={favTeams} onToggleFav={toggleFav} onMatchClick={setSelectedMatch} />
          <MatchSection status="upcoming" matches={upcoming} favTeams={favTeams} onToggleFav={toggleFav} onMatchClick={setSelectedMatch} />
          <MatchSection status="finished" matches={finished} favTeams={favTeams} onToggleFav={toggleFav} onMatchClick={setSelectedMatch} />
        </div>
      )}

      {selectedMatch && (
        <MatchDetailModal match={selectedMatch} onClose={() => setSelectedMatch(null)} />
      )}
    </div>
  );
}
