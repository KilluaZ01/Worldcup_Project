import { useEffect, useState } from "react";
import { fetchStandings, type GroupStanding } from "../lib/api";
import { getTeamFlag } from "../lib/teamFlags";
import { LoadingState } from "./LoadingState";

export function GroupStandingsTable() {
  const [standings, setStandings] = useState<Record<
    string,
    GroupStanding[]
  > | null>(null);
  const [activeGroup, setActiveGroup] = useState<string | null>(null);

  useEffect(() => {
    void fetchStandings().then((data) => {
      setStandings(data);
      const groups = Object.keys(data).sort();
      if (groups.length > 0) setActiveGroup(groups[0]);
    });
  }, []);

  if (!standings) return <LoadingState label="Loading group standings..." />;

  const groupNames = Object.keys(standings).sort();
  const rows = activeGroup ? standings[activeGroup] : [];

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-800/80 p-5 shadow-glow">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-semibold">Group Standings</h3>
        <div className="flex flex-wrap gap-1.5">
          {groupNames.map((group) => (
            <button
              key={group}
              onClick={() => setActiveGroup(group)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                activeGroup === group
                  ? "bg-blue-500 text-white"
                  : "bg-white/5 text-slate-300 hover:bg-white/10"
              }`}
            >
              {group.replace("Group ", "")}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wide text-slate-400">
              <th className="py-2 pr-2">Team</th>
              <th className="px-2 text-center">P</th>
              <th className="px-2 text-center">W</th>
              <th className="px-2 text-center">D</th>
              <th className="px-2 text-center">L</th>
              <th className="px-2 text-center">GD</th>
              <th className="px-2 text-center">Pts</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => {
              const flag = getTeamFlag(row.team);
              const qualifying = i < 2; // top 2 advance
              return (
                <tr
                  key={row.team}
                  className={`border-b border-white/5 ${qualifying ? "bg-emerald-500/5" : ""}`}
                >
                  <td className="flex items-center gap-2 py-2 pr-2">
                    {flag && (
                      <img
                        alt=""
                        src={flag}
                        className="h-4 w-6 rounded-sm object-cover ring-1 ring-white/10"
                      />
                    )}
                    <span className="font-medium">{row.team}</span>
                  </td>
                  <td className="px-2 text-center text-slate-300">
                    {row.played}
                  </td>
                  <td className="px-2 text-center text-emerald-300">
                    {row.won}
                  </td>
                  <td className="px-2 text-center text-slate-400">
                    {row.drawn}
                  </td>
                  <td className="px-2 text-center text-red-300">{row.lost}</td>
                  <td className="px-2 text-center text-slate-300">
                    {row.goal_diff > 0 ? `+${row.goal_diff}` : row.goal_diff}
                  </td>
                  <td className="px-2 text-center font-bold text-white">
                    {row.points}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-xs text-slate-500">
        Top 2 in each group advance to the knockout stage.
      </p>
    </div>
  );
}
