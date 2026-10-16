"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { t } from "@/lib/i18n";

export function BackHeader({ title, fallback = "/home" }: { title?: string; fallback?: string }) {
  const router = useRouter();
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 bg-paper/90 px-4 backdrop-blur">
      <button
        onClick={() => (window.history.length > 1 ? router.back() : router.push(fallback))}
        className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white shadow-card active:scale-95"
        aria-label={t.common.back}
      >
        <ChevronLeft className="h-6 w-6" />
      </button>
      {title && <h1 className="truncate text-[17px] font-extrabold tracking-tight">{title}</h1>}
    </header>
  );
}
