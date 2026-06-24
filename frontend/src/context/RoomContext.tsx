import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useParams } from "react-router-dom";
import { getRoomByCode } from "../lib/api";
import type { Room } from "../types";

interface RoomContextValue {
  room: Room | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const RoomContext = createContext<RoomContextValue | undefined>(undefined);

export function RoomProvider({ children }: { children: ReactNode }) {
  const { roomId = "" } = useParams<{ roomId: string }>();
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    if (!roomId) return;
    try {
      setLoading(true);
      setError(null);
      const data = await getRoomByCode(roomId);
      setRoom(data);
    } catch (e: any) {
      setError(e?.response?.data?.detail ?? "Room not found");
      setRoom(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // re-resolve whenever the URL's room code changes
  }, [roomId]);

  return (
    <RoomContext.Provider value={{ room, loading, error, refetch: load }}>
      {children}
    </RoomContext.Provider>
  );
}

export function useRoom(): RoomContextValue {
  const ctx = useContext(RoomContext);
  if (!ctx) throw new Error("useRoom must be used within a RoomProvider");
  return ctx;
}
