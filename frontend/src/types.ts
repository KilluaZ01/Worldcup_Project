export type Bettor = string;
export type MatchStatus = "scheduled" | "finished";

export interface Match {
  id: number;
  home_team: string;
  away_team: string;
  competition: string;
  venue: string;
  start_time: string;
  status: MatchStatus;
  home_score?: number | null;
  away_score?: number | null;
  winner?: string | null;
}

export interface Bet {
  id: number;
  match_id: number;
  bettor: Bettor;
  selected_team: string;
  amount: number;
  created_at: string;
}

export interface Result {
  id: number;
  match_id: number;
  winning_team: string;
  processed: boolean;
  processed_at?: string | null;
}

export interface LeaderboardEntry {
  wins: number;
  losses: number;
  profit: number;
  winRate: number;
  balance: number;
}

export interface Stats {
  totalBets: number;
  totalMatches: number;
  mostSelectedTeam: string;
  longestWinStreak: number;
  highestProfit: { bettor: Bettor; value: number };
  bettingAccuracy: number;
  biggestWin: { bettor: Bettor; value: number };
}
