import { useEffect, useState } from "react";
import { BetPanel } from "../components/BetPanel";
import { MatchCard } from "../components/MatchCard";
import { SectionTitle } from "../components/SectionTitle";
import { fetchMatches } from "../lib/api";
import type { Match } from "../types";

export function RoomDashboardPage() {
  const [matches, setMatches] = useState<Match[]>([]);

  useEffect(() => {
    void fetchMatches().then(setMatches);
  }, []);

  const upcomingMatches = matches
    .filter((match) => match.status === "scheduled")
    .sort(
      (first, second) =>
        new Date(first.start_time).getTime() -
        new Date(second.start_time).getTime(),
    );
  const featured = upcomingMatches[0];

  return (
    <div className="space-y-8">
      <div className="grid gap-6 lg:grid-cols-[1.35fr_0.95fr]">
        <div className="rounded-3xl border border-white/10 bg-slate-800/70 p-6 shadow-glow">
          <p className="text-sm uppercase tracking-[0.3em] text-slate-400">
            Live overview
          </p>
          <h2 className="mt-2 text-4xl font-bold">
            Track bets and predictions for every room.
          </h2>
          <p className="mt-3 max-w-2xl text-slate-300">
            Bet Tracker keeps upcoming matches, predictions, results, and the
            leaderboard in one private sports dashboard.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-white/5 p-4">
              <p className="text-sm text-slate-400">Upcoming</p>
              <p className="mt-1 text-2xl font-semibold">
                {matches.filter((match) => match.status === "scheduled").length}
              </p>
            </div>
            <div className="rounded-2xl bg-white/5 p-4">
              <p className="text-sm text-slate-400">Finished</p>
              <p className="mt-1 text-2xl font-semibold">
                {matches.filter((match) => match.status === "finished").length}
              </p>
            </div>
          </div>
        </div>

        {featured ? <BetPanel match={featured} /> : null}
      </div>

      <section>
        <SectionTitle
          title="All upcoming matches"
          subtitle="Scroll to browse every scheduled fixture."
        />
        <div className="max-h-[42rem] overflow-y-auto pr-1">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {upcomingMatches.map((match) => (
              <MatchCard key={match.id} match={match} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
