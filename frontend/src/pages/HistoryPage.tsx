import { useEffect, useState } from "react";
import { SectionTitle } from "../components/SectionTitle";
import { fetchBetHistory } from "../lib/api";
import { getBettorTheme } from "../lib/bettorTheme";
import { useRoom } from "../context/RoomContext";
import type { Bet, Match, Result } from "../types";

type HistoryRow = {
  match: Match;
  result?: Result;
  bets: Bet[];
};

export function HistoryPage() {
  const { room } = useRoom();
  const [rows, setRows] = useState<HistoryRow[]>([]);

  useEffect(() => {
    if (room) void fetchBetHistory(room.id).then(setRows);
  }, [room]);

  return (
    <div>
      <SectionTitle
        title="History"
        subtitle="Completed matches, winning teams, and bet outcomes."
      />
      <div className="space-y-4">
        {rows.map(({ match, result, bets }) => (
          <article
            key={match.id}
            className="rounded-2xl border border-white/10 bg-slate-800/80 p-5 shadow-glow"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold">
                  {match.home_team} vs {match.away_team}
                </h3>
                <p className="text-sm text-slate-400">{match.competition}</p>
              </div>
              <div className="rounded-full bg-emerald-500/15 px-3 py-1 text-sm text-emerald-300">
                Winner: {result?.winning_team ?? match.winner ?? "Pending"}
              </div>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-4">
              {bets.map((bet) => (
                <div key={bet.id} className="rounded-xl bg-white/5 p-4">
                  <p
                    className={`text-sm font-medium ${getBettorTheme(bet.bettor).text}`}
                  >
                    {bet.bettor}
                  </p>
                  <p className="mt-1 text-white">{bet.selected_team}</p>
                  <p className="text-sm text-slate-400">${bet.amount}</p>
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
