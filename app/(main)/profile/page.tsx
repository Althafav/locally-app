import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarDays, ChevronRight, Mail, MapPin, Phone, ShieldCheck } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatPhone } from "@/lib/phone";
import { t } from "@/lib/i18n";
import { LogoutButton } from "./LogoutButton";

export const metadata = { title: "Profile · Locally" };

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?expired=1");
  const [localBody, bookingCount] = await Promise.all([
    user.localBodyId ? db.localBody.findUnique({ where: { id: user.localBodyId }, include: { district: true } }) : null,
    db.booking.count({ where: { userId: user.id } }),
  ]);
  const initials = (user.name ?? "?").split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();

  return (
    <main className="flex flex-1 flex-col px-4">
      <h1 className="pb-4 pt-6 text-2xl font-extrabold tracking-tight">{t.profile.title}</h1>

      <section className="card flex items-center gap-4 p-4">
        <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-accent text-lg font-extrabold text-white">{initials}</span>
        <div className="min-w-0">
          <p className="truncate text-lg font-extrabold">{user.name}</p>
          <p className="flex items-center gap-1.5 text-sm text-ink-soft"><Phone className="h-3.5 w-3.5" />{formatPhone(user.phone)}</p>
          {user.email && <p className="flex items-center gap-1.5 truncate text-sm text-ink-soft"><Mail className="h-3.5 w-3.5" />{user.email}</p>}
        </div>
      </section>

      <ul className="card mt-4 divide-y divide-line overflow-hidden">
        <li>
          <Link href="/location" className="flex min-h-[64px] items-center gap-3 px-4 py-3 hover:bg-gray-50">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-accent-tint text-accent"><MapPin className="h-5 w-5" /></span>
            <span className="min-w-0 flex-1">
              <span className="block text-xs text-ink-soft">{t.profile.location}</span>
              <span className="block truncate font-semibold">
                {localBody ? `${localBody.name}, ${localBody.district.name}` : "—"}
              </span>
              {(user.ward || user.landmark) && (
                <span className="block truncate text-xs text-ink-faint">
                  {[user.ward && `${t.profile.ward} ${user.ward}`, user.landmark].filter(Boolean).join(" · ")}
                </span>
              )}
            </span>
            <ChevronRight className="h-5 w-5 text-ink-faint" />
          </Link>
        </li>
        <li>
          <Link href="/bookings" className="flex min-h-[56px] items-center gap-3 px-4 py-3 hover:bg-gray-50">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-accent-tint text-accent"><CalendarDays className="h-5 w-5" /></span>
            <span className="flex-1 font-semibold">{t.profile.myBookings}</span>
            <span className="rounded-full bg-paper px-2.5 py-0.5 text-sm font-bold text-ink-soft">{bookingCount}</span>
            <ChevronRight className="h-5 w-5 text-ink-faint" />
          </Link>
        </li>
        {user.role === "ADMIN" && (
          <li>
            <Link href="/admin" className="flex min-h-[56px] items-center gap-3 px-4 py-3 hover:bg-gray-50">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-accent-tint text-accent"><ShieldCheck className="h-5 w-5" /></span>
              <span className="flex-1 font-semibold">{t.admin.openAdmin}</span>
              <ChevronRight className="h-5 w-5 text-ink-faint" />
            </Link>
          </li>
        )}
      </ul>

      <LogoutButton />
      <p className="mt-auto pb-6 pt-10 text-center text-xs text-ink-faint">Locally · MVP · Kannur</p>
    </main>
  );
}
