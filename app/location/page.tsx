"use client";

import { useRouter } from "next/navigation";
import { LocationPicker } from "@/components/LocationPicker";
import { BackHeader } from "@/components/BackHeader";
import { api, readCachedLocation, writeCachedLocation } from "@/lib/client";
import { t } from "@/lib/i18n";
import type { MeDTO, SavedLocation } from "@/lib/types";
import { useEffect, useState } from "react";

/** Required step before Home (route guard sends users here), also reachable from Profile. */
export default function LocationPage() {
  const router = useRouter();
  const [current, setCurrent] = useState<SavedLocation | null | undefined>(undefined);

  useEffect(() => {
    setCurrent(readCachedLocation());
    api<{ user: MeDTO }>("/api/me").then(({ user }) => setCurrent(user.location)).catch(() => {});
  }, []);

  async function save(loc: SavedLocation) {
    const { user } = await api<{ user: MeDTO }>("/api/me/location", {
      method: "PUT",
      json: { localBodyId: loc.id, ward: loc.ward, landmark: loc.landmark },
    });
    writeCachedLocation(user.location);
    router.replace("/home");
    router.refresh();
  }

  return (
    <main className="flex flex-1 flex-col">
      {current ? <BackHeader /> : <div className="h-6" />}
      <div className="px-5 pb-5 pt-2">
        <h1 className="text-[28px] font-extrabold leading-tight tracking-tight">{t.location.title}</h1>
        <p className="mt-1 text-sm text-ink-soft">{t.location.subtitle}</p>
      </div>
      <LocationPicker current={current} onSave={save} />
    </main>
  );
}
