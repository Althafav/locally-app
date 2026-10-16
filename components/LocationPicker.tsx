"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, ChevronLeft, LocateFixed, MapPin, Search } from "lucide-react";
import { Loader } from "@/components/Loader";
import { api } from "@/lib/client";
import { t } from "@/lib/i18n";
import type { DistrictDTO, LocalBodyDTO, LocalBodyType, SavedLocation } from "@/lib/types";

type Nearest = { localBody: LocalBodyDTO; distanceKm: number; withinServiceArea: boolean };
type View = "list" | "confirm" | "details";

const GROUPS: LocalBodyType[] = ["CORPORATION", "MUNICIPALITY", "GRAMA_PANCHAYAT"];

/**
 * Location picker: "use my current location" (nearest local body by centroid)
 * or manual district → local body search, then optional ward/landmark.
 * The parent decides what saving means (onboarding waits; home is optimistic).
 */
export function LocationPicker({
  current,
  onSave,
}: {
  current?: SavedLocation | null;
  onSave: (loc: SavedLocation) => Promise<void> | void;
}) {
  const [view, setView] = useState<View>("list");
  const [districts, setDistricts] = useState<DistrictDTO[] | null>(null);
  const [districtId, setDistrictId] = useState(current?.districtId ?? "kannur");
  const [bodies, setBodies] = useState<LocalBodyDTO[] | null>(null);
  const [query, setQuery] = useState("");
  const [geo, setGeo] = useState<{ status: "idle" | "locating" } | { status: "error"; message: string }>({ status: "idle" });
  const [nearest, setNearest] = useState<Nearest | null>(null);
  const [selected, setSelected] = useState<LocalBodyDTO | null>(null);
  const [ward, setWard] = useState("");
  const [landmark, setLandmark] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    api<{ districts: DistrictDTO[] }>("/api/locations/districts").then((r) => setDistricts(r.districts)).catch(() => setDistricts([]));
  }, []);

  useEffect(() => {
    setBodies(null);
    api<{ localBodies: LocalBodyDTO[] }>(`/api/locations/local-bodies?districtId=${encodeURIComponent(districtId)}`)
      .then((r) => setBodies(r.localBodies))
      .catch(() => setBodies([]));
  }, [districtId]);

  // Client-side filter: the list is small, so this keeps search instant.
  const grouped = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = (bodies ?? []).filter(
      (b) => !q || b.name.toLowerCase().includes(q) || b.nameMl.includes(query.trim()) || b.blockName?.toLowerCase().includes(q)
    );
    return GROUPS.map((type) => ({ type, items: list.filter((b) => b.type === type) })).filter((g) => g.items.length);
  }, [bodies, query]);

  function useCurrentLocation() {
    if (!("geolocation" in navigator)) {
      setGeo({ status: "error", message: t.location.unavailable });
      return;
    }
    setGeo({ status: "locating" });
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const n = await api<Nearest>(`/api/locations/nearest?lat=${pos.coords.latitude}&lng=${pos.coords.longitude}`);
          if (!n.withinServiceArea) {
            setGeo({ status: "error", message: t.location.outsideArea(n.localBody.name, Math.round(n.distanceKm)) });
            return;
          }
          setNearest(n);
          setGeo({ status: "idle" });
          setView("confirm");
        } catch {
          setGeo({ status: "error", message: t.location.unavailable });
        }
      },
      (err) =>
        setGeo({ status: "error", message: err.code === err.PERMISSION_DENIED ? t.location.denied : t.location.unavailable }),
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 5 * 60_000 }
    );
  }

  function choose(lb: LocalBodyDTO) {
    setSelected(lb);
    const same = current?.id === lb.id;
    setWard(same ? current?.ward ?? "" : "");
    setLandmark(same ? current?.landmark ?? "" : "");
    setSaveError(null);
    setView("details");
  }

  async function save() {
    if (!selected) return;
    setSaving(true);
    setSaveError(null);
    try {
      await onSave({ ...selected, ward: ward.trim() || null, landmark: landmark.trim() || null });
    } catch (e) {
      setSaveError((e as Error).message || t.location.saveFailed);
      setSaving(false);
    }
  }

  // ─── Confirm the GPS guess ────────────────────────────────────
  if (view === "confirm" && nearest) {
    return (
      <div className="px-5 pb-6 pt-2">
        <div className="card overflow-hidden">
          <div className="grid h-28 place-items-center bg-accent-tint">
            <span className="grid h-14 w-14 place-items-center rounded-full bg-accent text-white shadow-lg">
              <MapPin className="h-7 w-7" />
            </span>
          </div>
          <div className="p-5 text-center">
            <p className="text-sm text-ink-soft">{t.location.youAreIn}</p>
            <p className="mt-0.5 text-2xl font-extrabold tracking-tight">{nearest.localBody.name}</p>
            <p className="font-ml text-sm text-ink-soft">
              {nearest.localBody.nameMl} · {t.localBodyType[nearest.localBody.type]}
            </p>
            <p className="mt-4 font-semibold">{t.location.isThisRight}</p>
          </div>
        </div>
        <div className="mt-4 grid gap-2.5">
          <button className="btn-primary w-full" onClick={() => choose(nearest.localBody)}>
            <Check className="h-5 w-5" /> {t.location.confirm}
          </button>
          <button className="btn-secondary w-full" onClick={() => setView("list")}>
            {t.location.chooseManually}
          </button>
        </div>
      </div>
    );
  }

  // ─── Ward / landmark + save ────────────────────────────────────
  if (view === "details" && selected) {
    return (
      <div className="px-5 pb-6 pt-1">
        <button onClick={() => setView("list")} className="-ml-2 mb-2 flex min-h-[44px] items-center gap-1 rounded-lg px-2 text-sm font-semibold text-ink-soft hover:bg-black/5">
          <ChevronLeft className="h-4 w-4" /> {t.location.change}
        </button>
        <div className="card flex items-center gap-3 p-4">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-accent-tint text-accent">
            <MapPin className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="truncate font-bold">{selected.name}</p>
            <p className="truncate text-sm text-ink-soft">
              <span className="font-ml">{selected.nameMl}</span> · {t.localBodyType[selected.type]}
            </p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-[1fr_2fr] gap-3">
          <div>
            <label htmlFor="ward" className="label">{t.location.wardLabel}</label>
            <input id="ward" className="field" inputMode="numeric" maxLength={20} placeholder="e.g. 12" value={ward} onChange={(e) => setWard(e.target.value)} />
          </div>
          <div>
            <label htmlFor="landmark" className="label">{t.location.landmarkLabel}</label>
            <input id="landmark" className="field" maxLength={120} placeholder="Near…" value={landmark} onChange={(e) => setLandmark(e.target.value)} />
          </div>
        </div>
        <p className="mt-2 text-xs text-ink-faint">{t.location.detailsHint}</p>

        {saveError && <p className="mt-3 text-sm text-red-600" role="alert">{saveError}</p>}
        <button className="btn-primary mt-6 w-full" onClick={save} disabled={saving}>
          {saving && <Loader className="h-5 w-5" />}
          {t.location.save}
        </button>
      </div>
    );
  }

  // ─── Main list ─────────────────────────────────────────────────
  return (
    <div className="pb-6">
      <div className="px-5">
        <button
          onClick={useCurrentLocation}
          disabled={geo.status === "locating"}
          className="flex min-h-[56px] w-full items-center gap-3 rounded-2xl border border-accent/30 bg-accent-tint px-4 text-left font-semibold text-accent-dark transition active:scale-[0.99]"
        >
          {geo.status === "locating" ? <Loader className="h-5 w-5" /> : <LocateFixed className="h-5 w-5" />}
          {geo.status === "locating" ? t.location.locating : t.location.useCurrent}
        </button>
        {geo.status === "error" && (
          <p className="mt-2 rounded-xl bg-amber-50 px-3 py-2.5 text-sm text-amber-900 ring-1 ring-amber-200" role="status">
            {geo.message}
          </p>
        )}

        <p className="label mt-6">{t.location.district}</p>
      </div>

      {/* Districts: only active ones are selectable */}
      <div className="no-scrollbar flex gap-2 overflow-x-auto px-5 pb-1">
        {districts === null
          ? Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-11 w-24 shrink-0 rounded-xl" />)
          : districts.map((d) => (
              <button
                key={d.id}
                disabled={!d.isActive}
                onClick={() => setDistrictId(d.id)}
                className={`chip shrink-0 flex-col !items-start gap-0 !rounded-2xl leading-tight ${
                  d.id === districtId ? "border-accent bg-accent text-white" : d.isActive ? "border-line bg-white" : "border-dashed border-line bg-transparent text-ink-faint"
                }`}
              >
                <span>{d.name}</span>
                {!d.isActive && <span className="text-[10px] font-normal">{t.location.comingSoon}</span>}
              </button>
            ))}
      </div>

      <div className="sticky top-0 z-10 bg-paper px-5 pb-2 pt-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-faint" />
          <input
            type="search"
            className="field pl-11"
            placeholder={t.location.search}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label={t.location.search}
          />
        </div>
      </div>

      <div className="px-5">
        {bodies === null ? (
          <div className="mt-2 space-y-2">
            {Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton h-14" />)}
          </div>
        ) : grouped.length === 0 ? (
          <p className="py-10 text-center text-sm text-ink-soft">{t.location.noMatch}</p>
        ) : (
          grouped.map((g) => (
            <section key={g.type} className="mt-3">
              <h3 className="mb-1 text-xs font-bold uppercase tracking-wider text-ink-faint">
                {t.localBodyTypePlural[g.type]} <span className="font-medium">· {g.items.length}</span>
              </h3>
              <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-white">
                {g.items.map((b) => {
                  const isCurrent = current?.id === b.id;
                  return (
                    <li key={b.id}>
                      <button onClick={() => choose(b)} className="flex min-h-[56px] w-full items-center justify-between gap-3 px-4 py-2.5 text-left hover:bg-gray-50 active:bg-gray-100">
                        <span className="min-w-0">
                          <span className="block truncate font-semibold">{b.name}</span>
                          <span className="block truncate font-ml text-[13px] text-ink-soft">
                            {b.nameMl}
                            {b.blockName && <span className="font-sans text-ink-faint"> · {b.blockName} block</span>}
                          </span>
                        </span>
                        {isCurrent && <Check className="h-5 w-5 shrink-0 text-accent" aria-label="Current" />}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))
        )}
      </div>
    </div>
  );
}
