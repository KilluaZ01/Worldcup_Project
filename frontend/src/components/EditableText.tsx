import { useState, useRef, useEffect } from "react";

interface EditableTextProps {
  initialValue: string;
  onSave: (newValue: string) => Promise<void>;
  className?: string;
}

export function EditableText({
  initialValue,
  onSave,
  className,
}: EditableTextProps) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(initialValue);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  async function commit() {
    const trimmed = value.trim();
    if (!trimmed || trimmed === initialValue) {
      setValue(initialValue);
      setEditing(false);
      return;
    }
    try {
      setSaving(true);
      setError(null);
      await onSave(trimmed);
      setEditing(false);
    } catch (e: any) {
      setError(e?.response?.data?.detail ?? "Failed to save");
      setValue(initialValue);
    } finally {
      setSaving(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      void commit();
    } else if (e.key === "Escape") {
      setValue(initialValue);
      setEditing(false);
    }
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => void commit()}
        disabled={saving}
        className={`rounded-lg border border-blue-500 bg-slate-950 px-2 py-0.5 outline-none ${className ?? ""}`}
      />
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        onClick={(e) => {
          e.stopPropagation();
          setEditing(true);
        }}
        className={`cursor-pointer rounded-lg px-1 py-0.5 transition hover:bg-white/10 ${className ?? ""}`}
        title="Click to edit"
      >
        {value}
      </span>
      {error && <span className="text-xs text-red-400">{error}</span>}
    </span>
  );
}
