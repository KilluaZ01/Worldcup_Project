import { useState } from "react";

interface ConfirmActionModalProps {
  title: string;
  description: string;
  confirmLabel: string;
  destructive?: boolean;
  onConfirm: () => Promise<void>;
  onClose: () => void;
}

export function ConfirmActionModal({
  title,
  description,
  confirmLabel,
  destructive = false,
  onConfirm,
  onClose,
}: ConfirmActionModalProps) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canConfirm = input.trim().toUpperCase() === "CONFIRM";

  async function handleConfirm() {
    if (!canConfirm) return;
    setError(null);
    try {
      setLoading(true);
      await onConfirm();
      onClose();
    } catch (e: any) {
      setError(e?.response?.data?.detail ?? "Action failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-glow">
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="mt-2 text-sm text-slate-300">{description}</p>

        <label className="mt-4 block">
          <span className="mb-2 block text-sm text-slate-400">
            Type <span className="font-semibold text-slate-200">CONFIRM</span>{" "}
            to proceed
          </span>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            autoFocus
            className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-blue-500"
            placeholder="CONFIRM"
          />
        </label>

        {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

        <div className="mt-5 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-white/10 px-4 py-3 text-sm text-slate-300 transition hover:bg-white/10"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!canConfirm || loading}
            className={`flex-1 rounded-xl px-4 py-3 text-sm font-semibold text-white transition disabled:opacity-40 ${
              destructive
                ? "bg-red-600 hover:bg-red-500"
                : "bg-blue-600 hover:bg-blue-500"
            }`}
          >
            {loading ? "Processing..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
