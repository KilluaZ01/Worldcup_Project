import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  hostRoom as apiHostRoom,
  joinRoom as apiJoinRoom,
  getRoom as apiGetRoom,
  getRoomByCode,
} from "../lib/api";

function generateRoomCode(): string {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

export function RoomEntryPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"host" | "join">("host");
  const [roomInput, setRoomInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const apiBase = import.meta.env.VITE_API_URL ?? "";
    const logged = apiBase ? !!localStorage.getItem("bet-tracker-token") : true;
    if (!logged) {
      navigate("/");
      return;
    }

    const stored = apiGetRoom();
    if (stored && stored.code) {
      if (apiBase) {
        (async () => {
          try {
            await getRoomByCode(stored.code);
            navigate(`/room/${stored.code}`, { replace: true });
          } catch (e) {
            localStorage.removeItem("bet-tracker-room");
          }
        })();
      } else {
        navigate(`/room/${stored.code}`, { replace: true });
      }
    }
  }, [navigate]);

  async function hostRoom() {
    setLoading(true);
    setError(null);
    try {
      const code = generateRoomCode();
      const room = await apiHostRoom(code);
      navigate(`/room/${room.code}`);
    } catch (err: any) {
      if (err?.response?.data?.detail) {
        setError(err.response.data.detail);
      } else {
        const apiBase = import.meta.env.VITE_API_URL ?? "";
        if (!apiBase) {
          const code = generateRoomCode();
          navigate(`/room/${code}`);
        } else {
          setError(
            "Unable to reach server — please try again or start the backend",
          );
        }
      }
    } finally {
      setLoading(false);
    }
  }

  async function joinRoom() {
    const roomId = roomInput.trim().toUpperCase();
    if (!roomId) {
      setError("Enter a room code");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const room = await apiJoinRoom(roomId);
      navigate(`/room/${room.code}`);
    } catch (err: any) {
      if (err?.response?.data?.detail) {
        setError(err.response.data.detail);
      } else {
        const apiBase = import.meta.env.VITE_API_URL ?? "";
        if (!apiBase) {
          navigate(`/room/${roomId}`);
        } else {
          setError(
            "Unable to reach server — please try again or start the backend",
          );
        }
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-slate-800/80 p-6 shadow-glow">
        <p className="text-sm uppercase tracking-[0.3em] text-slate-400">
          Bet Tracker
        </p>
        <h1 className="mt-2 text-3xl font-semibold">
          Host a room or join a room
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          Create a room code for your group or join with an existing one.
        </p>

        <div className="mt-6 flex rounded-2xl bg-white/5 p-1">
          <button
            type="button"
            onClick={() => setMode("host")}
            className={`w-1/2 rounded-xl px-4 py-2 text-sm ${mode === "host" ? "bg-blue-600 text-white" : "text-slate-300"}`}
          >
            Host room
          </button>
          <button
            type="button"
            onClick={() => setMode("join")}
            className={`w-1/2 rounded-xl px-4 py-2 text-sm ${mode === "join" ? "bg-blue-600 text-white" : "text-slate-300"}`}
          >
            Join room
          </button>
        </div>

        {mode === "host" ? (
          <div className="mt-6">
            <button
              type="button"
              onClick={hostRoom}
              disabled={loading}
              className="w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-500 disabled:opacity-60"
            >
              {loading ? "Creating..." : "Create room"}
            </button>
            {error ? (
              <p className="mt-3 text-sm text-red-400">{error}</p>
            ) : null}
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            <input
              value={roomInput}
              onChange={(event) => setRoomInput(event.target.value)}
              placeholder="Enter room code"
              className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-blue-500"
            />
            <button
              type="button"
              onClick={joinRoom}
              disabled={loading}
              className="w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-500 disabled:opacity-60"
            >
              {loading ? "Joining..." : "Join room"}
            </button>
            {error ? (
              <p className="mt-3 text-sm text-red-400">{error}</p>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
