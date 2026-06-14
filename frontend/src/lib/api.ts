import axios from "axios";
import {
  mockBets,
  mockLeaderboard,
  mockMatches,
  mockResults,
  mockStats,
} from "../data/mockData";
import type { Bet, LeaderboardEntry, Match, Result, Stats } from "../types";

const ROOM_STORAGE_KEY = "bet-tracker-room";
const apiBaseURL = import.meta.env.VITE_API_URL ?? "";

export const api = axios.create({
  baseURL: apiBaseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

function getStoredRoom(): { id: number; code: string } | null {
  try {
    const raw = localStorage.getItem(ROOM_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.id && parsed.code) return parsed;
    return null;
  } catch {
    // older format (string code)
    const raw = localStorage.getItem(ROOM_STORAGE_KEY);
    if (raw) return { id: 0, code: raw };
    return null;
  }
}

function setStoredRoom(room: { id: number; code: string } | null) {
  if (room === null) return localStorage.removeItem(ROOM_STORAGE_KEY);
  localStorage.setItem(ROOM_STORAGE_KEY, JSON.stringify(room));
}

export async function hostRoom(code: string, name?: string) {
  if (!apiBaseURL) {
    const fake = { id: Math.floor(Math.random() * 100000), code };
    setStoredRoom(fake);
    return fake;
  }
  const { data } = await api.post("/rooms/host", { code, name });
  setStoredRoom({ id: data.id, code: data.code });
  return data;
}

export async function joinRoom(code: string) {
  if (!apiBaseURL) {
    const fake = { id: Math.floor(Math.random() * 100000), code };
    setStoredRoom(fake);
    return fake;
  }
  const { data } = await api.post("/rooms/join", { code });
  setStoredRoom({ id: data.id, code: data.code });
  return data;
}

export function getRoom() {
  return getStoredRoom();
}

export async function fetchMatches(): Promise<Match[]> {
  const stored = getStoredRoom();
  if (!apiBaseURL) return mockMatches.filter((match) => match.status !== "completed");
  const params: Record<string, unknown> = {};
  if (stored?.id) params.room_id = stored.id;
  const { data } = await api.get<Match[]>("/matches", { params });
  return data;
}

export async function fetchBets(): Promise<Bet[]> {
  const stored = getStoredRoom();
  if (!apiBaseURL) return mockBets;
  const params: Record<string, unknown> = {};
  if (stored?.id) params.room_id = stored.id;
  const { data } = await api.get<Bet[]>("/bets", { params });
  return data;
}

export async function placeBet(payload: { match_id: number; selected_team: string; amount: number; bettor: string; }): Promise<Bet> {
  const stored = getStoredRoom();
  if (!apiBaseURL) {
    const fake: Bet = {
      id: Math.floor(Math.random() * 100000),
      match_id: payload.match_id,
      selected_team: payload.selected_team,
      amount: payload.amount,
      bettor: payload.bettor,
      created_at: new Date().toISOString(),
      room_id: stored?.id ?? 0,
    } as Bet;
    // Optionally push to mockBets so UI can read it when using mock data
    try {
      mockBets.unshift(fake);
    } catch {}
    return fake;
  }
  const body: any = { ...payload };
  if (stored?.id) body.room_id = stored.id;
  const { data } = await api.post<Bet>("/bets", body);
  return data;
}

export async function fetchBetHistory(): Promise<{ match: Match; result?: Result; bets: Bet[] }[]> {
  const stored = getStoredRoom();
  if (!apiBaseURL) {
    return mockMatches
      .filter((match) => match.status === "completed")
      .map((match) => ({
        match,
        result: mockResults.find((result) => result.match_id === match.id),
        bets: mockBets.filter((bet) => bet.match_id === match.id),
      }));
  }

  const params: Record<string, unknown> = {};
  if (stored?.id) params.room_id = stored.id;
  const [matchesResponse, betsResponse] = await Promise.all([
    api.get<Match[]>("/matches", { params }),
    api.get<Bet[]>("/bets/history", { params }),
  ]);
  return matchesResponse.data
    .filter((match) => match.status === "completed")
    .map((match) => ({
      match,
      bets: betsResponse.data.filter((bet) => bet.match_id === match.id),
    }));
}

export async function fetchLeaderboard(): Promise<Record<string, LeaderboardEntry>> {
  const stored = getStoredRoom();
  if (!apiBaseURL) return mockLeaderboard;
  const params: Record<string, unknown> = {};
  if (stored?.id) params.room_id = stored.id;
  const { data } = await api.get<Record<string, LeaderboardEntry>>("/leaderboard", { params });
  return data;
}

export async function fetchStats(): Promise<Stats> {
  const stored = getStoredRoom();
  if (!apiBaseURL) return mockStats;
  const params: Record<string, unknown> = {};
  if (stored?.id) params.room_id = stored.id;
  const { data } = await api.get<Stats>("/stats", { params });
  return data;
}
