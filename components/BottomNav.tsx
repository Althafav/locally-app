"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, House, User } from "lucide-react";
import { t } from "@/lib/i18n";

const ITEMS = [
  { href: "/home", label: t.nav.home, Icon: House },
  { href: "/bookings", label: t.nav.bookings, Icon: CalendarDays },
  { href: "/profile", label: t.nav.profile, Icon: User },
];

export function BottomNav() {
  const path = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-[430px] bg-white pb-safe shadow-bar">
      <ul className="grid grid-cols-3">
        {ITEMS.map(({ href, label, Icon }) => {
          const active = path === href || path.startsWith(href + "/");
          return (
            <li key={href}>
              <Link
                href={href}
                className={`flex min-h-[64px] flex-col items-center justify-center gap-1 text-[11px] font-bold ${active ? "text-accent" : "text-ink-faint"}`}
                aria-current={active ? "page" : undefined}
              >
                <span className={`grid h-8 w-14 place-items-center rounded-full transition ${active ? "bg-accent-tint" : ""}`}>
                  <Icon className="h-[22px] w-[22px]" strokeWidth={active ? 2.25 : 1.75} />
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
