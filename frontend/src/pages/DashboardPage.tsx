import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMyRooms, getStoredUser } from "../lib/api";
import { UserMenu } from "../components/UserMenu";

interface Room {
  id: number;
  code: string;
  occupants: number;
  capacity: number;
  locked: boolean;
  created_at: string;
}

export function DashboardPage() {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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

  function handleJoinRoom(roomCode: string) {
    navigate(`/room/${roomCode}`);
  }

  function handleCreateRoom() {
    navigate("/rooms-entry");
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
              {rooms.map((room) => (
                <div
                  key={room.id}
                  className="rounded-2xl border border-white/10 bg-slate-800/70 p-4 shadow-glow transition hover:border-white/20"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold">{room.code}</h3>
                        <span
                          className={`rounded-full px-2 py-1 text-xs ${
                            room.locked
                              ? "bg-red-500/15 text-red-300"
                              : "bg-emerald-500/15 text-emerald-300"
                          }`}
                        >
                          {room.locked ? "Full" : "Open"}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-slate-400">
                        {room.occupants} / {room.capacity} members
                      </p>
                    </div>
                    <button
                      onClick={() => handleJoinRoom(room.code)}
                      className="rounded-xl bg-blue-600 px-4 py-2 font-medium text-white transition hover:bg-blue-500"
                    >
                      Enter
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
