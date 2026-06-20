import type { Bet, LeaderboardEntry, Match, Result, Stats } from "../types";

export const mockMatches: Match[] = [
  {
    id: 3,
    home_team: "Spain",
    away_team: "Portugal",
    competition: "Friendly",
    venue: "Santiago Bernabéu",
    start_time: "2026-06-12T19:00:00Z",
    status: "finished",
    winner: "Spain",
  },
  {
    id: 4,
    home_team: "Japan",
    away_team: "Korea Republic",
    competition: "Asian Cup",
    venue: "National Stadium",
    start_time: "2026-06-13T17:00:00Z",
    status: "scheduled",
    winner: null,
  },
];

export const mockBets: Bet[] = [
  {
    id: 1,
    match_id: 1,
    bettor: "Player One",
    selected_team: "Argentina",
    amount: 20,
    created_at: "2026-06-13T10:00:00Z",
  },
  {
    id: 2,
    match_id: 1,
    bettor: "Player Two",
    selected_team: "Brazil",
    amount: 20,
    created_at: "2026-06-13T10:04:00Z",
  },
  {
    id: 3,
    match_id: 3,
    bettor: "Player One",
    selected_team: "Spain",
    amount: 15,
    created_at: "2026-06-12T12:00:00Z",
  },
  {
    id: 4,
    match_id: 3,
    bettor: "Player Two",
    selected_team: "Portugal",
    amount: 15,
    created_at: "2026-06-12T12:03:00Z",
  },
  {
    id: 5,
    match_id: 4,
    bettor: "Player One",
    selected_team: "Japan",
    amount: 10,
    created_at: "2026-06-13T15:10:00Z",
  },
];

export const mockResults: Result[] = [
  {
    id: 1,
    match_id: 3,
    winning_team: "Spain",
    processed: true,
    processed_at: "2026-06-12T22:00:00Z",
  },
];

export const mockLeaderboard: Record<string, LeaderboardEntry> = {
  "Player One": {
    wins: 10,
    losses: 5,
    profit: 25,
    winRate: 66.7,
    balance: 125,
  },
  "Player Two": {
    wins: 5,
    losses: 10,
    profit: -25,
    winRate: 33.3,
    balance: 75,
  },
};

export const mockStats: Stats = {
  totalBets: 28,
  totalMatches: 14,
  mostSelectedTeam: "Argentina",
  longestWinStreak: 4,
  highestProfit: { bettor: "Player One", value: 25 },
  bettingAccuracy: 61,
  biggestWin: { bettor: "Player One", value: 30 },
};
