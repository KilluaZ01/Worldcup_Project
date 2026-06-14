import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMyRooms, logout, getStoredUser } from "../lib/api";

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

  useEffect(() => {
    (async () => {
      try {
        const data = await getMyRooms();
        setRooms(data || []);
      } catch (err: any) {
        setError(err?.message ?? "Failed to load rooms");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  function handleJoinRoom(roomCode: string) {
    navigate(`/room/${roomCode}`);
  }

  function handleCreateRoom() {
    navigate("/rooms-entry");
  }

  function handleLogout() {
    logout();
    navigate("/");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-6">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Bet Tracker</h1>
          <p className="text-sm text-slate-400 mt-1">
            Welcome, {user?.email || "User"}
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="px-4 py-2 rounded-lg bg-red-600/20 border border-red-500 text-red-400 hover:bg-red-600/30 transition-all"
        >
          Logout
        </button>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto">
        {/* Create New Room Button */}
        <div className="mb-8">
          <button
            onClick={handleCreateRoom}
            className="w-full px-6 py-4 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-semibold transition-all shadow-lg hover:shadow-blue-500/50"
          >
            + Create or Join Room
          </button>
        </div>

        {/* Rooms List */}
        <div>
          <h2 className="text-xl font-semibold text-white mb-4">Your Rooms</h2>

          {loading && (
            <div className="text-center text-slate-400 py-12">
              Loading rooms...
            </div>
          )}

          {error && (
            <div className="text-center text-red-400 py-12">
              <p>{error}</p>
              <button
                onClick={() => {
                  setLoading(true);
                  setError(null);
                  (async () => {
                    try {
                      const data = await getMyRooms();
                      setRooms(data || []);
                    } catch (err: any) {
                      setError(err?.message ?? "Failed to load rooms");
                    } finally {
                      setLoading(false);
                    }
                  })();
                }}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Retry
              </button>
            </div>
          )}

          {!loading && !error && rooms.length === 0 && (
            <div className="text-center text-slate-400 py-12 border border-slate-700 rounded-xl bg-slate-800/50">
              <p>No rooms yet</p>
              <p className="text-sm mt-2">
                Click "Create or Join Room" to get started!
              </p>
            </div>
          )}

          {!loading && !error && rooms.length > 0 && (
            <div className="grid gap-4">
              {rooms.map((room) => (
                <div
                  key={room.id}
                  className="p-4 rounded-xl bg-slate-800 border border-slate-700 hover:border-slate-600 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold text-white">
                          {room.code}
                        </h3>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          room.locked
                            ? "bg-red-500/20 text-red-300"
                            : "bg-green-500/20 text-green-300"
                        }`}>
                          {room.locked ? "Full" : "Open"}
                        </span>
                      </div>
                      <p className="text-sm text-slate-400 mt-1">
                        {room.occupants} / {room.capacity} members
                      </p>
                    </div>
                    <button
                      onClick={() => handleJoinRoom(room.code)}
                      className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-all"
                    >
                      Enter
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


