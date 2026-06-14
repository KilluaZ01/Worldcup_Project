import { useEffect, useState } from "react";
import { ProgressBar } from "../components/ProgressBar";
import { SectionTitle } from "../components/SectionTitle";
import { fetchLeaderboard } from "../lib/api";
import { getBettorTheme } from "../lib/bettorTheme";
import type { LeaderboardEntry } from "../types";

export function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<Record<
    string,
    LeaderboardEntry
  > | null>(null);

  useEffect(() => {
    void fetchLeaderboard().then(setLeaderboard);
  }, []);

  if (!leaderboard) return null;

  return (
    <div>
      <SectionTitle
        title="Leaderboard"
        subtitle="Compare wins, losses, win rate, and current balance."
      />
      <div className="grid gap-4 lg:grid-cols-2">
        {Object.entries(leaderboard).map(([bettor, entry]) => (
          <article
            key={bettor}
            className="rounded-2xl border border-white/10 bg-slate-800/80 p-5 shadow-glow"
          >
            <div className="flex items-center justify-between">
              <h3
                className={`text-xl font-semibold ${getBettorTheme(bettor).text}`}
              >
                {bettor}
              </h3>
              <span className="rounded-full bg-white/5 px-3 py-1 text-sm text-slate-300">
                {entry.winRate}% win rate
              </span>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-white/5 p-4">
                <p className="text-sm text-slate-400">Wins</p>
                <p className="mt-1 text-2xl font-semibold">{entry.wins}</p>
              </div>
              <div className="rounded-xl bg-white/5 p-4">
                <p className="text-sm text-slate-400">Losses</p>
                <p className="mt-1 text-2xl font-semibold">{entry.losses}</p>
              </div>
            </div>

            <div className="mt-4">
              <div className="mb-2 flex items-center justify-between text-sm text-slate-400">
                <span>Win rate</span>
                <span>{entry.winRate}%</span>
              </div>
              <ProgressBar
                value={entry.winRate}
                color={getBettorTheme(bettor).bar}
              />
            </div>

            <div className="mt-4 rounded-xl bg-white/5 p-4">
              <p className="text-sm text-slate-400">Profit</p>
              <p
                className={`mt-1 text-2xl font-semibold ${entry.profit >= 0 ? "text-emerald-300" : "text-red-300"}`}
              >
                {entry.profit >= 0 ? "+" : ""}
                {entry.profit}
              </p>
              <p className="mt-1 text-sm text-slate-400">
                Current balance ${entry.balance}
              </p>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
