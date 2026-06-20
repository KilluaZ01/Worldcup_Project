import type { Match } from "../types";
import { getTeamFlag } from "../lib/teamFlags";

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export function MatchCard({ match }: { match: Match }) {
  const homeFlag = getTeamFlag(match.home_team);
  const awayFlag = getTeamFlag(match.away_team);
  const isFinished = match.status === "finished";

  return (
    <article className="rounded-2xl border border-white/10 bg-slate-800/80 p-5 shadow-glow">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-slate-400">{match.competition}</p>
          <h3 className="mt-1 flex flex-wrap items-center gap-2 text-lg font-semibold">
            <span className="inline-flex items-center gap-2">
              {homeFlag ? (
                <img
                  alt={match.home_team}
                  className="h-5 w-7 rounded-sm object-cover ring-1 ring-white/10"
                  src={homeFlag}
                />
              ) : null}
              {match.home_team}
              {isFinished && match.home_score != null ? (
                <span className="ml-1 font-bold text-slate-100">
                  {match.home_score}
                </span>
              ) : null}
            </span>
            <span className="text-slate-500">vs</span>
            <span className="inline-flex items-center gap-2">
              {awayFlag ? (
                <img
                  alt={match.away_team}
                  className="h-5 w-7 rounded-sm object-cover ring-1 ring-white/10"
                  src={awayFlag}
                />
              ) : null}
              {match.away_team}
              {isFinished && match.away_score != null ? (
                <span className="ml-1 font-bold text-slate-100">
                  {match.away_score}
                </span>
              ) : null}
            </span>
          </h3>
        </div>
        <span
          className={[
            "rounded-full px-3 py-1 text-xs font-medium uppercase tracking-wide",
            isFinished
              ? "bg-slate-500/15 text-slate-300"
              : "bg-blue-500/15 text-blue-300",
          ].join(" ")}
        >
          {match.status}
        </span>
      </div>

      <div className="mt-4 grid gap-2 text-sm text-slate-300">
        <div className="flex items-center justify-between">
          <span>Start</span>
          <span className="text-slate-100">
            {formatDateTime(match.start_time)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span>Venue</span>
          <span className="text-slate-100">{match.venue}</span>
        </div>
        {isFinished && match.winner ? (
          <div className="flex items-center justify-between">
            <span>Result</span>
            <span className="text-emerald-300 font-medium">
              {match.winner === "Draw" ? "Draw" : `${match.winner} won`}
            </span>
          </div>
        ) : null}
      </div>
    </article>
  );
}
