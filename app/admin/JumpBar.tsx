"use client";

import { useEffect, useRef, useState } from "react";

export type JumpTarget = { id: string; label: string; count?: number };

/**
 * Sticky row of section shortcuts under the header, for long admin lists.
 * Tapping scrolls to the section; the chip for the section in view stays highlighted.
 * Sections need `id={target.id}` and the `jump-section` class (scroll margin).
 */
export function JumpBar({ targets, label, className = "" }: { targets: JumpTarget[]; label: string; className?: string }) {
  const [current, setCurrent] = useState(targets[0]?.id);
  const rowRef = useRef<HTMLDivElement>(null);
  const ids = targets.map((x) => x.id).join("|");

  useEffect(() => {
    const els = ids.split("|").map((id) => document.getElementById(id)).filter((el): el is HTMLElement => !!el);
    if (els.length === 0) return;
    // A section counts as current once its heading passes just under the sticky bars.
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setCurrent(visible[0].target.id);
      },
      { rootMargin: "-120px 0px -55% 0px" }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [ids]);

  // Keep the highlighted chip in view as the page scrolls. Scroll only the row: a
  // scrollIntoView here would cancel the page's own smooth scroll after a tap.
  useEffect(() => {
    const row = rowRef.current;
    const chip = row?.querySelector<HTMLElement>(`[data-id="${CSS.escape(current ?? "")}"]`);
    if (row && chip) row.scrollTo({ left: chip.offsetLeft - (row.clientWidth - chip.offsetWidth) / 2, behavior: "smooth" });
  }, [current]);

  function jump(id: string) {
    setCurrent(id);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.getElementById(id)?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  }

  return (
    <nav aria-label={label} className={`sticky top-14 z-20 -mx-4 bg-paper/95 backdrop-blur ${className}`}>
      <div ref={rowRef} className="no-scrollbar flex gap-2 overflow-x-auto px-4 py-2.5">
        {targets.map((x) => {
          const active = x.id === current;
          return (
            <button
              key={x.id}
              data-id={x.id}
              type="button"
              onClick={() => jump(x.id)}
              aria-current={active ? "location" : undefined}
              className={`chip min-h-[40px] shrink-0 gap-1.5 ${active ? "border-accent bg-accent text-white" : "border-transparent bg-white text-ink-soft shadow-card"}`}
            >
              {x.label}
              {x.count !== undefined && <span className={`tabular-nums ${active ? "text-white/70" : "text-ink-faint"}`}>{x.count}</span>}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
