import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarDays, CircleCheck, MapPin } from "lucide-react";
import { BookingStatusBadge } from "@/components/BookingStatusBadge";
import { ServiceIcon } from "@/components/ServiceIcon";
import { getSession } from "@/lib/auth";
import { listBookings } from "@/lib/me";
import { prettyDate, rupees, slotLabel } from "@/lib/format";
import { t } from "@/lib/i18n";

export const metadata = { title: "My bookings · Locally" };

export default async function BookingsPage({ searchParams }: { searchParams: Promise<{ new?: string }> }) {
  const session = await getSession();
  if (!session) redirect("/login?expired=1");
  const [{ new: newId }, bookings] = await Promise.all([searchParams, listBookings(session.sub)]);

  return (
    <main className="flex flex-1 flex-col px-4">
      <h1 className="pb-4 pt-6 text-2xl font-extrabold tracking-tight">{t.bookings.title}</h1>

      {newId && bookings.some((b) => b.id === newId) && (
        <div className="mb-4 flex items-start gap-2.5 rounded-2xl bg-accent p-4 text-sm text-white shadow-cta" role="status">
          <CircleCheck className="mt-0.5 h-5 w-5 shrink-0" />
          <p className="font-medium">{t.booking.success}</p>
        </div>
      )}

      {bookings.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center pb-16 text-center">
          <span className="grid h-16 w-16 place-items-center rounded-full bg-accent-tint">
            <CalendarDays className="h-7 w-7 text-accent" />
          </span>
          <p className="mt-4 font-semibold">{t.bookings.empty}</p>
          <Link href="/home" className="btn-primary mt-5">{t.bookings.emptyCta}</Link>
        </div>
      ) : (
        <ul className="space-y-2.5 pb-6">
          {bookings.map((b) => (
            <li key={b.id} className={`card p-4 ${b.id === newId ? "ring-2 ring-accent" : ""}`}>
              <div className="flex items-start gap-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-accent-tint text-accent">
                  <ServiceIcon icon={b.categoryIcon} className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <Link href={`/services/${b.serviceId}`} className="font-bold leading-snug">{b.serviceName}</Link>
                    <BookingStatusBadge status={b.status} />
                  </div>
                  <p className="mt-1 text-sm text-ink-soft">
                    {prettyDate(b.date)} · {slotLabel(b.slot)}
                  </p>
                  <p className="mt-1 flex items-center gap-1 truncate text-[13px] text-ink-faint">
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{b.address}, {b.localBodyName}</span>
                  </p>
                  <p className="mt-2.5 border-t border-line pt-2.5 text-[15px] font-extrabold">{rupees(b.price)}</p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
