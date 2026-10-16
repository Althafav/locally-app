"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, ChevronRight, Clock, MapPin, Search, Store, X } from "lucide-react";
import { BottomSheet } from "@/components/BottomSheet";
import { LocationPicker } from "@/components/LocationPicker";
import { NotifyButton } from "@/components/NotifyButton";
import { ServiceIcon } from "@/components/ServiceIcon";
import { api, readCachedLocation, writeCachedLocation } from "@/lib/client";
import { duration, rupees } from "@/lib/format";
import { t } from "@/lib/i18n";
import type { CategoryDTO, MeDTO, SavedLocation, ServiceDTO, ServicesResponse } from "@/lib/types";

type Row = ServiceDTO & { icon: string; categoryName: string };

export function HomeScreen() {
  const [me, setMe] = useState<MeDTO | null>(null);
  const [location, setLocation] = useState<SavedLocation | null>(null);
  const [catalog, setCatalog] = useState<ServicesResponse | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const cache = useRef(new Map<string, ServicesResponse>());
  const requestFor = useRef<string | null>(null);

  const loadServices = useCallback(async (localBodyId: string, { fresh = false } = {}) => {
    requestFor.current = localBodyId;
    setLoadError(false);
    const cached = cache.current.get(localBodyId);
    setCatalog(cached && !fresh ? cached : null); // cached → instant, else skeleton
    try {
      const data = await api<ServicesResponse>(`/api/services?localBodyId=${encodeURIComponent(localBodyId)}`);
      cache.current.set(localBodyId, data);
      if (requestFor.current === localBodyId) setCatalog(data); // ignore stale responses
    } catch {
      if (requestFor.current === localBodyId && !cached) setLoadError(true);
    }
  }, []);

  // First paint from localStorage, then reconcile with the server profile.
  useEffect(() => {
    const cached = readCachedLocation();
    if (cached) {
      setLocation(cached);
      loadServices(cached.id);
    }
    api<{ user: MeDTO }>("/api/me")
      .then(({ user }) => {
        setMe(user);
        if (!user.location) return void (window.location.href = "/location");
        writeCachedLocation(user.location);
        if (user.location.id !== cached?.id) {
          setLocation(user.location);
          loadServices(user.location.id);
        } else setLocation(user.location);
      })
      .catch(() => {});
  }, [loadServices]);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(id);
  }, [toast]);

  /** Optimistic switch: UI moves immediately, server save happens in the background. */
  async function changeLocation(next: SavedLocation) {
    const prev = location;
    setSheetOpen(false);
    setLocation(next);
    setCategoryId(null);
    writeCachedLocation(next);
    loadServices(next.id);
    try {
      await api("/api/me/location", { method: "PUT", json: { localBodyId: next.id, ward: next.ward, landmark: next.landmark } });
    } catch {
      setToast(t.location.saveFailed);
      setLocation(prev);
      writeCachedLocation(prev);
      if (prev) loadServices(prev.id);
    }
  }

  const place = location?.name ?? "";

  const rows = useMemo(() => {
    if (!catalog) return { available: [] as Row[], soon: [] as Row[] };
    const q = query.trim().toLowerCase();
    const all: Row[] = catalog.categories.flatMap((c) =>
      c.services.map((s) => ({ ...s, icon: c.icon, categoryName: c.name }))
    );
    const filtered = all.filter(
      (s) =>
        (!categoryId || s.categoryId === categoryId) &&
        (!q || s.name.toLowerCase().includes(q) || s.categoryName.toLowerCase().includes(q) || s.description.toLowerCase().includes(q))
    );
    return { available: filtered.filter((s) => s.available), soon: filtered.filter((s) => !s.available) };
  }, [catalog, query, categoryId]);

  const searching = query.trim().length > 0 || categoryId !== null;

  return (
    <main className="flex flex-1 flex-col">
      {/* Hero band: location, greeting and search */}
      <header className="rounded-b-[32px] bg-brand-deep px-4 pb-12 pt-3 text-white">
        <button
          onClick={() => setSheetOpen(true)}
          className="-ml-1 flex min-h-[44px] max-w-full items-center gap-2 rounded-full px-1 text-left"
          aria-label={`${t.location.change}: ${place}`}
        >
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/15">
            <MapPin className="h-[18px] w-[18px]" fill="currentColor" stroke="#064E3B" strokeWidth={1.5} />
          </span>
          {location ? (
            <span className="min-w-0">
              <span className="flex items-center gap-1 text-[16px] font-extrabold leading-tight">
                <span className="truncate">{location.name}</span>
                <ChevronDown className="h-4 w-4 shrink-0" strokeWidth={2.5} />
              </span>
              <span className="block truncate text-xs text-white/70">
                {t.localBodyType[location.type]}
                {location.ward && ` · Ward ${location.ward}`}
                {location.landmark && ` · ${location.landmark}`}
              </span>
            </span>
          ) : (
            <span className="h-9 w-40 animate-pulse rounded-lg bg-white/15" />
          )}
        </button>

        <p className="mt-5 text-[24px] font-extrabold leading-tight tracking-tight">
          <span className="text-white/70">{t.home.greeting(me?.name)}</span>
          <br />
          {t.home.question}
        </p>
      </header>

      <div className="relative z-10 -mt-7 px-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-accent" />
          <input
            type="search"
            className="field min-h-[56px] rounded-full border-transparent pl-12 pr-12 shadow-lift"
            placeholder={t.home.search}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label={t.home.search}
          />
          {query && (
            <button onClick={() => setQuery("")} className="absolute right-1.5 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center text-ink-faint" aria-label="Clear search">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <div className="px-4">
        {/* Categories */}
        <section className="mt-5" aria-label={t.home.categories}>
          {catalog ? (
            <CategoryGrid categories={catalog.categories} selected={categoryId} onSelect={setCategoryId} />
          ) : loadError ? null : (
            <div className="grid grid-cols-4 gap-2">
              {Array.from({ length: 12 }).map((_, i) => <div key={i} className="skeleton aspect-[1/1.15] rounded-2xl" />)}
            </div>
          )}
        </section>

        {loadError && (
          <div className="card mt-6 p-6 text-center">
            <p className="font-semibold">{t.home.loadError}</p>
            <button className="btn-secondary mt-4" onClick={() => location && loadServices(location.id, { fresh: true })}>{t.home.retry}</button>
          </div>
        )}

        {!catalog && !loadError && (
          <div className="mt-7 space-y-2.5">
            <div className="skeleton h-5 w-44" />
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-[80px] rounded-2xl" />)}
          </div>
        )}

        {catalog && location && (
          <>
            {catalog.availableCount === 0 && !searching && (
              <EmptyHere place={place} localBodyId={location.id} notified={catalog.notifyLaunch} onChange={() => setSheetOpen(true)} />
            )}

            {rows.available.length > 0 && (
              <section className="mt-7">
                <h2 className="mb-2.5 flex items-baseline justify-between">
                  <span className="text-[17px] font-extrabold tracking-tight">{t.home.availableHere(rows.available.length, place)}</span>
                </h2>
                <ul className="space-y-2.5">
                  {rows.available.map((s) => (
                    <li key={s.id}>
                      <Link href={`/services/${s.id}`} className="card flex min-h-[80px] items-center gap-3.5 p-3.5 transition active:scale-[0.99] hover:shadow-lift">
                        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-accent-tint text-accent">
                          <ServiceIcon icon={s.icon} className="h-6 w-6" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-semibold">{s.name}</span>
                          <span className="mt-0.5 flex items-center gap-2 text-[13px] text-ink-soft">
                            <span>
                              {t.home.from} <b className="font-bold text-ink">{rupees(s.price)}</b>
                            </span>
                            <span className="text-ink-faint">·</span>
                            <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{duration(s.durationMins)}</span>
                          </span>
                        </span>
                        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-accent-tint text-accent"><ChevronRight className="h-4 w-4" strokeWidth={2.5} /></span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {rows.soon.length > 0 && (
              <section className="mt-8">
                <h2 className="mb-2.5 text-[17px] font-extrabold tracking-tight text-ink-soft">{t.home.comingSoonTo(place)}</h2>
                <ul className="space-y-2">
                  {rows.soon.map((s) => (
                    <li key={s.id} className="flex min-h-[64px] items-center gap-3 rounded-2xl bg-gray-100/80 px-3.5 py-2.5">
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-ink-faint">
                        <ServiceIcon icon={s.icon} className="h-5 w-5" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[15px] font-medium text-ink-soft">{s.name}</span>
                        <span className="block text-xs text-ink-faint">{s.categoryName}</span>
                      </span>
                      <NotifyButton key={`${location.id}:${s.id}`} serviceId={s.id} localBodyId={location.id} initial={s.interested} />
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {searching && rows.available.length === 0 && rows.soon.length === 0 && (
              <p className="py-12 text-center text-sm text-ink-soft">{t.home.noSearchResults(query.trim() || "this category")}</p>
            )}
            <div className="h-6" />
          </>
        )}
      </div>

      <BottomSheet open={sheetOpen} onClose={() => setSheetOpen(false)} title={t.location.change}>
        <LocationPicker current={location} onSave={changeLocation} />
      </BottomSheet>

      {toast && (
        <div className="fixed inset-x-0 bottom-24 z-50 mx-auto w-fit max-w-[90%] animate-fade-in rounded-full bg-ink px-5 py-3 text-sm font-medium text-white shadow-lift" role="alert">
          {toast}
        </div>
      )}
    </main>
  );
}

function CategoryGrid({
  categories, selected, onSelect,
}: { categories: CategoryDTO[]; selected: string | null; onSelect: (id: string | null) => void }) {
  return (
    <div className="grid grid-cols-4 gap-2.5">
      {categories.map((c) => {
        const live = c.services.some((s) => s.available);
        const active = selected === c.id;
        return (
          <button
            key={c.id}
            onClick={() => onSelect(active ? null : c.id)}
            aria-pressed={active}
            className={`relative flex aspect-[1/1.15] flex-col items-center justify-center gap-2 rounded-2xl px-1 transition active:scale-95 ${
              active ? "bg-accent-tint ring-2 ring-accent" : live ? "bg-white shadow-card" : "bg-gray-100/80"
            }`}
          >
            <span className={`grid h-11 w-11 place-items-center rounded-2xl ${active ? "bg-accent text-white" : live ? "bg-accent-tint text-accent" : "bg-white text-ink-faint"}`}>
              <ServiceIcon icon={c.icon} className="h-6 w-6" />
            </span>
            <span className={`line-clamp-2 text-center text-[11px] font-bold leading-tight ${live || active ? "text-ink" : "text-ink-faint"}`}>{c.name}</span>
            {!live && !active && (
              <span className="absolute right-1 top-1 rounded-full bg-white px-1.5 py-px text-[9px] font-bold uppercase tracking-wide text-ink-faint">soon</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

function EmptyHere({
  place, localBodyId, notified, onChange,
}: { place: string; localBodyId: string; notified: boolean; onChange: () => void }) {
  return (
    <section className="card mt-6 overflow-hidden">
      <div className="grid h-24 place-items-center bg-accent-tint">
        <Store className="h-10 w-10 text-accent" strokeWidth={1.5} />
      </div>
      <div className="p-5 text-center">
        <h2 className="text-lg font-extrabold">{t.home.emptyTitle(place)}</h2>
        <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{t.home.emptyBody}</p>
        <div className="mt-5 grid gap-2">
          <NotifyButton key={localBodyId} localBodyId={localBodyId} initial={notified} size="lg" label={t.home.notifyLaunch} doneLabel={t.home.notifyLaunchDone} />
          <button className="btn-ghost w-full" onClick={onChange}>{t.location.change}</button>
        </div>
      </div>
    </section>
  );
}
