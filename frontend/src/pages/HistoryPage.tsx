import { useEffect, useState } from "react";
import { SectionTitle } from "../components/SectionTitle";
import { fetchBetHistory } from "../lib/api";
import { getBettorTheme } from "../lib/bettorTheme";
import { getTeamFlag } from "../lib/teamFlags";
import { useRoom } from "../context/RoomContext";
import type { BetHistoryItem, Match, Result } from "../types";
import { LoadingState } from "../components/LoadingState";

type HistoryRow = {
  match: Match;
  result?: Result;
  bets: BetHistoryItem[];
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export function HistoryPage() {
  const { room } = useRoom();
  const [rows, setRows] = useState<HistoryRow[] | null>(null);

  useEffect(() => {
    if (room) void fetchBetHistory(room.id).then(setRows);
  }, [room]);

  if (rows === null) return <LoadingState label="Loading history..." />;

  const sortedRows = [...rows].sort(
    (a, b) =>
      new Date(b.match.start_time).getTime() -
      new Date(a.match.start_time).getTime(),
  );

  return (
    <div>
      <SectionTitle
        title="History"
        subtitle="Completed matches, winning teams, and bet outcomes."
      />
      <div className="space-y-4">
        {sortedRows.length === 0 && (
          <div className="rounded-2xl border border-white/10 bg-slate-800/70 py-12 text-center text-slate-400">
            No finished matches with bets yet.
          </div>
        )}

        {sortedRows.map(({ match, bets }) => {
          const homeFlag = getTeamFlag(match.home_team);
          const awayFlag = getTeamFlag(match.away_team);
          const isDraw = match.winner === "Draw";

          return (
            <article
              key={match.id}
              className="rounded-2xl border border-white/10 bg-slate-800/80 p-5 shadow-glow"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs text-slate-400">
                    {formatDate(match.start_time)} · {match.competition}
                  </p>
                  <h3 className="mt-1 flex items-center gap-3 text-lg font-semibold">
                    <span className="inline-flex items-center gap-2">
                      {homeFlag && (
                        <img
                          alt=""
                          src={homeFlag}
                          className="h-5 w-7 rounded-sm object-cover ring-1 ring-white/10"
                        />
                      )}
                      {match.home_team}
                    </span>
                    <span className="text-slate-300">
                      {match.home_score} : {match.away_score}
                    </span>
                    <span className="inline-flex items-center gap-2">
                      {awayFlag && (
                        <img
                          alt=""
                          src={awayFlag}
                          className="h-5 w-7 rounded-sm object-cover ring-1 ring-white/10"
                        />
                      )}
                      {match.away_team}
                    </span>
                  </h3>
                </div>
                <div
                  className={`rounded-full px-3 py-1 text-sm ${
                    isDraw
                      ? "bg-slate-500/15 text-slate-300"
                      : "bg-emerald-500/15 text-emerald-300"
                  }`}
                >
                  {isDraw ? "Draw" : `Winner: ${match.winner}`}
                </div>
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-2">
                {bets.map((bet) => (
                  <div
                    key={bet.id}
                    className={`rounded-xl border p-4 ${
                      bet.won
                        ? "border-emerald-500/30 bg-emerald-500/5"
                        : "border-red-500/20 bg-red-500/5"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <p
                        className={`text-sm font-medium ${getBettorTheme(bet.bettor).text}`}
                      >
                        {bet.bettor}
                      </p>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          bet.won
                            ? "bg-emerald-500/15 text-emerald-300"
                            : "bg-red-500/15 text-red-300"
                        }`}
                      >
                        {bet.won ? "Won" : "Lost"}
                      </span>
                    </div>
                    <p className="mt-1 text-white">{bet.selected_team}</p>
                    <p className="text-sm text-slate-400">${bet.amount}</p>
                  </div>
                ))}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
