"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarCheck, Gauge, MapPinned, Tags, type LucideIcon } from "lucide-react";
import { t } from "@/lib/i18n";

type Tab = { href: string; label: string; Icon: LucideIcon; match: (p: string) => boolean };

export const ADMIN_TABS: Tab[] = [
  { href: "/admin", label: t.admin.dashboard.tab, Icon: Gauge, match: (p) => p === "/admin" },
  { href: "/admin/bookings", label: t.admin.bookings, Icon: CalendarCheck, match: (p) => p.startsWith("/admin/bookings") },
  {
    href: "/admin/localities",
    label: t.admin.localities,
    Icon: MapPinned,
    match: (p) => p.startsWith("/admin/localities") || p.startsWith("/admin/local-bodies"),
  },
  { href: "/admin/services", label: t.admin.services, Icon: Tags, match: (p) => p.startsWith("/admin/services") },
];

/** Admin's bottom bar, in thumb reach. `newBookings` = REQUESTED bookings waiting for an admin. */
export function AdminNav({ newBookings }: { newBookings: number }) {
  const path = usePathname();
  return (
    <nav
      aria-label={t.admin.title}
      className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-[430px] bg-white pb-safe shadow-bar"
    >
      <ul className="grid grid-cols-4">
        {ADMIN_TABS.map(({ href, label, Icon, match }) => {
          const active = match(path);
          const badge = href === "/admin/bookings" && newBookings > 0;
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`group flex min-h-[64px] flex-col items-center justify-center gap-1 text-xs outline-none ${
                  active ? "font-bold text-accent" : "font-semibold text-ink-faint"
                }`}
              >
                {/* The indicator is the active state; it also carries the focus ring and the press feedback. */}
                <span
                  className={`relative grid h-8 w-16 place-items-center rounded-full transition-colors duration-200 ease-out group-focus-visible:ring-2 group-focus-visible:ring-ink/40 ${
                    active ? "bg-accent-tint text-accent" : "group-hover:bg-black/[0.04] group-active:bg-black/[0.07]"
                  }`}
                >
                  <Icon className="h-[22px] w-[22px]" strokeWidth={active ? 2.25 : 1.75} aria-hidden />
                  {badge && (
                    <span className="absolute left-[38px] top-0 min-w-[18px] rounded-full bg-accent px-1 text-center text-[11px] font-bold leading-[18px] text-white ring-2 ring-white">
                      <span aria-hidden>{newBookings > 99 ? "99+" : newBookings}</span>
                      <span className="sr-only">, {t.admin.newBookings(newBookings)}</span>
                    </span>
                  )}
                </span>
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
