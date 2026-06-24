import { NavLink, Outlet, useParams } from "react-router-dom";
import { FaRegCopy } from "react-icons/fa";
import { UserMenu } from "./UserMenu";
import { RoomProvider, useRoom } from "../context/RoomContext";

const links = [
  { to: "", label: "Dashboard" },
  { to: "/bet-feed", label: "Bets" },
  { to: "/history", label: "History" },
  { to: "/leaderboard", label: "Leaderboard" },
  { to: "/stats", label: "Statistics" },
];

function LayoutInner() {
  const { roomId = "" } = useParams<{ roomId: string }>();
  const { room, loading, error } = useRoom();
  const roomBase = `/room/${roomId}`;
  const home = `/dashboard`;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-slate-400">
        Loading room...
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 text-slate-400">
        <p>{error ?? "Room not found"}</p>
        <NavLink to="/dashboard" className="text-blue-400 hover:underline">
          Back to dashboard
        </NavLink>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-slate-50">
      <header className="border-b border-white/10 bg-slate-950/60 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="cursor-pointer">
            <NavLink to={home}>
              <p className="text-xs uppercase tracking-[0.35em] text-slate-400">
                Private tracker
              </p>
              <h1 className="text-xl font-semibold">
                {room.name ?? "Bet Tracker"}
              </h1>
            </NavLink>
            <p
              onClick={() =>
                navigator.clipboard.writeText(room.code.toUpperCase())
              }
              className="mt-1 text-xs text-slate-400 flex items-center gap-2 cursor-pointer"
            >
              <span>Room: {room.code.toUpperCase()}</span>
              <FaRegCopy />
            </p>
          </div>

          <div className="flex items-center gap-3">
            <nav className="flex gap-2 rounded-full bg-white/5 p-1">
              {links.map((link) => (
                <NavLink
                  key={link.to}
                  to={`${roomBase}${link.to}`}
                  end={link.to === ""}
                  className={({ isActive }) =>
                    [
                      "rounded-full px-4 py-2 text-sm transition",
                      isActive
                        ? "bg-blue-500 text-white shadow-glow"
                        : "text-slate-300 hover:bg-white/10 hover:text-white",
                    ].join(" ")
                  }
                >
                  {link.label}
                </NavLink>
              ))}
            </nav>
            <UserMenu />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
}

export function Layout() {
  return (
    <RoomProvider>
      <LayoutInner />
    </RoomProvider>
  );
}
