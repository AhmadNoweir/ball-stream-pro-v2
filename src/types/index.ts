export interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
}

export interface AuthResponse {
  success: boolean;
  user?: User;
  token?: string;
  error?: string;
}

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  timestamp: string;
}

export interface Match {
  id: string;
  teamA: TeamInfo;
  teamB: TeamInfo;
  score: string;
  status: "live" | "upcoming" | "finished";
  time: string;
  league: string;
}

export interface TeamInfo {
  name: string;
  logo: string;
  shortName: string;
}

export interface AIMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface MatchDetail extends Match {
  details: {
    date: string;
    venue: string | null;
    matchday: number | null;
    stage: string | null;
    group: string | null;
    winner: string | null;
    halfTime: string | null;
    fullTime: string | null;
    referees: { name: string; role: string; nationality: string }[];
  } | null;
  headToHead: {
    totalMatches: number;
    totalGoals: number;
    homeWins: number;
    awayWins: number;
    draws: number;
    recentMatches: { date: string; homeTeam: string; awayTeam: string; score: string; winner: string | null; competition: string }[];
  } | null;
  homeTeamInfo: TeamDetail | null;
  awayTeamInfo: TeamDetail | null;
}

export interface TeamDetail {
  id: number;
  name: string;
  shortName: string;
  crest: string;
  venue: string | null;
  founded: number | null;
  clubColors: string | null;
  website: string | null;
  coach: { name: string; nationality: string } | null;
  squad: { name: string; position: string; nationality: string }[];
}

export interface MatchComment {
  id: string;
  matchId: string;
  content: string;
  timestamp: string;
  user: { id: string; username: string; avatar?: string };
}

export interface ChatContact {
  id: string;
  username: string;
  avatar?: string;
  lastMessage?: string;
  online: boolean;
  unreadCount?: number;
}
