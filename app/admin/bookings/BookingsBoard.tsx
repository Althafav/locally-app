"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { CalendarDays, MapPin, Phone } from "lucide-react";
import { Loader } from "@/components/Loader";
import { BookingStatusBadge } from "@/components/BookingStatusBadge";
import { ServiceIcon } from "@/components/ServiceIcon";
import { api, FetchError } from "@/lib/client";
import { prettyDate, rupees, slotLabel } from "@/lib/format";
import { formatPhone } from "@/lib/phone";
import { t } from "@/lib/i18n";
import { BOOKING_STATUSES, NEXT_STATUSES, type AdminBookingDTO, type BookingStatus } from "@/lib/types";

type Props = {
  bookings: AdminBookingDTO[];
  counts: Partial<Record<BookingStatus, number>>;
  localBodies: { id: string; name: string }[];
  status: BookingStatus | null;
  localBodyId: string | null;
  limit: number;
};

export function BookingsBoard({ bookings, counts, localBodies, status, localBodyId, limit }: Props) {
  const router = useRouter();

  /** Filters live in the URL so they survive reloads and can be shared. */
  const href = (next: { status?: BookingStatus | null; lb?: string | null }) => {
    const q = new URLSearchParams();
    const s = next.status !== undefined ? next.status : status;
    const lb = next.lb !== undefined ? next.lb : localBodyId;
    if (s) q.set("status", s);
    if (lb) q.set("lb", lb);
    const qs = q.toString();
    return `/admin/bookings${qs ? `?${qs}` : ""}`;
  };

  const total = Object.values(counts).reduce((a, b) => a + (b ?? 0), 0);

  return (
    <main className="flex flex-1 flex-col px-4 pb-10">
      {/* Status chips stay pinned under the header so the filter is always a thumb away. */}
      <nav aria-label={t.admin.filterStatus} className="sticky top-14 z-20 -mx-4 bg-paper/95 backdrop-blur">
        <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 py-2.5">
          {[null, ...BOOKING_STATUSES].map((s) => {
            const active = s === status;
            const n = s ? counts[s] ?? 0 : total;
            return (
              <Link
                key={s ?? "all"}
                href={href({ status: s })}
                replace
                scroll={false}
                aria-current={active ? "page" : undefined}
                className={`chip min-h-[40px] shrink-0 gap-1.5 ${
                  active ? "border-accent bg-accent text-white" : s === "REQUESTED" && n > 0 ? "border-accent/40 bg-accent-tint text-accent-dark" : "border-transparent bg-white text-ink-soft shadow-card"
                }`}
              >
                {s ? t.bookings.status[s] : t.admin.allStatuses}
                <span className={`tabular-nums ${active ? "text-white/70" : "opacity-70"}`}>{n}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      <label className="mt-3 block">
        <span className="sr-only">{t.admin.locality}</span>
        <select className="field py-2.5" value={localBodyId ?? ""} onChange={(e) => router.replace(href({ lb: e.target.value || null }), { scroll: false })}>
          <option value="">{t.admin.allLocalities}</option>
          {localBodies.map((lb) => (
            <option key={lb.id} value={lb.id}>{lb.name}</option>
          ))}
        </select>
      </label>

      {bookings.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <span className="grid h-16 w-16 place-items-center rounded-full bg-accent-tint text-accent">
            <CalendarDays className="h-7 w-7 text-ink-faint" />
          </span>
          <p className="mt-4 font-semibold">{t.admin.noBookings}</p>
        </div>
      ) : (
        <>
          <p className="mb-2 mt-4 px-1 text-[13px] text-ink-soft">
            {t.admin.showing(bookings.length, limit)}
          </p>
          <ul className="space-y-2.5">
            {bookings.map((b) => (
              <BookingCard key={b.id} booking={b} />
            ))}
          </ul>
        </>
      )}
    </main>
  );
}

function BookingCard({ booking: b }: { booking: AdminBookingDTO }) {
  const router = useRouter();
  const [busy, setBusy] = useState<BookingStatus | null>(null);
  const [refreshing, startRefresh] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const customer = b.customerName ?? formatPhone(b.customerPhone);
  const next = NEXT_STATUSES[b.status];

  async function move(to: BookingStatus) {
    if (to === "CANCELLED" && !window.confirm(t.admin.confirmCancel(b.serviceName, customer))) return;
    setBusy(to);
    setError(null);
    try {
      await api(`/api/admin/bookings/${encodeURIComponent(b.id)}`, { method: "PATCH", json: { status: to } });
      // Re-render the list and the tab's "new" count; stay busy until it lands.
      startRefresh(() => {
        router.refresh();
        setBusy(null);
      });
    } catch (e) {
      setError(e instanceof FetchError ? e.message : t.admin.saveFailed);
      setBusy(null);
    }
  }

  return (
    <li className="card p-4">
      <div className="flex items-start gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-accent-tint text-accent">
          <ServiceIcon icon={b.categoryIcon} className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="font-semibold leading-snug">{b.serviceName}</p>
            <BookingStatusBadge status={b.status} />
          </div>
          <p className="mt-1 text-sm font-medium text-ink">
            {prettyDate(b.date)} · {slotLabel(b.slot)}
          </p>
          <a
            href={`tel:+${b.customerPhone}`}
            className="mt-1.5 flex items-center gap-1.5 text-sm text-ink-soft hover:text-ink"
            aria-label={t.admin.callCustomer(customer)}
          >
            <Phone className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">
              {b.customerName && <span className="font-semibold text-ink">{b.customerName} · </span>}
              {formatPhone(b.customerPhone)}
            </span>
          </a>
          <p className="mt-1 flex items-start gap-1.5 text-[13px] text-ink-soft">
            <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>{b.address}, {b.localBodyName}</span>
          </p>
          <div className="mt-2 flex items-baseline justify-between gap-2">
            <p className="text-sm font-bold">{rupees(b.price)}</p>
            <p className="text-xs text-ink-faint">
              {t.admin.bookedOn(new Date(b.createdAt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" }))}
            </p>
          </div>
        </div>
      </div>

      {next.length > 0 && (
        <div className="mt-3 flex gap-2 border-t border-line pt-3">
          {next.map((to) => {
            const cancel = to === "CANCELLED";
            return (
              <button
                key={to}
                onClick={() => move(to)}
                disabled={busy !== null || refreshing}
                className={cancel ? "btn-ghost min-h-[44px] px-3 text-sm text-red-700" : "btn-primary min-h-[44px] flex-1 px-3 text-sm"}
              >
                {busy === to && <Loader className="h-4 w-4" />}
                {t.admin.action[to as Exclude<BookingStatus, "REQUESTED">]}
              </button>
            );
          })}
        </div>
      )}
      {error && <p role="alert" className="mt-2 text-sm text-red-700">{error}</p>}
    </li>
  );
}
