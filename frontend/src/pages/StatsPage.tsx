import { useEffect, useState } from "react";
import { SectionTitle } from "../components/SectionTitle";
import { fetchStats } from "../lib/api";
import { getBettorTheme } from "../lib/bettorTheme";
import { getTeamFlag } from "../lib/teamFlags";
import { useRoom } from "../context/RoomContext";
import type { Stats } from "../types";
import { LoadingState } from "../components/LoadingState";

export function StatsPage() {
  const { room } = useRoom();
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    if (room) void fetchStats(room.id).then(setStats);
  }, [room]);

  if (!stats) return <LoadingState label="Loading stats..." />;

  const teamFlag = getTeamFlag(stats.mostSelectedTeam);
  const highestProfitTheme = getBettorTheme(stats.highestProfit.bettor);
  const biggestWinTheme = getBettorTheme(stats.biggestWin.bettor);

  return (
    <div className="space-y-6">
      <SectionTitle
        title="Statistics"
        subtitle="Performance trends and useful betting insights."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-white/10 bg-slate-800/80 p-5 shadow-glow">
          <p className="text-sm text-slate-400">Total bets</p>
          <p className="mt-2 text-3xl font-bold text-white">
            {stats.totalBets}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-800/80 p-5 shadow-glow">
          <p className="text-sm text-slate-400">Total matches</p>
          <p className="mt-2 text-3xl font-bold text-white">
            {stats.totalMatches}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-800/80 p-5 shadow-glow">
          <p className="text-sm text-slate-400">Most selected team</p>
          <div className="mt-2 flex items-center gap-2">
            {teamFlag && (
              <img
                alt=""
                src={teamFlag}
                className="h-6 w-9 rounded-sm object-cover ring-1 ring-white/10"
              />
            )}
            <p className="text-xl font-bold text-white">
              {stats.mostSelectedTeam || "—"}
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-amber-500/20 bg-slate-800/80 p-5 shadow-glow">
          <p className="text-sm text-slate-400">Longest win streak</p>
          <p className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-amber-300">
              {stats.longestWinStreak}
            </span>
            <span className="text-sm text-slate-400">games</span>
          </p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-slate-800/80 p-5 shadow-glow">
          <h3 className="text-lg font-semibold">Betting accuracy</h3>
          <p className="mt-1 text-sm text-slate-400">
            Overall pick success across all tracked matches.
          </p>
          <div className="mt-6 flex items-center justify-center">
            <div className="relative flex h-36 w-36 items-center justify-center">
              <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  fill="none"
                  stroke="rgba(255,255,255,0.08)"
                  strokeWidth="10"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  fill="none"
                  stroke="#34d399"
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={`${(stats.bettingAccuracy / 100) * 264} 264`}
                />
              </svg>
              <span className="absolute text-2xl font-bold text-emerald-300">
                {stats.bettingAccuracy}%
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-800/80 p-5 shadow-glow">
          <h3 className="text-lg font-semibold">Highlights</h3>
          <div className="mt-4 space-y-3">
            <div className="rounded-xl bg-white/5 p-4">
              <p className="text-sm text-slate-400">Highest profit</p>
              <div className="mt-1 flex items-center justify-between">
                <span className={`font-semibold ${highestProfitTheme.text}`}>
                  {stats.highestProfit.bettor || "—"}
                </span>
                <span className="text-xl font-bold text-emerald-300">
                  +{stats.highestProfit.value}
                </span>
              </div>
            </div>
            <div className="rounded-xl bg-white/5 p-4">
              <p className="text-sm text-slate-400">Biggest single win</p>
              <div className="mt-1 flex items-center justify-between">
                <span className={`font-semibold ${biggestWinTheme.text}`}>
                  {stats.biggestWin.bettor || "—"}
                </span>
                <span className="text-xl font-bold text-blue-300">
                  +{stats.biggestWin.value}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
