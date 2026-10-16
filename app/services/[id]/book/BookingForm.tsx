"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin } from "lucide-react";
import { Loader } from "@/components/Loader";
import { api } from "@/lib/client";
import { addDays, BOOKING_DAYS_AHEAD, dayLabel, isSlotOpen, istToday, rupees, TIME_SLOTS } from "@/lib/format";
import { t } from "@/lib/i18n";

export function BookingForm({
  serviceId, price, localBodyName, initialAddress,
}: { serviceId: string; price: number; localBodyName: string; initialAddress: string }) {
  const router = useRouter();
  const days = useMemo(() => {
    const today = istToday();
    return Array.from({ length: BOOKING_DAYS_AHEAD }, (_, i) => addDays(today, i)).filter((d) =>
      TIME_SLOTS.some((s) => isSlotOpen(d, s.id))
    );
  }, []);
  const [date, setDate] = useState(days[0] ?? "");
  const [slot, setSlot] = useState<string | null>(null);
  const [address, setAddress] = useState(initialAddress);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!date || !slot) return setError(t.booking.pickSlot);
    if (address.trim().length < 5) return setError(t.booking.addressRequired);
    setBusy(true);
    setError(null);
    try {
      const { booking } = await api<{ booking: { id: string } }>("/api/bookings", {
        method: "POST",
        json: { serviceId, date, slot, address: address.trim() },
      });
      router.replace(`/bookings?new=${booking.id}`);
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-1 flex-col px-5 pb-32">
      <h2 className="label mt-2">{t.booking.date}</h2>
      <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5">
        {days.map((d) => {
          const on = d === date;
          const dt = new Date(`${d}T00:00:00Z`);
          return (
            <button
              type="button"
              key={d}
              onClick={() => { setDate(d); if (slot && !isSlotOpen(d, slot)) setSlot(null); }}
              className={`flex h-[72px] w-16 shrink-0 flex-col items-center justify-center rounded-2xl border transition ${on ? "border-accent bg-accent text-white shadow-cta" : "border-transparent bg-white shadow-card"}`}
              aria-pressed={on}
            >
              <span className={`text-[11px] font-semibold ${on ? "text-white/80" : "text-ink-soft"}`}>{dayLabel(d)}</span>
              <span className="text-xl font-extrabold">{dt.getUTCDate()}</span>
              <span className={`text-[10px] ${on ? "text-white/70" : "text-ink-faint"}`}>{dt.toLocaleDateString("en-IN", { month: "short", timeZone: "UTC" })}</span>
            </button>
          );
        })}
      </div>

      <h2 className="label mt-6">{t.booking.time}</h2>
      <div className="grid grid-cols-2 gap-2">
        {TIME_SLOTS.map((s) => {
          const open = date ? isSlotOpen(date, s.id) : false;
          const on = slot === s.id;
          return (
            <button
              type="button"
              key={s.id}
              disabled={!open}
              onClick={() => setSlot(s.id)}
              className={`chip ${on ? "border-accent bg-accent text-white shadow-cta" : "border-transparent bg-white shadow-card"} disabled:border-dashed disabled:border-line disabled:bg-transparent disabled:shadow-none disabled:text-ink-faint disabled:line-through`}
              aria-pressed={on}
            >
              {s.label}
            </button>
          );
        })}
      </div>

      <label htmlFor="address" className="label mt-6">{t.booking.address}</label>
      <textarea
        id="address"
        rows={3}
        className="field resize-none"
        placeholder={t.booking.addressHint}
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        maxLength={300}
      />
      <p className="mt-2 flex items-center gap-1.5 text-sm text-ink-soft">
        <MapPin className="h-4 w-4 text-accent" /> {localBodyName}
      </p>

      {error && <p className="mt-4 text-sm text-red-600" role="alert">{error}</p>}

      <div className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-[430px] bg-white px-5 pb-safe pt-3 shadow-bar">
        <button type="submit" className="btn-primary mb-3 w-full" disabled={busy}>
          {busy && <Loader className="h-5 w-5" />}
          {t.booking.confirm(rupees(price))}
        </button>
      </div>
    </form>
  );
}
