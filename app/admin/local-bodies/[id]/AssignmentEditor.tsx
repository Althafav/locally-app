"use client";

import { useState } from "react";
import { ServiceIcon } from "@/components/ServiceIcon";
import { api, FetchError } from "@/lib/client";
import { rupees } from "@/lib/format";
import { t } from "@/lib/i18n";
import type { AdminAssignmentDTO, AdminLocalBodyDetail } from "@/lib/types";
import { JumpBar } from "../../JumpBar";
import { PriceInput } from "../../PriceInput";

type Change = { assigned?: boolean; priceOverride?: number | null };

export function AssignmentEditor({ detail }: { detail: AdminLocalBodyDetail }) {
  const { localBody } = detail;
  const [categories, setCategories] = useState(detail.categories);
  const [busy, setBusy] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const all = categories.flatMap((c) => c.services);
  const assignedCount = all.filter((s) => s.assigned).length;

  const patchLocal = (serviceId: string, patch: Partial<AdminAssignmentDTO>) =>
    setCategories((cs) =>
      cs.map((c) => ({ ...c, services: c.services.map((s) => (s.serviceId === serviceId ? { ...s, ...patch } : s)) }))
    );

  const save = (serviceId: string, change: Change) =>
    api<{ assigned: boolean; priceOverride: number | null }>(
      `/api/admin/local-bodies/${encodeURIComponent(localBody.id)}/services/${encodeURIComponent(serviceId)}`,
      { method: "PUT", json: change }
    );

  /** Optimistic toggle; rolls back if the save fails. */
  async function setAssigned(services: AdminAssignmentDTO[], assigned: boolean) {
    const targets = services.filter((s) => s.assigned !== assigned);
    if (targets.length === 0) return;
    setError(null);
    setBusy((b) => new Set([...b, ...targets.map((s) => s.serviceId)]));
    targets.forEach((s) => patchLocal(s.serviceId, { assigned }));
    const results = await Promise.allSettled(targets.map((s) => save(s.serviceId, { assigned })));
    results.forEach((r, i) => {
      if (r.status === "rejected") {
        patchLocal(targets[i].serviceId, { assigned: !assigned });
        setError(r.reason instanceof FetchError ? r.reason.message : t.admin.saveFailed);
      }
    });
    setBusy((b) => new Set([...b].filter((id) => !targets.some((s) => s.serviceId === id))));
  }

  async function setLocalPrice(serviceId: string, priceOverride: number | null) {
    const res = await save(serviceId, { priceOverride });
    patchLocal(serviceId, { priceOverride: res.priceOverride });
  }

  return (
    <main className="flex flex-1 flex-col px-4 pb-10">
      <h2 className="mt-4 text-xl font-extrabold leading-tight tracking-tight">{localBody.name}</h2>
      <p className="font-ml text-sm text-ink-soft">{localBody.nameMl}</p>
      <p className="mt-1 text-sm text-ink-soft">
        {t.localBodyType[localBody.type]} · <span className="font-semibold text-ink">{t.admin.assignedOf(assignedCount, all.length)}</span>
      </p>

      {error && (
        <p role="alert" className="mt-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      )}

      <JumpBar
        className="mt-3"
        label={t.admin.jumpToCategory}
        targets={categories.map((c) => ({ id: `cat-${c.id}`, label: c.name, count: c.services.filter((s) => s.assigned).length }))}
      />

      {categories.map((c) => {
        const allOn = c.services.every((s) => s.assigned);
        return (
          <section key={c.id} id={`cat-${c.id}`} className="jump-section mt-5">
            <div className="mb-2 flex items-center gap-2 px-1">
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-accent-tint text-accent">
                <ServiceIcon icon={c.icon} className="h-[18px] w-[18px]" />
              </span>
              <h3 className="flex-1 text-sm font-bold">{c.name}</h3>
              <button
                onClick={() => setAssigned(c.services, !allOn)}
                className="min-h-[44px] rounded-full px-3 text-xs font-bold text-accent hover:bg-accent-tint"
              >
                {allOn ? t.admin.removeAll : t.admin.assignAll}
              </button>
            </div>
            <ul className="card-flat divide-y divide-line">
              {c.services.map((s) => (
                <li key={s.serviceId} className="flex items-center gap-3 px-4 py-3">
                  <Toggle
                    checked={s.assigned}
                    disabled={busy.has(s.serviceId)}
                    label={t.admin.assign(s.name)}
                    onChange={(v) => setAssigned([s], v)}
                  />
                  <span className={`min-w-0 flex-1 font-semibold leading-snug ${s.assigned ? "" : "text-ink-faint"}`}>{s.name}</span>
                  <PriceInput
                    label={`${t.admin.localPrice}: ${s.name}`}
                    value={s.priceOverride}
                    placeholder={rupees(s.basePrice).slice(1)}
                    disabled={!s.assigned}
                    onSave={(v) => setLocalPrice(s.serviceId, v)}
                  />
                </li>
              ))}
            </ul>
          </section>
        );
      })}
      <p className="mt-4 px-1 text-xs text-ink-faint">{t.admin.localPriceHint}</p>
    </main>
  );
}

function Toggle({ checked, disabled, label, onChange }: { checked: boolean; disabled?: boolean; label: string; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative h-7 w-12 shrink-0 rounded-full transition before:absolute before:-inset-2 before:content-[""] disabled:opacity-60 ${checked ? "bg-accent" : "bg-gray-300"}`}
    >
      <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${checked ? "left-[22px]" : "left-0.5"}`} />
    </button>
  );
}
