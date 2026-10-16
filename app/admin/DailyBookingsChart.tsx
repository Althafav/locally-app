"use client";

import { useState } from "react";
import { prettyDate } from "@/lib/format";
import { t } from "@/lib/i18n";

const d = t.admin.dashboard;
const HEIGHT = 112; // px, plot area

/**
 * Single-series bar chart: one hue, thin bars with rounded tops on a shared baseline,
 * a 2px gap between bars, hover/focus tooltip per bar, and a screen-reader table.
 */
export function DailyBookingsChart({ daily, today }: { daily: { date: string; count: number }[]; today: string }) {
  const [active, setActive] = useState<number | null>(null);
  const max = Math.max(1, ...daily.map((x) => x.count));
  const peak = daily.reduce((best, x, i) => (x.count > daily[best].count ? i : best), 0);

  return (
    <figure className="mt-3">
      <div className="relative" style={{ height: HEIGHT + 20 }} onMouseLeave={() => setActive(null)}>
        {/* Tooltip */}
        {active !== null && (
          <div
            className="pointer-events-none absolute -top-1 z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-lg bg-ink px-2.5 py-1.5 text-xs font-semibold text-white"
            style={{ left: `${((active + 0.5) / daily.length) * 100}%` }}
            role="status"
          >
            {d.chartBar(prettyDate(daily[active].date), daily[active].count)}
          </div>
        )}

        <div className="absolute inset-x-0 top-0 flex items-end gap-[2px]" style={{ height: HEIGHT }} aria-hidden>
          {daily.map((x, i) => {
            const h = x.count === 0 ? 2 : Math.max(6, (x.count / max) * HEIGHT);
            return (
              <div key={x.date} className="relative flex h-full flex-1 items-end">
                <div
                  className={`w-full rounded-t-[4px] transition-colors ${
                    x.count === 0 ? "bg-line" : active === i ? "bg-accent-dark" : x.date === today ? "bg-accent" : "bg-accent/70"
                  }`}
                  style={{ height: h }}
                />
                {/* Direct label on the peak only */}
                {i === peak && x.count > 0 && active === null && (
                  <span className="absolute left-1/2 -translate-x-1/2 text-[11px] font-bold tabular-nums text-ink" style={{ bottom: h + 2 }}>
                    {x.count}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Baseline + first / last day labels */}
        <div className="absolute inset-x-0 border-t border-ink-faint/60" style={{ top: HEIGHT }} />
        <div className="absolute inset-x-0 flex justify-between text-[11px] text-ink-faint" style={{ top: HEIGHT + 4 }}>
          <span>{prettyDate(daily[0].date)}</span>
          <span>{d.today}</span>
        </div>

        {/* Keyboard access: one focusable button per bar, laid over the bars */}
        <div className="absolute inset-x-0 top-0 flex gap-[2px]" style={{ height: HEIGHT }}>
          {daily.map((x, i) => (
            <button
              key={x.date}
              type="button"
              className="h-full flex-1 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ink/40"
              aria-label={d.chartBar(prettyDate(x.date), x.count)}
              onMouseEnter={() => setActive(i)}
              onFocus={() => setActive(i)}
              onBlur={() => setActive(null)}
            />
          ))}
        </div>
      </div>

      <figcaption className="sr-only">{d.chartTitle}</figcaption>
      <table className="sr-only">
        <thead>
          <tr><th>{d.chartDay}</th><th>{d.chartCount}</th></tr>
        </thead>
        <tbody>
          {daily.map((x) => (
            <tr key={x.date}><td>{prettyDate(x.date)}</td><td>{x.count}</td></tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
