import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getMyRooms,
  getStoredUser,
  leaveRoomByCode,
  deleteRoom,
} from "../lib/api";
import { UserMenu } from "../components/UserMenu";
import { ConfirmActionModal } from "../components/ConfirmActionModal";
import { EditableText } from "../components/EditableText";
import { renameRoom } from "../lib/api";

import type { Room } from "../types";

type ModalState =
  | { type: "leave"; room: Room }
  | { type: "delete"; room: Room }
  | null;

export function DashboardPage() {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<ModalState>(null);
  const user = getStoredUser();

  async function loadRooms() {
    try {
      setLoading(true);
      setError(null);
      const data = await getMyRooms();
      setRooms(data || []);
    } catch (err: any) {
      setError(err?.message ?? "Failed to load rooms");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadRooms();
  }, []);

  function handleEnterRoom(roomCode: string) {
    navigate(`/room/${roomCode}`);
  }

  function handleCreateRoom() {
    navigate("/rooms-entry");
  }

  async function handleLeave(room: Room) {
    await leaveRoomByCode(room.code);
    await loadRooms();
  }

  async function handleDelete(room: Room) {
    await deleteRoom(room.id);
    await loadRooms();
  }

  return (
    <div className="min-h-screen text-slate-50">
      <header className="border-b border-white/10 bg-slate-950/60 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-slate-400">
              Private tracker
            </p>
            <h1 className="text-xl font-semibold">Bet Tracker</h1>
            <p className="mt-1 text-xs text-slate-400">
              Welcome, {user?.display_name ?? user?.email ?? "User"}
            </p>
          </div>
          <UserMenu />
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-8">
          <button
            onClick={handleCreateRoom}
            className="w-full rounded-2xl border border-white/10 bg-blue-600 px-6 py-4 font-semibold text-white shadow-glow transition hover:bg-blue-500"
          >
            + Create or Join Room
          </button>
        </div>

        <div>
          <h2 className="mb-4 text-xl font-semibold">Your Rooms</h2>

          {loading && (
            <div className="rounded-2xl border border-white/10 bg-slate-800/70 py-12 text-center text-slate-400">
              Loading rooms...
            </div>
          )}

          {error && (
            <div className="rounded-2xl border border-white/10 bg-slate-800/70 py-12 text-center text-red-400">
              <p>{error}</p>
              <button
                onClick={() => void loadRooms()}
                className="mt-4 rounded-xl bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-500"
              >
                Retry
              </button>
            </div>
          )}

          {!loading && !error && rooms.length === 0 && (
            <div className="rounded-2xl border border-white/10 bg-slate-800/70 py-12 text-center text-slate-400">
              <p>No rooms yet</p>
              <p className="mt-2 text-sm">
                Click "Create or Join Room" to get started!
              </p>
            </div>
          )}

          {!loading && !error && rooms.length > 0 && (
            <div className="grid gap-4">
              {rooms.map((room) => {
                const others = (room.participants ?? []).filter(
                  (p) => p.active,
                );
                return (
                  <div
                    key={room.id}
                    className="rounded-2xl border border-white/10 bg-slate-800/70 p-4 shadow-glow transition hover:border-white/20"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-semibold">
                            <EditableText
                              initialValue={room.name ?? room.code}
                              onSave={async (newName) => {
                                await renameRoom(room.id, newName);
                                await loadRooms();
                              }}
                            />
                          </h3>
                          <span
                            className={`rounded-full px-2 py-1 text-xs ${
                              room.locked
                                ? "bg-red-500/15 text-red-300"
                                : "bg-emerald-500/15 text-emerald-300"
                            }`}
                          >
                            {room.locked ? "Full" : "Open"}
                          </span>
                          {room.is_host && (
                            <span className="rounded-full bg-blue-500/15 px-2 py-1 text-xs text-blue-300">
                              Host
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-xs uppercase tracking-wider text-slate-500">
                          Code: {room.code}
                        </p>
                        <p className="mt-1 text-sm text-slate-400">
                          {room.occupants} / {room.capacity} members
                          {others.length > 0 && (
                            <span className="ml-1">
                              — {others.map((p) => p.name).join(", ")}
                            </span>
                          )}
                        </p>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <button
                          onClick={() => handleEnterRoom(room.code)}
                          className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-500"
                        >
                          Enter
                        </button>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setModal({ type: "leave", room })}
                            className="rounded-xl border border-white/10 px-3 py-1.5 text-xs text-slate-300 transition hover:bg-white/10"
                          >
                            Leave
                          </button>
                          {room.is_host && (
                            <button
                              onClick={() => setModal({ type: "delete", room })}
                              className="rounded-xl border border-red-500/30 px-3 py-1.5 text-xs text-red-300 transition hover:bg-red-500/10"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {modal?.type === "leave" && (
        <ConfirmActionModal
          title={`Leave "${modal.room.name ?? modal.room.code}"?`}
          description="You can rejoin later using the room code. The room will stay active for other members."
          confirmLabel="Leave Room"
          onConfirm={() => handleLeave(modal.room)}
          onClose={() => setModal(null)}
        />
      )}

      {modal?.type === "delete" && (
        <ConfirmActionModal
          title={`Delete "${modal.room.name ?? modal.room.code}"?`}
          description="This permanently deletes the room, all participants, and all bets placed in it. This cannot be undone."
          confirmLabel="Delete Room"
          destructive
          onConfirm={() => handleDelete(modal.room)}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
