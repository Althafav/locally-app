"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { t } from "@/lib/i18n";

export function BottomSheet({
  open, onClose, title, children,
}: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" role="dialog" aria-modal="true" aria-label={title}>
      <button aria-label={t.common.close} className="absolute inset-0 animate-fade-in bg-black/40" onClick={onClose} />
      <div className="relative flex max-h-[90dvh] w-full max-w-[430px] animate-sheet-up flex-col rounded-t-[32px] bg-white pb-safe shadow-lift">
        <div className="mx-auto mt-2.5 h-1.5 w-10 rounded-full bg-gray-200" />
        <div className="flex items-center justify-between px-5 pb-2 pt-3">
          <h2 className="text-xl font-extrabold tracking-tight">{title}</h2>
          <button onClick={onClose} className="-mr-1 grid h-11 w-11 place-items-center rounded-full bg-paper hover:bg-gray-200" aria-label={t.common.close}>
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">{children}</div>
      </div>
    </div>
  );
}
