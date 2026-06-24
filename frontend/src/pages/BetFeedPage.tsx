import { useEffect, useMemo, useRef, useState } from "react";
import { fetchMatches, fetchBets, getStoredUser } from "../lib/api";
import { getTeamFlag } from "../lib/teamFlags";
import { BetPlacementModal } from "../components/BetPlacementModal";
import { useRoom } from "../context/RoomContext";
import type { Bet, Match } from "../types";
import { LoadingState } from "../components/LoadingState";

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export function BetFeedPage() {
  const [matches, setMatches] = useState<Match[] | null>(null);
  const [bets, setBets] = useState<Bet[]>([]);
  const [activeMatch, setActiveMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);

  const containerRef = useRef<HTMLDivElement>(null);
  const todayMarkerRef = useRef<HTMLDivElement>(null);

  const { room } = useRoom();

  const currentUser = getStoredUser();
  const currentUserName: string | null = currentUser?.display_name ?? null;

  async function loadData() {
    if (!room) return;

    try {
      setLoading(true);

      const [m, b] = await Promise.all([fetchMatches(), fetchBets(room.id)]);

      setMatches(m);
      setBets(b);
    } catch (error) {
      console.error("Failed to load bet feed data:", error);
      setMatches([]);
      setBets([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (room) {
      void loadData();
    }
  }, [room]);

  const sortedMatches = useMemo(
    () =>
      [...(matches ?? [])].sort(
        (a, b) =>
          new Date(a.start_time).getTime() - new Date(b.start_time).getTime(),
      ),
    [matches],
  );

  // Scroll to the match closest to now
  useEffect(() => {
    if (sortedMatches.length > 0 && todayMarkerRef.current) {
      todayMarkerRef.current.scrollIntoView({
        block: "center",
        behavior: "smooth",
      });
    }
  }, [sortedMatches.length]);

  const now = Date.now();

  let closestIndex = 0;
  let closestDiff = Infinity;

  sortedMatches.forEach((match, index) => {
    const diff = Math.abs(new Date(match.start_time).getTime() - now);

    if (diff < closestDiff) {
      closestDiff = diff;
      closestIndex = index;
    }
  });

  function betsForMatch(matchId: number) {
    return bets.filter((bet) => bet.match_id === matchId);
  }

  // IMPORTANT: Loading check comes AFTER all hooks
  if (loading || matches === null) {
    return <LoadingState label="Loading matches..." />;
  }

  return (
    <div className="space-y-4" ref={containerRef}>
      <div>
        <p className="text-sm uppercase tracking-[0.3em] text-slate-400">
          Place Bets
        </p>

        <h2 className="mt-1 text-2xl font-bold">Match Feed</h2>

        <p className="mt-1 text-sm text-slate-400">
          Scroll to browse all World Cup 2026 matches. Click a match to place a
          bet.
        </p>
      </div>

      <div className="max-h-[70vh] space-y-3 overflow-y-auto pr-1">
        {sortedMatches.map((match, index) => {
          const matchBets = betsForMatch(match.id);

          const myBet = matchBets.find((bet) => bet.bettor === currentUserName);

          const hasBets = matchBets.length > 0;

          const homeFlag = getTeamFlag(match.home_team);
          const awayFlag = getTeamFlag(match.away_team);

          return (
            <div
              key={match.id}
              ref={index === closestIndex ? todayMarkerRef : undefined}
            >
              <button
                type="button"
                onClick={() => setActiveMatch(match)}
                className="w-full rounded-2xl border border-white/10 bg-slate-800/70 p-4 text-left transition hover:bg-slate-800"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 text-base font-semibold">
                    <span className="inline-flex items-center gap-2">
                      {homeFlag && (
                        <img
                          src={homeFlag}
                          alt={`${match.home_team} flag`}
                          className="h-5 w-7 rounded-sm object-cover"
                        />
                      )}

                      {match.home_team}
                    </span>

                    <span className="text-slate-400">
                      {match.status === "finished"
                        ? `${match.home_score} : ${match.away_score}`
                        : "vs"}
                    </span>

                    <span className="inline-flex items-center gap-2">
                      {awayFlag && (
                        <img
                          src={awayFlag}
                          alt={`${match.away_team} flag`}
                          className="h-5 w-7 rounded-sm object-cover"
                        />
                      )}

                      {match.away_team}
                    </span>
                  </div>

                  <div className="text-right">
                    {hasBets ? (
                      <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-medium text-emerald-300">
                        {myBet ? `You: ${myBet.selected_team}` : "Bet placed"}
                      </span>
                    ) : (
                      <span className="rounded-full bg-slate-500/15 px-3 py-1 text-xs font-medium text-slate-300">
                        No bet yet
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
                  <span>{formatDateTime(match.start_time)}</span>

                  <span>{match.venue}</span>
                </div>

                {hasBets && (
                  <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-400">
                    {matchBets.map((bet) => (
                      <span key={bet.id}>
                        {bet.bettor} → {bet.selected_team} ({bet.amount})
                      </span>
                    ))}
                  </div>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {activeMatch && room && (
        <BetPlacementModal
          match={activeMatch}
          roomId={room.id}
          existingBets={betsForMatch(activeMatch.id)}
          currentUserName={currentUserName}
          onClose={() => setActiveMatch(null)}
          onPlaced={() => void loadData()}
        />
      )}
    </div>
  );
}
