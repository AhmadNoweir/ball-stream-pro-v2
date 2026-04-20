import { Router } from "express";
import prisma from "./prisma";
import { requireAuth } from "./middleware";

const router = Router();

const API_BASE = "https://api.football-data.org/v4";

export type MatchSummary = {
  id: string;
  teamA: { name: string; shortName: string; logo: string };
  teamB: { name: string; shortName: string; logo: string };
  score: string;
  status: "live" | "upcoming" | "finished";
  time: string;
  league: string;
};

// Simple in-memory caches with TTLs
const cache: { list?: { data: any; at: number }; details: Map<string, { data: any; at: number }>; teams: Map<string, { data: any; at: number }>; h2h: Map<string, { data: any; at: number }> } = {
  details: new Map(), teams: new Map(), h2h: new Map(),
};
const TTL = { list: 5 * 60_000, detail: 10 * 60_000, team: 60 * 60_000, h2h: 10 * 60_000 };

function getCached(map: Map<string, { data: any; at: number }>, key: string, ttl: number) {
  const e = map.get(key);
  return e && Date.now() - e.at < ttl ? e.data : null;
}

async function apiFetch(path: string, apiKey: string) {
  try {
    const res = await fetch(`${API_BASE}${path}`, { headers: { "X-Auth-Token": apiKey } });
    return res.ok ? res.json() : null;
  } catch { return null; }
}

// --- Transform helpers ---

function mapStatus(s: string): "live" | "upcoming" | "finished" {
  if (["IN_PLAY", "PAUSED", "HALFTIME"].includes(s)) return "live";
  if (["TIMED", "SCHEDULED"].includes(s)) return "upcoming";
  return "finished";
}

function mapTime(m: any): string {
  if (["IN_PLAY", "PAUSED", "HALFTIME"].includes(m.status)) return m.minute ? `${m.minute}'` : "LIVE";
  if (["TIMED", "SCHEDULED"].includes(m.status)) return new Date(m.utcDate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return "FT";
}

function transformMatch(m: any): MatchSummary {
  return {
    id: String(m.id),
    teamA: { name: m.homeTeam.name, shortName: m.homeTeam.tla || m.homeTeam.name.slice(0, 3).toUpperCase(), logo: m.homeTeam.crest || "" },
    teamB: { name: m.awayTeam.name, shortName: m.awayTeam.tla || m.awayTeam.name.slice(0, 3).toUpperCase(), logo: m.awayTeam.crest || "" },
    score: m.score.fullTime.home != null ? `${m.score.fullTime.home} - ${m.score.fullTime.away}` : "0 - 0",
    status: mapStatus(m.status),
    time: mapTime(m),
    league: m.competition.name,
  };
}

// --- Data fetchers with caching ---

export async function fetchMatches(): Promise<MatchSummary[]> {
  if (cache.list && Date.now() - cache.list.at < TTL.list) return cache.list.data;

  const apiKey = process.env.FOOTBALL_API_KEY;
  if (!apiKey || apiKey === "your-football-data-api-key") return [];

  try {
    const today = new Date();
    const from = new Date(today); from.setDate(today.getDate() - 3);
    const to = new Date(today); to.setDate(today.getDate() + 7);
    const dateFrom = from.toISOString().split("T")[0];
    const dateTo = to.toISOString().split("T")[0];

    const res = await fetch(`${API_BASE}/matches?dateFrom=${dateFrom}&dateTo=${dateTo}`, { headers: { "X-Auth-Token": apiKey } });
    if (!res.ok) return cache.list?.data || [];

    const data = await res.json();
    const matches = (data.matches || []).map(transformMatch);
    matches.sort((a: any, b: any) => ({ live: 0, upcoming: 1, finished: 2 })[a.status] - ({ live: 0, upcoming: 1, finished: 2 })[b.status]);

    cache.list = { data: matches, at: Date.now() };
    return matches;
  } catch {
    return cache.list?.data || [];
  }
}

async function fetchTeamInfo(teamId: string, apiKey: string) {
  const cached = getCached(cache.teams, teamId, TTL.team);
  if (cached) return cached;

  const d = await apiFetch(`/teams/${teamId}`, apiKey);
  if (!d) return null;

  const result = {
    id: d.id, name: d.name, shortName: d.shortName, crest: d.crest,
    venue: d.venue || null, founded: d.founded || null, clubColors: d.clubColors || null, website: d.website || null,
    coach: d.coach ? { name: d.coach.name, nationality: d.coach.nationality } : null,
    squad: (d.squad || []).map((p: any) => ({ name: p.name, position: p.position || "Unknown", nationality: p.nationality || "" })),
  };
  cache.teams.set(teamId, { data: result, at: Date.now() });
  return result;
}

async function fetchH2H(matchId: string, homeTeamId: string, awayTeamId: string, apiKey: string) {
  const cached = getCached(cache.h2h, matchId, TTL.h2h);
  if (cached) return cached;

  const d = await apiFetch(`/matches/${matchId}/head2head?limit=10`, apiKey);
  if (!d) return null;

  const matches = d.matches || [];
  let homeWins = 0, awayWins = 0, draws = 0, totalGoals = 0;

  for (const m of matches) {
    const hScore = m.score?.fullTime?.home ?? 0;
    const aScore = m.score?.fullTime?.away ?? 0;
    totalGoals += hScore + aScore;

    if (hScore === aScore) { draws++; }
    else {
      const winnerId = String(hScore > aScore ? m.homeTeam?.id : m.awayTeam?.id);
      if (winnerId === homeTeamId) homeWins++;
      else if (winnerId === awayTeamId) awayWins++;
    }
  }

  const result = {
    totalMatches: matches.length, totalGoals, homeWins, awayWins, draws,
    recentMatches: matches.slice(0, 5).map((m: any) => ({
      date: m.utcDate, homeTeam: m.homeTeam?.name || "", awayTeam: m.awayTeam?.name || "",
      score: m.score?.fullTime ? `${m.score.fullTime.home} - ${m.score.fullTime.away}` : "- - -",
      winner: m.score?.winner || null, competition: m.competition?.name || "",
    })),
  };
  cache.h2h.set(matchId, { data: result, at: Date.now() });
  return result;
}

// --- Routes ---

// GET /api/matches/live
router.get("/live", async (_req, res) => {
  res.json(await fetchMatches());
});

// GET /api/matches/:id/details — rich info, fetched on demand when user clicks a match
router.get("/:id/details", async (req, res) => {
  const matchId = req.params.id;
  const cached = getCached(cache.details, matchId, TTL.detail);
  if (cached) return res.json(cached);

  const apiKey = process.env.FOOTBALL_API_KEY;
  const fallback = { details: null, headToHead: null, homeTeamInfo: null, awayTeamInfo: null };

  if (!apiKey || apiKey === "your-football-data-api-key") {
    const basic = (await fetchMatches()).find((m: any) => m.id === matchId);
    return res.json(basic ? { ...basic, ...fallback } : { error: "Match not found" });
  }

  const m = await apiFetch(`/matches/${matchId}`, apiKey);
  if (!m) {
    const basic = (await fetchMatches()).find((x: any) => x.id === matchId);
    return res.json(basic ? { ...basic, ...fallback } : { error: "Match not found" });
  }

  const homeId = String(m.homeTeam?.id || "");
  const awayId = String(m.awayTeam?.id || "");

  const [h2h, homeInfo, awayInfo] = await Promise.all([
    fetchH2H(matchId, homeId, awayId, apiKey),
    homeId ? fetchTeamInfo(homeId, apiKey) : null,
    awayId ? fetchTeamInfo(awayId, apiKey) : null,
  ]);

  const detail = {
    ...transformMatch(m),
    details: {
      date: m.utcDate,
      venue: m.venue || homeInfo?.venue || null,
      matchday: m.matchday || null,
      stage: m.stage || null,
      group: m.group || null,
      winner: m.score?.winner || null,
      halfTime: m.score?.halfTime?.home != null ? `${m.score.halfTime.home} - ${m.score.halfTime.away}` : null,
      fullTime: m.score?.fullTime?.home != null ? `${m.score.fullTime.home} - ${m.score.fullTime.away}` : null,
      referees: (m.referees || []).map((r: any) => ({ name: r.name, role: (r.type || "REFEREE").replace(/_/g, " "), nationality: r.nationality || "" })),
    },
    headToHead: h2h,
    homeTeamInfo: homeInfo,
    awayTeamInfo: awayInfo,
  };

  cache.details.set(matchId, { data: detail, at: Date.now() });
  res.json(detail);
});

// GET /api/matches/:id/comments
router.get("/:id/comments", async (req, res) => {
  const comments = await prisma.matchComment.findMany({
    where: { matchId: req.params.id },
    orderBy: { timestamp: "desc" },
    include: { user: { select: { id: true, username: true, avatar: true } } },
  });

  res.json(comments.map((c) => ({
    id: c.id, matchId: c.matchId, content: c.content,
    timestamp: c.timestamp.toISOString(), user: c.user,
  })));
});

// POST /api/matches/:id/comments
router.post("/:id/comments", requireAuth, async (req, res) => {
  const { content } = req.body;
  if (!content || typeof content !== "string" || !content.trim()) {
    return res.status(400).json({ error: "Content is required" });
  }

  const matchId = String(req.params.id);
  const comment = await prisma.matchComment.create({
    data: { matchId, userId: req.userId!, content: content.trim() },
  });
  const user = await prisma.user.findUnique({
    where: { id: req.userId! },
    select: { id: true, username: true, avatar: true },
  });

  res.json({
    id: comment.id, matchId: comment.matchId, content: comment.content,
    timestamp: comment.timestamp.toISOString(), user,
  });
});

export default router;
