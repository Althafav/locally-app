"use client";

import { useState } from "react";
import { Bell, BellRing } from "lucide-react";
import { Loader } from "@/components/Loader";
import { api } from "@/lib/client";
import { t } from "@/lib/i18n";

/**
 * "Notify me" — records launch demand. With `serviceId` it's for one service,
 * without it's "anything in this local body".
 */
export function NotifyButton({
  serviceId, localBodyId, initial = false, label = t.home.notifyMe, doneLabel = t.home.notified, size = "sm",
}: {
  serviceId?: string;
  localBodyId: string;
  initial?: boolean;
  label?: string;
  doneLabel?: string;
  size?: "sm" | "lg";
}) {
  const [done, setDone] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  async function notify() {
    setBusy(true);
    setError(false);
    setDone(true); // optimistic
    try {
      const url = serviceId ? `/api/services/${serviceId}/interest` : `/api/locations/local-bodies/${localBodyId}/interest`;
      await api(url, { method: "POST", json: serviceId ? { localBodyId } : {} });
    } catch {
      setDone(false);
      setError(true);
    } finally {
      setBusy(false);
    }
  }

  const base = size === "lg" ? "btn w-full" : "inline-flex min-h-[40px] items-center gap-1.5 rounded-full px-3.5 text-[13px] font-bold transition";
  if (done) {
    return (
      <span className={`${base} cursor-default text-accent-dark ${size === "lg" ? "bg-accent-tint ring-1 ring-accent/20" : ""}`} role="status">
        <BellRing className="h-4 w-4" /> {doneLabel}
      </span>
    );
  }
  return (
    <button
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); notify(); }}
      disabled={busy}
      className={`${base} ${size === "lg" ? "border-2 border-accent bg-white text-accent hover:bg-accent-tint" : "bg-white text-accent shadow-card hover:bg-accent-tint"} ${error ? "!border-red-400" : ""}`}
    >
      {busy ? <Loader className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
      {error ? "Try again" : label}
    </button>
  );
}
