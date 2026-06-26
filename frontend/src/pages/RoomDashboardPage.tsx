import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useParams } from "react-router-dom";
import { MatchCard } from "../components/MatchCard";
import { SectionTitle } from "../components/SectionTitle";
import { fetchMatches } from "../lib/api";
import type { Match } from "../types";
import { FaArrowRight } from "react-icons/fa6";
import { GroupStandingsTable } from "../components/GroupStandingsTable";

export function RoomDashboardPage() {
  const { roomId = "" } = useParams<{ roomId: string }>();
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

  return (
    <div className="space-y-8">
      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        {/* Left Side (2/3 width) */}
        <div className="lg:col-span-2 rounded-3xl border border-white/10 bg-slate-800/70 p-6 shadow-glow">
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

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
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

          <Link
            to={`/room/${roomId}/bet-feed`}
            className="mt-6 inline-flex items-center justify-center gap-3 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-500"
          >
            Go to Bet Feed
            <FaArrowRight />
          </Link>
        </div>

        {/* Right Side (1/3 width) */}
        <div className="lg:col-span-1 rounded-3xl  bg-slate-800/70 shadow-glow">
          <GroupStandingsTable />
        </div>
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
