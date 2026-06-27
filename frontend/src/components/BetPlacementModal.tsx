import { useState } from "react";
import { getTeamFlag } from "../lib/teamFlags";
import { placeBet, updateBetAmounts, deleteBet } from "../lib/api";
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
  const hasExistingPair = !!myExistingBet && !!opponentExistingBet;

  const kickoffPassed = new Date(match.start_time).getTime() <= Date.now();

  const [selected, setSelected] = useState<string>(
    myExistingBet?.selected_team ?? match.home_team,
  );
  const [myAmount, setMyAmount] = useState<number>(myExistingBet?.amount ?? 50);
  const [opponentAmount, setOpponentAmount] = useState<number>(
    opponentExistingBet?.amount ?? 50,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  async function handlePlace() {
    setError(null);
    if (!myAmount || myAmount <= 0 || !opponentAmount || opponentAmount <= 0) {
      setError("Both amounts must be greater than zero");
      return;
    }
    try {
      setLoading(true);
      await placeBet({
        match_id: match.id,
        selected_team: selected,
        my_amount: myAmount,
        opponent_amount: opponentAmount,
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

  async function handleUpdate() {
    setError(null);
    if (!myAmount || myAmount <= 0 || !opponentAmount || opponentAmount <= 0) {
      setError("Both amounts must be greater than zero");
      return;
    }
    try {
      setLoading(true);
      await updateBetAmounts(match.id, {
        room_id: roomId,
        my_amount: myAmount,
        opponent_amount: opponentAmount,
      });
      onPlaced();
      onClose();
    } catch (e: any) {
      setError(e?.response?.data?.detail ?? "Failed to update bet");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    setError(null);
    try {
      setLoading(true);
      await deleteBet(match.id, roomId);
      onPlaced();
      onClose();
    } catch (e: any) {
      setError(e?.response?.data?.detail ?? "Failed to delete bet");
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

        {kickoffPassed && hasExistingPair ? (
          <p className="mt-4 text-sm text-slate-300">
            {myExistingBet?.bettor} bet {myExistingBet?.amount} on{" "}
            {myExistingBet?.selected_team}. {opponentExistingBet?.bettor} bet{" "}
            {opponentExistingBet?.amount} on{" "}
            {opponentExistingBet?.selected_team}.
            <span className="mt-1 block text-xs text-slate-500">
              Locked — match has started.
            </span>
          </p>
        ) : (
          <>
            <p className="mt-4 text-sm text-slate-300">
              {hasExistingPair
                ? "Edit this bet:"
                : "Pick a team and set both amounts:"}
            </p>

            <div className="mt-3 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSelected(match.home_team)}
                className={`flex items-center gap-2 rounded-xl border px-4 py-3 transition ${
                  selected === match.home_team
                    ? "border-blue-400 bg-white/10"
                    : "border-white/10 bg-white/5 hover:bg-white/10"
                }`}
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
                onClick={() => setSelected(match.away_team)}
                className={`flex items-center gap-2 rounded-xl border px-4 py-3 transition ${
                  selected === match.away_team
                    ? "border-blue-400 bg-white/10"
                    : "border-white/10 bg-white/5 hover:bg-white/10"
                }`}
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

            <div className="mt-4 grid grid-cols-2 gap-3">
              <label className="block">
                <span className="mb-2 block text-sm text-slate-400">
                  Your amount
                </span>
                <input
                  type="number"
                  value={myAmount}
                  onChange={(e) => setMyAmount(Number(e.target.value))}
                  className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-blue-500"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm text-slate-400">
                  Opponent's amount
                </span>
                <input
                  type="number"
                  value={opponentAmount}
                  onChange={(e) => setOpponentAmount(Number(e.target.value))}
                  className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-blue-500"
                />
              </label>
            </div>

            {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

            <button
              type="button"
              onClick={hasExistingPair ? handleUpdate : handlePlace}
              disabled={loading}
              className="mt-5 w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-500 disabled:opacity-60"
            >
              {loading
                ? "Saving..."
                : hasExistingPair
                  ? "Save changes"
                  : "Place bet"}
            </button>

            {hasExistingPair && (
              <>
                {confirmingDelete ? (
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={handleDelete}
                      disabled={loading}
                      className="flex-1 rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-500 disabled:opacity-60"
                    >
                      Confirm delete
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmingDelete(false)}
                      className="flex-1 rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-300 transition hover:bg-white/10"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmingDelete(true)}
                    className="mt-3 w-full rounded-xl border border-red-500/30 px-4 py-2 text-sm text-red-300 transition hover:bg-red-500/10"
                  >
                    Delete bet
                  </button>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
