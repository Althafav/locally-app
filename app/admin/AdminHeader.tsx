"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { ChevronLeft } from "lucide-react";
import { LogoMark } from "@/components/Logo";
import { t } from "@/lib/i18n";
import { LogoutButton } from "../(main)/profile/LogoutButton";
import { ADMIN_TABS } from "./AdminNav";

/** Slim sticky bar: the current section's name, or a way back from a detail page. */
export function AdminHeader({ name, phone }: { name: string | null; phone: string }) {
  const path = usePathname();
  const tab = ADMIN_TABS.find((x) => x.match(path)) ?? ADMIN_TABS[0];
  const isDetail = path.startsWith("/admin/local-bodies/");

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-2 bg-brand-deep px-2 text-white">
      {isDetail ? (
        <Link
          href={tab.href}
          className="flex min-h-[44px] items-center gap-0.5 rounded-full pl-1 pr-3 text-base font-bold outline-none hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white/60"
        >
          <ChevronLeft className="h-6 w-6" aria-hidden />
          {tab.label}
        </Link>
      ) : (
        <h1 className="flex items-center gap-2.5 pl-2 text-lg font-extrabold tracking-tight">
          <LogoMark className="h-7 w-7" />
          {tab.label}
        </h1>
      )}
      <div className="ml-auto">
        <AccountMenu name={name} phone={phone} />
      </div>
    </header>
  );
}

/** Log out lives one tap away, not in the header where it could be hit by accident. */
function AccountMenu({ name, phone }: { name: string | null; phone: string }) {
  const ref = useRef<HTMLDetailsElement>(null);
  const path = usePathname();
  const initial = (name?.trim()[0] ?? "A").toUpperCase();

  // Close on navigation, outside tap and Escape.
  useEffect(() => ref.current?.removeAttribute("open"), [path]);
  useEffect(() => {
    const close = (e: Event) => {
      const el = ref.current;
      if (!el?.open) return;
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !el.contains(e.target as Node)) {
        el.removeAttribute("open");
        if (e instanceof KeyboardEvent) el.querySelector("summary")?.focus();
      }
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", close);
    };
  }, []);

  return (
    <details ref={ref} className="group relative">
      <summary
        aria-label={t.admin.account}
        className="grid h-11 w-11 cursor-pointer list-none place-items-center rounded-full outline-none hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white/60 [&::-webkit-details-marker]:hidden"
      >
        <span className="grid h-8 w-8 place-items-center rounded-full bg-white text-sm font-extrabold text-brand-deep">{initial}</span>
      </summary>
      <div className="absolute right-0 top-[calc(100%+6px)] w-64 rounded-2xl bg-white p-1.5 text-ink shadow-lift motion-safe:animate-fade-in">
        <div className="px-3 pb-2.5 pt-2">
          <p className="truncate font-semibold">{name ?? phone}</p>
          <p className="text-[13px] text-ink-soft">{t.admin.signedInAs}</p>
        </div>
        <div className="border-t border-line pt-1.5">
          <LogoutButton compact />
        </div>
      </div>
    </details>
  );
}
