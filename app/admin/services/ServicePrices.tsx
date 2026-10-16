"use client";

import { useState } from "react";
import { ServiceIcon } from "@/components/ServiceIcon";
import { api } from "@/lib/client";
import { t } from "@/lib/i18n";
import type { AdminCategoryDTO } from "@/lib/types";
import { JumpBar } from "../JumpBar";
import { PriceInput } from "../PriceInput";

/** The fixed service list: only base prices are editable here. */
export function ServicePrices({ categories: initial }: { categories: AdminCategoryDTO[] }) {
  const [categories, setCategories] = useState(initial);

  async function saveBasePrice(serviceId: string, basePrice: number) {
    const res = await api<{ basePrice: number }>(`/api/admin/services/${encodeURIComponent(serviceId)}`, {
      method: "PATCH",
      json: { basePrice },
    });
    setCategories((cs) =>
      cs.map((c) => ({ ...c, services: c.services.map((s) => (s.id === serviceId ? { ...s, basePrice: res.basePrice } : s)) }))
    );
  }

  return (
    <main className="flex flex-1 flex-col px-4 pb-10">
      <p className="mt-4 text-sm text-ink-soft">{t.admin.basePriceHint}</p>
      <JumpBar className="mt-3" label={t.admin.jumpToCategory} targets={categories.map((c) => ({ id: `cat-${c.id}`, label: c.name }))} />
      {categories.map((c) => (
        <section key={c.id} id={`cat-${c.id}`} className="jump-section mt-5">
          <h2 className="mb-2 flex items-center gap-2 px-1 text-sm font-bold">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-accent-tint text-accent">
              <ServiceIcon icon={c.icon} className="h-[18px] w-[18px]" />
            </span>
            {c.name}
          </h2>
          <ul className="card-flat divide-y divide-line">
            {c.services.map((s) => (
              <li key={s.id} className="flex items-center gap-3 px-4 py-3">
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold leading-snug">{s.name}</span>
                  <span className="block text-xs text-ink-faint">{t.admin.inLocalities(s.assignedCount)}</span>
                </span>
                <PriceInput
                  label={`${t.admin.basePrice}: ${s.name}`}
                  value={s.basePrice}
                  onSave={(v) => saveBasePrice(s.id, v!)}
                />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </main>
  );
}
