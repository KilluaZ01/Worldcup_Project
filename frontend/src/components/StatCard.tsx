export function StatCard({
  label,
  value,
  accent,
  note,
}: {
  label: string
  value: string | number
  accent?: string
  note?: string
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-800/80 p-5 shadow-glow">
      <p className="text-sm text-slate-400">{label}</p>
      <p className={`mt-2 text-3xl font-semibold ${accent ?? 'text-white'}`}>{value}</p>
      {note ? <p className="mt-2 text-sm text-slate-500">{note}</p> : null}
    </div>
  )
}
