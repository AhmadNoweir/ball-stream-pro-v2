import type { Match } from "@/types";
import { motion } from "framer-motion";
import { Star } from "lucide-react";

interface MatchCardProps {
  match: Match;
  compact?: boolean;
  onClick?: () => void;
  favouriteTeams?: Set<string>;
  onToggleFavourite?: (teamName: string) => void;
}

function TeamCrest({ logo, shortName, size = "md" }: { logo: string; shortName: string; size?: "sm" | "md" }) {
  const dim = size === "sm" ? "h-7 w-7" : "h-9 w-9";
  const textSize = size === "sm" ? "text-[9px]" : "text-[10px]";

  if (logo && logo.startsWith("http")) {
    return <img src={logo} alt={shortName} className={`${dim} object-contain`} />;
  }
  return (
    <div className={`${dim} rounded-full bg-secondary flex items-center justify-center`}>
      <span className={`${textSize} font-heading font-bold text-muted-foreground`}>{shortName}</span>
    </div>
  );
}

function FavStar({ active, onClick }: { active: boolean; onClick: (e: React.MouseEvent) => void }) {
  return (
    <button onClick={onClick} className="p-0.5 rounded transition-colors">
      <Star className={`h-3 w-3 transition-colors ${
        active ? "fill-warning text-warning" : "text-border hover:text-warning"
      }`} />
    </button>
  );
}

export function MatchCard({ match, compact, onClick, favouriteTeams, onToggleFavourite }: MatchCardProps) {
  const isLive = match.status === "live";
  const isUpcoming = match.status === "upcoming";
  const teamAFav = favouriteTeams?.has(match.teamA.name) ?? false;
  const teamBFav = favouriteTeams?.has(match.teamB.name) ?? false;

  return (
    <motion.div
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.985 }}
      onClick={onClick}
      className={`relative rounded-2xl bg-card p-4 cursor-pointer transition-all duration-200 ${
        isLive
          ? "border border-live/40 glow-live"
          : "border border-transparent shadow-[0_1px_3px_0_rgb(0_0_0/0.04)] hover:shadow-md hover:border-border"
      }`}
    >
      {/* Top row */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] text-muted-foreground font-body font-medium truncate mr-2 uppercase tracking-wider">{match.league}</span>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {isLive && <span className="h-1.5 w-1.5 rounded-full bg-live animate-pulse" />}
          <span className={`text-[10px] font-body font-bold uppercase tracking-wide ${
            isLive ? "text-live" : isUpcoming ? "text-warning" : "text-muted-foreground"
          }`}>
            {isLive ? match.time : isUpcoming ? match.time : "FT"}
          </span>
        </div>
      </div>

      {/* Teams + Score */}
      <div className="flex items-center gap-2">
        {/* Team A */}
        <div className="flex-1 flex items-center gap-1.5 justify-end min-w-0">
          {onToggleFavourite && (
            <FavStar active={teamAFav} onClick={(e) => { e.stopPropagation(); onToggleFavourite(match.teamA.name); }} />
          )}
          <p className={`font-body font-semibold text-foreground truncate text-right ${compact ? "text-xs" : "text-[13px]"}`}>
            {compact ? match.teamA.shortName : match.teamA.name}
          </p>
          <TeamCrest logo={match.teamA.logo} shortName={match.teamA.shortName} size={compact ? "sm" : "md"} />
        </div>

        {/* Score */}
        <div className={`flex-shrink-0 rounded-xl px-3.5 py-1.5 min-w-[58px] text-center ${
          isLive ? "gradient-live" : "bg-secondary"
        }`}>
          <span className={`font-heading font-bold ${compact ? "text-xs" : "text-sm"} ${
            isLive ? "text-white" : "text-foreground"
          }`}>
            {match.score}
          </span>
        </div>

        {/* Team B */}
        <div className="flex-1 flex items-center gap-1.5 min-w-0">
          <TeamCrest logo={match.teamB.logo} shortName={match.teamB.shortName} size={compact ? "sm" : "md"} />
          <p className={`font-body font-semibold text-foreground truncate ${compact ? "text-xs" : "text-[13px]"}`}>
            {compact ? match.teamB.shortName : match.teamB.name}
          </p>
          {onToggleFavourite && (
            <FavStar active={teamBFav} onClick={(e) => { e.stopPropagation(); onToggleFavourite(match.teamB.name); }} />
          )}
        </div>
      </div>
    </motion.div>
  );
}
