import { useEffect, useState } from "react";
import { ProgressBar } from "../components/ProgressBar";
import { SectionTitle } from "../components/SectionTitle";
import { fetchLeaderboard } from "../lib/api";
import { getBettorTheme } from "../lib/bettorTheme";
import { useRoom } from "../context/RoomContext";
import type { LeaderboardEntry } from "../types";
import { LoadingState } from "../components/LoadingState";

export function LeaderboardPage() {
  const { room } = useRoom();
  const [leaderboard, setLeaderboard] = useState<Record<
    string,
    LeaderboardEntry
  > | null>(null);

  useEffect(() => {
    if (room) void fetchLeaderboard(room.id).then(setLeaderboard);
  }, [room]);

  if (!leaderboard) return <LoadingState label="Loading leaderboard..." />;

  const entries = Object.entries(leaderboard).sort(
    (a, b) => b[1].profit - a[1].profit,
  );

  if (entries.length === 0) {
    return (
      <div>
        <SectionTitle
          title="Leaderboard"
          subtitle="Compare wins, losses, win rate, and current balance."
        />
        <div className="rounded-2xl border border-white/10 bg-slate-800/70 py-12 text-center text-slate-400">
          No bets placed yet.
        </div>
      </div>
    );
  }

  const topProfit = entries[0][1].profit;

  return (
    <div>
      <SectionTitle
        title="Leaderboard"
        subtitle="Compare wins, losses, win rate, and current balance."
      />
      <div className="grid gap-4 lg:grid-cols-2">
        {entries.map(([bettor, entry], index) => {
          const theme = getBettorTheme(bettor);
          const isLeading = entry.profit === topProfit && entry.profit !== 0;
          const isPositive = entry.profit >= 0;

          return (
            <article
              key={bettor}
              className={`relative overflow-hidden rounded-2xl border p-5 shadow-glow ${
                isPositive
                  ? "border-emerald-500/20 bg-slate-800/80"
                  : "border-red-500/20 bg-slate-800/80"
              }`}
            >
              {isLeading && (
                <span className="absolute right-4 top-4 rounded-full bg-amber-500/15 px-3 py-1 text-xs font-medium text-amber-300">
                  Leading
                </span>
              )}

              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-sm font-semibold text-slate-300">
                  #{index + 1}
                </span>
                <div>
                  <h3 className={`text-xl font-semibold ${theme.text}`}>
                    {bettor}
                  </h3>
                  <p className="text-sm text-slate-400">
                    {entry.winRate}% win rate
                  </p>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-white/5 p-4">
                  <p className="text-sm text-slate-400">Wins</p>
                  <p className="mt-1 text-2xl font-semibold text-emerald-300">
                    {entry.wins}
                  </p>
                </div>
                <div className="rounded-xl bg-white/5 p-4">
                  <p className="text-sm text-slate-400">Losses</p>
                  <p className="mt-1 text-2xl font-semibold text-red-300">
                    {entry.losses}
                  </p>
                </div>
              </div>

              <div className="mt-4">
                <div className="mb-2 flex items-center justify-between text-sm text-slate-400">
                  <span>Win rate</span>
                  <span>{entry.winRate}%</span>
                </div>
                <ProgressBar value={entry.winRate} color={theme.bar} />
              </div>

              <div
                className={`mt-4 rounded-xl p-4 ${
                  isPositive ? "bg-emerald-500/10" : "bg-red-500/10"
                }`}
              >
                <p className="text-sm text-slate-400">Profit</p>
                <p
                  className={`mt-1 text-3xl font-bold ${isPositive ? "text-emerald-300" : "text-red-300"}`}
                >
                  {isPositive ? "+" : ""}
                  {entry.profit}
                </p>
                <p className="mt-1 text-sm text-slate-400">
                  Current balance {entry.balance}
                </p>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
