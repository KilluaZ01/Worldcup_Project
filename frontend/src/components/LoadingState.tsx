export function LoadingState({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-white/10 bg-slate-800/70 py-16 text-slate-400">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-blue-400" />
      <p className="text-sm">{label}</p>
    </div>
  );
}
