import React, { useState } from "react";
import { getTeamFlag } from "../lib/teamFlags";
import type { Match } from "../types";
import { placeBet } from "../lib/api";

const choices = ["Home", "Draw", "Away"];

export function BetPanel({ match }: { match: Match }) {
  const homeFlag = getTeamFlag(match.home_team);
  const awayFlag = getTeamFlag(match.away_team);

  const [selected, setSelected] = useState<string>("Home");
  const [amount, setAmount] = useState<number | "">("");
  const [bettor, setBettor] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handlePlaceBet = async () => {
    setError(null);
    setSuccess(null);
    if (!bettor.trim()) {
      setError("Enter your name before placing a bet");
      return;
    }
    const amt = typeof amount === "number" ? amount : Number(amount);
    if (!amt || amt <= 0) {
      setError("Enter a valid bet amount");
      return;
    }

    const selected_team = selected === "Home" ? match.home_team : selected === "Away" ? match.away_team : "Draw";

    try {
      setLoading(true);
      await placeBet({ match_id: match.id, selected_team, amount: amt, bettor });
      setSuccess("Bet placed successfully");
      setAmount("");
    } catch (e: any) {
      setError(e?.response?.data?.detail ?? "Failed to place bet");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-800/80 p-5 shadow-glow">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-slate-400">Betting interface</p>
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
            </span>
          </h3>
        </div>
        <span className="rounded-full bg-blue-500/15 px-3 py-1 text-xs font-medium text-blue-300">
          Open
        </span>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {choices.map((choice) => (
          <button
            key={choice}
            onClick={() => setSelected(choice)}
            className={`rounded-xl border px-4 py-3 text-left transition ${selected === choice ? 'border-blue-400 bg-white/10' : 'border-white/10 bg-white/5'} hover:bg-white/10`}
            type="button"
          >
            <span className="block text-sm text-slate-400">{choice}</span>
            <span className="mt-1 block text-base font-semibold">
              {choice === "Home"
                ? match.home_team
                : choice === "Away"
                ? match.away_team
                : "No winner"}
            </span>
          </button>
        ))}
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-[1fr_160px]">
        <label className="block">
          <span className="mb-2 block text-sm text-slate-400">Your name</span>
          <input
            value={bettor}
            onChange={(e) => setBettor(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none ring-0 placeholder:text-slate-500 focus:border-blue-500"
            placeholder="Enter your name"
            type="text"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm text-slate-400">Bet amount</span>
          <input
            value={amount as any}
            onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
            className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none ring-0 placeholder:text-slate-500 focus:border-blue-500"
            placeholder="Enter amount"
            type="number"
          />
        </label>

        <div className="flex items-end sm:col-span-2">
          <button
            onClick={handlePlaceBet}
            disabled={loading}
            className="w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-500 disabled:opacity-60"
            type="button"
          >
            {loading ? 'Placing...' : 'Place bet'}
          </button>
        </div>
      </div>

      {error ? <p className="mt-4 text-sm text-red-400">{error}</p> : null}
      {success ? <p className="mt-4 text-sm text-green-400">{success}</p> : null}

      <p className="mt-4 text-sm text-slate-400">
        Bettors are color-coded automatically so each participant is easy to
        track.
      </p>
    </section>
  );
}
