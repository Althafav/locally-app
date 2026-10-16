"use client";

import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { Loader } from "@/components/Loader";
import { FetchError } from "@/lib/client";
import { t } from "@/lib/i18n";

type Props = {
  value: number | null;
  /** shown when empty; also makes empty a valid value (saved as null) */
  placeholder?: string;
  label: string;
  disabled?: boolean;
  onSave: (value: number | null) => Promise<void>;
};

/** Rupee input that saves on blur / Enter and shows saving · saved · error inline. */
export function PriceInput({ value, placeholder, label, disabled, onSave }: Props) {
  const [text, setText] = useState(value?.toString() ?? "");
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => setText(value?.toString() ?? ""), [value]);

  useEffect(() => {
    if (state !== "saved") return;
    const id = setTimeout(() => setState("idle"), 1500);
    return () => clearTimeout(id);
  }, [state]);

  async function commit() {
    const trimmed = text.trim();
    const next = trimmed === "" ? null : Number(trimmed);
    if (next === value) return;
    if (next === null && placeholder === undefined) return setText(value?.toString() ?? "");
    if (next !== null && (!Number.isInteger(next) || next < 1)) {
      setState("error");
      setError(t.admin.wholeRupees);
      return;
    }
    setState("saving");
    setError(null);
    try {
      await onSave(next);
      setState("saved");
    } catch (e) {
      setState("error");
      setError(e instanceof FetchError ? e.message : t.admin.saveFailed);
    }
  }

  return (
    <div className="shrink-0">
      <div className="relative w-28">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint">₹</span>
        <input
          inputMode="numeric"
          aria-label={label}
          className={`field py-2 pl-7 pr-8 text-right tabular-nums ${state === "error" ? "border-red-600" : ""}`}
          value={text}
          placeholder={placeholder}
          disabled={disabled}
          onChange={(e) => setText(e.target.value.replace(/[^\d]/g, ""))}
          onBlur={commit}
          onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
        />
        <span className="absolute right-2.5 top-1/2 -translate-y-1/2" aria-live="polite">
          {state === "saving" && <Loader className="h-4 w-4 text-ink-faint" />}
          {state === "saved" && <Check className="h-4 w-4 text-leaf" aria-label={t.admin.saved} />}
        </span>
      </div>
      {error && <p className="mt-1 w-28 text-right text-xs text-red-700">{error}</p>}
    </div>
  );
}
