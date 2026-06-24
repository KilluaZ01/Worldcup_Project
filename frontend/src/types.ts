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

export interface StoredUser {
  id: number;
  email: string;
  display_name?: string | null;
  created_at: string;
}

export interface Participant {
  id: number;
  user_id?: number | null;
  name: string;
  active: boolean;
  joined_at: string;
}

export interface Room {
  id: number;
  code: string;
  name?: string | null;
  capacity: number;
  occupants: number;
  locked: boolean;
  created_at: string;
  is_host?: boolean | null;
  participants?: Participant[] | null;
}

export interface BetHistoryItem extends Bet {
  won?: boolean | null;
}

export async function fetchBetHistory(roomId: number): Promise
  { match: Match; result?: Result; bets: BetHistoryItem[] }[]
> {
  if (!apiBaseURL) {
    return mockMatches
      .filter((match) => match.status === "finished")
      .map((match) => ({
        match,
        result: mockResults.find((result) => result.match_id === match.id),
        bets: mockBets.filter((bet) => bet.match_id === match.id),
      }));
  }

  const [matchesResponse, betsResponse] = await Promise.all([
    api.get<Match[]>("/matches"),
    api.get<BetHistoryItem[]>("/bets/history", { params: { room_id: roomId } }),
  ]);
  return matchesResponse.data
    .filter((match) => match.status === "finished")
    .map((match) => ({
      match,
      bets: betsResponse.data.filter((bet) => bet.match_id === match.id),
    }));
}