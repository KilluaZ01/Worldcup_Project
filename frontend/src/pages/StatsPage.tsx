import { useEffect, useState } from "react";
import { ProgressBar } from "../components/ProgressBar";
import { SectionTitle } from "../components/SectionTitle";
import { StatCard } from "../components/StatCard";
import { fetchStats } from "../lib/api";
import { useRoom } from "../context/RoomContext";
import type { Stats } from "../types";

export function StatsPage() {
  const { room } = useRoom();
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    if (room) void fetchStats(room.id).then(setStats);
  }, [room]);

  if (!stats) return null;

  return (
    <div className="space-y-6">
      <SectionTitle
        title="Statistics"
        subtitle="Performance trends and useful betting insights."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total bets" value={stats.totalBets} />
        <StatCard label="Total matches" value={stats.totalMatches} />
        <StatCard label="Most selected team" value={stats.mostSelectedTeam} />
        <StatCard
          label="Longest win streak"
          value={`${stats.longestWinStreak} games`}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-slate-800/80 p-5 shadow-glow">
          <h3 className="text-lg font-semibold">Betting accuracy</h3>
          <p className="mt-1 text-sm text-slate-400">
            Overall pick success across all tracked matches.
          </p>
          <div className="mt-5">
            <ProgressBar value={stats.bettingAccuracy} color="bg-emerald-500" />
            <p className="mt-2 text-right text-sm text-slate-400">
              {stats.bettingAccuracy}%
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-800/80 p-5 shadow-glow">
          <h3 className="text-lg font-semibold">Highlights</h3>
          <div className="mt-4 space-y-3 text-sm">
            <div className="flex items-center justify-between rounded-xl bg-white/5 p-4">
              <span className="text-slate-400">Highest profit</span>
              <span className="font-semibold text-emerald-300">
                {stats.highestProfit.bettor} (+{stats.highestProfit.value})
              </span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-white/5 p-4">
              <span className="text-slate-400">Biggest win</span>
              <span className="font-semibold text-blue-300">
                {stats.biggestWin.bettor} (+{stats.biggestWin.value})
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
