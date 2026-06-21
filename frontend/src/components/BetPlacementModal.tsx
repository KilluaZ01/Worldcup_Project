import { useState } from "react";
import { getTeamFlag } from "../lib/teamFlags";
import { placeBet } from "../lib/api";
import type { Bet, Match } from "../types";

interface BetPlacementModalProps {
  match: Match;
  roomId: number;
  existingBets: Bet[];
  currentUserName: string | null;
  onClose: () => void;
  onPlaced: () => void;
}

export function BetPlacementModal({
  match,
  roomId,
  existingBets,
  currentUserName,
  onClose,
  onPlaced,
}: BetPlacementModalProps) {
  const homeFlag = getTeamFlag(match.home_team);
  const awayFlag = getTeamFlag(match.away_team);

  const myExistingBet = existingBets.find((b) => b.bettor === currentUserName);
  const opponentExistingBet = existingBets.find(
    (b) => b.bettor !== currentUserName && b.match_id === match.id,
  );

  // If opponent already bet, I only get the remaining team, pre-selected
  const lockedToTeam = opponentExistingBet
    ? opponentExistingBet.selected_team === match.home_team
      ? match.away_team
      : match.home_team
    : null;

  const [selected, setSelected] = useState<string>(
    lockedToTeam ?? match.home_team,
  );
  const [amount, setAmount] = useState<number>(
    opponentExistingBet?.amount ?? 50,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const alreadyFullyBet = !!myExistingBet;

  async function handleConfirm() {
    setError(null);
    if (!amount || amount <= 0) {
      setError("Enter a valid amount");
      return;
    }
    try {
      setLoading(true);
      await placeBet({
        match_id: match.id,
        selected_team: selected,
        amount,
        room_id: roomId,
      });
      onPlaced();
      onClose();
    } catch (e: any) {
      setError(e?.response?.data?.detail ?? "Failed to place bet");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-glow">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-slate-400">{match.competition}</p>
            <h3 className="mt-1 text-lg font-semibold">
              {match.home_team} vs {match.away_team}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white"
            type="button"
          >
            ✕
          </button>
        </div>

        {alreadyFullyBet ? (
          <p className="mt-4 text-sm text-emerald-300">
            You already bet on {myExistingBet?.selected_team} for{" "}
            {myExistingBet?.amount}.
          </p>
        ) : (
          <>
            {lockedToTeam ? (
              <p className="mt-4 text-sm text-slate-300">
                Your opponent picked{" "}
                <span className="font-semibold">
                  {opponentExistingBet?.selected_team}
                </span>
                . You're automatically on:
              </p>
            ) : (
              <p className="mt-4 text-sm text-slate-300">Pick your team:</p>
            )}

            <div className="mt-3 grid grid-cols-2 gap-3">
              <button
                type="button"
                disabled={!!lockedToTeam && lockedToTeam !== match.home_team}
                onClick={() => !lockedToTeam && setSelected(match.home_team)}
                className={`flex items-center gap-2 rounded-xl border px-4 py-3 transition ${
                  selected === match.home_team
                    ? "border-blue-400 bg-white/10"
                    : "border-white/10 bg-white/5"
                } ${lockedToTeam && lockedToTeam !== match.home_team ? "opacity-40" : "hover:bg-white/10"}`}
              >
                {homeFlag && (
                  <img
                    alt=""
                    src={homeFlag}
                    className="h-5 w-7 rounded-sm object-cover"
                  />
                )}
                <span className="font-medium">{match.home_team}</span>
              </button>

              <button
                type="button"
                disabled={!!lockedToTeam && lockedToTeam !== match.away_team}
                onClick={() => !lockedToTeam && setSelected(match.away_team)}
                className={`flex items-center gap-2 rounded-xl border px-4 py-3 transition ${
                  selected === match.away_team
                    ? "border-blue-400 bg-white/10"
                    : "border-white/10 bg-white/5"
                } ${lockedToTeam && lockedToTeam !== match.away_team ? "opacity-40" : "hover:bg-white/10"}`}
              >
                {awayFlag && (
                  <img
                    alt=""
                    src={awayFlag}
                    className="h-5 w-7 rounded-sm object-cover"
                  />
                )}
                <span className="font-medium">{match.away_team}</span>
              </button>
            </div>

            <label className="mt-4 block">
              <span className="mb-2 block text-sm text-slate-400">
                Bet amount
              </span>
              <input
                type="number"
                value={amount}
                disabled={!!opponentExistingBet}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-blue-500 disabled:opacity-60"
              />
            </label>

            {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

            <button
              type="button"
              onClick={handleConfirm}
              disabled={loading}
              className="mt-5 w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-500 disabled:opacity-60"
            >
              {loading ? "Placing..." : "Confirm bet"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
