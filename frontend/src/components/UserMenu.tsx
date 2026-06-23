import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaRegUserCircle } from "react-icons/fa";
import { getStoredUser, logout, updateDisplayName } from "../lib/api";

export function UserMenu() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [nameInput, setNameInput] = useState(
    getStoredUser()?.display_name ?? "",
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleLogout() {
    logout();
    navigate("/");
  }

  function handleChangeRoom() {
    setOpen(false);
    navigate("/dashboard");
  }

  async function handleSaveName() {
    setError(null);
    const trimmed = nameInput.trim();
    if (!trimmed) {
      setError("Name cannot be empty");
      return;
    }
    try {
      setLoading(true);
      await updateDisplayName(trimmed);
      setEditing(false);
      setOpen(false);
    } catch (e: any) {
      setError(e?.response?.data?.detail ?? "Failed to update name");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center justify-center rounded-full p-1 text-slate-300 transition hover:bg-white/10 hover:text-white"
      >
        <FaRegUserCircle size={28} />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-white/10 bg-slate-900 p-2 shadow-glow z-50">
          {editing ? (
            <div className="p-2">
              <label className="block">
                <span className="mb-1 block text-xs text-slate-400">
                  New name
                </span>
                <input
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
                  autoFocus
                />
              </label>
              {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={handleSaveName}
                  disabled={loading}
                  className="flex-1 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-blue-500 disabled:opacity-60"
                >
                  {loading ? "Saving..." : "Save"}
                </button>
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="rounded-lg border border-white/10 px-3 py-2 text-sm text-slate-300 transition hover:bg-white/10"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="w-full rounded-xl px-3 py-2 text-left text-sm text-slate-200 transition hover:bg-white/10"
              >
                Change name
              </button>
              <button
                type="button"
                onClick={handleChangeRoom}
                className="w-full rounded-xl px-3 py-2 text-left text-sm text-slate-200 transition hover:bg-white/10"
              >
                Change room
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="w-full rounded-xl px-3 py-2 text-left text-sm text-red-300 transition hover:bg-white/10"
              >
                Log out
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
