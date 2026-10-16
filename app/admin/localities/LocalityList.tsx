"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ChevronRight, Search } from "lucide-react";
import { t } from "@/lib/i18n";
import type { AdminLocalBodyDTO, LocalBodyType } from "@/lib/types";
import { JumpBar } from "../JumpBar";

const TYPES: LocalBodyType[] = ["CORPORATION", "MUNICIPALITY", "GRAMA_PANCHAYAT"];

export function LocalityList({ localBodies, totalServices }: { localBodies: AdminLocalBodyDTO[]; totalServices: number }) {
  const [query, setQuery] = useState("");

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const match = (lb: AdminLocalBodyDTO) =>
      !q || lb.name.toLowerCase().includes(q) || lb.nameMl.includes(q) || !!lb.blockName?.toLowerCase().includes(q);
    return TYPES.map((type) => ({ type, items: localBodies.filter((lb) => lb.type === type && match(lb)) })).filter(
      (g) => g.items.length > 0
    );
  }, [localBodies, query]);

  return (
    <main className="flex flex-1 flex-col px-4 pb-10">
      <label className="relative mt-4 block">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-faint" />
        <input
          className="field pl-11"
          placeholder={t.admin.searchLocalities}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          type="search"
        />
      </label>

      {groups.length > 1 && (
        <JumpBar
          className="mt-3"
          label={t.admin.jumpToType}
          targets={groups.map(({ type, items }) => ({ id: `type-${type}`, label: t.localBodyTypePlural[type], count: items.length }))}
        />
      )}

      {groups.length === 0 && <p className="py-10 text-center text-sm text-ink-soft">{t.admin.noMatch}</p>}

      {groups.map(({ type, items }) => (
        <section key={type} id={`type-${type}`} className="jump-section mt-5">
          <h2 className="mb-2 flex items-baseline justify-between px-1 text-sm font-bold">
            {t.localBodyTypePlural[type]}
            <span className="text-[13px] font-medium tabular-nums text-ink-faint">{items.length}</span>
          </h2>
          <ul className="card-flat divide-y divide-line overflow-hidden">
            {items.map((lb) => (
              <li key={lb.id}>
                <Link href={`/admin/local-bodies/${encodeURIComponent(lb.id)}`} className="flex min-h-[60px] items-center gap-3 px-4 py-2.5 hover:bg-gray-50">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">{lb.name}</span>
                    <span className="block truncate font-ml text-xs text-ink-faint">{lb.nameMl}</span>
                  </span>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold tabular-nums ${
                      lb.assignedCount === 0 ? "bg-gray-100 text-ink-faint" : "bg-accent-tint text-accent-dark"
                    }`}
                    title={t.admin.assignedOf(lb.assignedCount, totalServices)}
                  >
                    {lb.assignedCount === 0 ? t.admin.noneAssigned : t.admin.servicesAssigned(lb.assignedCount)}
                  </span>
                  <ChevronRight className="h-5 w-5 shrink-0 text-ink-faint" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </main>
  );
}
