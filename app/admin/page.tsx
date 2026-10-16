import Link from "next/link";
import { ChevronRight, Clock, Phone } from "lucide-react";
import { BookingStatusBadge } from "@/components/BookingStatusBadge";
import { ServiceIcon } from "@/components/ServiceIcon";
import { adminDashboard } from "@/lib/admin";
import { addDays, rupees, slotLabel } from "@/lib/format";
import { formatPhone } from "@/lib/phone";
import { t } from "@/lib/i18n";
import type { AdminBookingDTO } from "@/lib/types";
import { DailyBookingsChart } from "./DailyBookingsChart";

export const metadata = { title: "Dashboard · Admin · Locally" };

const d = t.admin.dashboard;

const timeAgo = (iso: string) => {
  const mins = Math.max(0, Math.round((Date.now() - Date.parse(iso)) / 60_000));
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} hr${hrs === 1 ? "" : "s"} ago`;
  const days = Math.round(hrs / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
};

export default async function AdminDashboardPage() {
  const data = await adminDashboard();
  const { stats } = data;
  const tomorrow = addDays(data.today, 1);

  return (
    <main className="flex flex-1 flex-col px-4 pb-10">
      {/* What needs doing comes first: the one place the dashboard raises its voice. */}
      <section className={`-mx-4 rounded-b-[32px] px-4 pb-6 pt-5 ${data.newBookings > 0 ? "bg-brand-deep text-white" : "bg-white"}`}>
        <h2 className="max-w-[18ch] text-[26px] font-extrabold leading-[1.15] tracking-tight">
          {d.waitingTitle(data.newBookings)}
        </h2>
        {data.waiting.length === 0 ? (
          <p className={`mt-2 text-sm ${data.newBookings > 0 ? "text-white/70" : "text-ink-soft"}`}>{d.waitingEmpty}</p>
        ) : (
          <>
            <p className="mt-1 text-sm text-white/70">{d.waitingOldest}</p>
            <ul className="mt-4 divide-y divide-line rounded-2xl bg-white px-3.5 text-ink">
              {data.waiting.map((b) => (
                <li key={b.id} className="flex items-center gap-3 py-2.5">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-accent-tint text-accent"><ServiceIcon icon={b.categoryIcon} className="h-5 w-5" /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">{b.serviceName}</span>
                    <span className="block truncate text-[13px] text-ink-soft">
                      {b.customerName ?? formatPhone(b.customerPhone)}, {b.localBodyName}
                    </span>
                  </span>
                  <span className="shrink-0 text-xs text-ink-soft">{d.bookedAgo(timeAgo(b.createdAt))}</span>
                </li>
              ))}
            </ul>
            <Link href="/admin/bookings?status=REQUESTED" className="btn mt-4 w-full bg-accent-bright text-white hover:bg-accent">
              {d.reviewAll}
            </Link>
          </>
        )}
      </section>

      {/* Headline numbers: one quiet strip, not a wall of tiles. */}
      <dl className="mt-5 grid grid-cols-2 gap-2.5">
        <Stat label={d.thisWeek} value={stats.bookingsThisWeek.toString()} note={d.weekDelta(stats.bookingsThisWeek, stats.bookingsLastWeek)} />
        <Stat label={d.completedMonth} value={rupees(stats.completedValueThisMonth)} />
        <Stat label={d.customers} value={stats.customers.toLocaleString("en-IN")} />
        <Stat
          label={d.localitiesLive}
          value={stats.localitiesLive.toString()}
          note={d.localitiesOf(stats.localitiesTotal)}
          href="/admin/localities"
        />
      </dl>

      <section className="card mt-5 p-4">
        <h2 className="text-[17px] font-extrabold tracking-tight">{d.chartTitle}</h2>
        <p className="text-[13px] text-ink-soft">{d.chartCaption}</p>
        <DailyBookingsChart daily={data.daily} today={data.today} />
      </section>

      <section className="mt-7">
        <h2 className="mb-2.5 text-[17px] font-extrabold tracking-tight">{d.upcomingTitle}</h2>
        {data.upcoming.length === 0 ? (
          <p className="text-sm text-ink-soft">{d.upcomingEmpty}</p>
        ) : (
          <ul className="card divide-y divide-line">
            {data.upcoming.map((b) => (
              <UpcomingRow key={b.id} booking={b} dayLabel={b.date === data.today ? d.today : b.date === tomorrow ? d.tomorrow : b.date} />
            ))}
          </ul>
        )}
      </section>

      <section className="mt-7">
        <h2 className="text-base font-bold">{d.demandTitle}</h2>
        <p className="mb-2 text-[13px] text-ink-soft">{d.demandCaption}</p>
        {data.unmetDemand.length === 0 ? (
          <p className="text-sm text-ink-soft">{d.demandEmpty}</p>
        ) : (
          <ul className="card divide-y divide-line">
            {data.unmetDemand.map((r) => (
              <li key={`${r.localBodyId}|${r.serviceId}`}>
                <LinkRow
                  href={`/admin/local-bodies/${encodeURIComponent(r.localBodyId)}`}
                  title={r.serviceName ?? d.demandAnything}
                  subtitle={r.localBodyName}
                  count={d.requests(r.count)}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-7">
        <h2 className="text-base font-bold">{d.topTitle}</h2>
        <p className="mb-2 text-[13px] text-ink-soft">{d.topCaption}</p>
        {data.topLocalities.length === 0 ? (
          <p className="text-sm text-ink-soft">{d.topEmpty}</p>
        ) : (
          <ul className="card divide-y divide-line">
            {data.topLocalities.map((l) => (
              <li key={l.id}>
                <LinkRow href={`/admin/local-bodies/${encodeURIComponent(l.id)}`} title={l.name} count={l.count.toString()} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

function Stat({ label, value, note, href }: { label: string; value: string; note?: string; href?: string }) {
  const body = (
    <>
      <dt className="text-[13px] text-ink-soft">{label}</dt>
      <dd className="mt-0.5 text-2xl font-extrabold tabular-nums tracking-tight">{value}</dd>
      {note && <dd className="text-xs text-ink-faint">{note}</dd>}
    </>
  );
  return href ? (
    <Link href={href} className="card block p-4 transition hover:shadow-lift">{body}</Link>
  ) : (
    <div className="card p-4">{body}</div>
  );
}

function UpcomingRow({ booking: b, dayLabel }: { booking: AdminBookingDTO; dayLabel: string }) {
  return (
    <li className="flex items-center gap-3 px-4 py-3">
      <span className="w-[72px] shrink-0">
        <span className="block text-sm font-bold">{dayLabel}</span>
        <span className="flex items-center gap-1 text-xs text-ink-soft">
          <Clock className="h-3 w-3" />
          {slotLabel(b.slot)}
        </span>
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-semibold">{b.serviceName}</span>
        <a href={`tel:+${b.customerPhone}`} className="flex items-center gap-1 truncate text-[13px] text-ink-soft hover:text-ink">
          <Phone className="h-3 w-3 shrink-0" />
          <span className="truncate">{b.customerName ?? formatPhone(b.customerPhone)}, {b.localBodyName}</span>
        </a>
      </span>
      <BookingStatusBadge status={b.status} />
    </li>
  );
}

function LinkRow({ href, title, subtitle, count }: { href: string; title: string; subtitle?: string; count: string }) {
  return (
    <Link href={href} className="flex min-h-[52px] items-center gap-3 px-4 py-2.5 hover:bg-gray-50">
      <span className="min-w-0 flex-1">
        <span className="block truncate font-semibold">{title}</span>
        {subtitle && <span className="block truncate text-[13px] text-ink-soft">{subtitle}</span>}
      </span>
      <span className="shrink-0 text-sm font-semibold tabular-nums text-ink-soft">{count}</span>
      <ChevronRight className="h-5 w-5 shrink-0 text-ink-faint" />
    </Link>
  );
}
