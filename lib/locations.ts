import "server-only";
import type { LocalBody } from "@prisma/client";
import { db } from "./db";
import { haversineKm, MAX_NEAREST_KM } from "./geo";
import type { DistrictDTO, LocalBodyDTO, LocalBodyType } from "./types";

const TYPE_ORDER: Record<LocalBodyType, number> = { CORPORATION: 0, MUNICIPALITY: 1, GRAMA_PANCHAYAT: 2 };

export const toLocalBodyDTO = (lb: LocalBody): LocalBodyDTO => ({
  id: lb.id,
  districtId: lb.districtId,
  name: lb.name,
  nameMl: lb.nameMl,
  type: lb.type,
  blockName: lb.blockName,
});

export async function listDistricts(): Promise<DistrictDTO[]> {
  const rows = await db.district.findMany({ orderBy: [{ isActive: "desc" }, { sortOrder: "asc" }] });
  return rows.map(({ id, name, nameMl, isActive }) => ({ id, name, nameMl, isActive }));
}

export async function listLocalBodies(districtId: string, q?: string): Promise<LocalBodyDTO[]> {
  const rows = await db.localBody.findMany({
    where: { districtId, isActive: true, district: { isActive: true } },
    orderBy: { name: "asc" },
  });
  const needle = q?.trim().toLowerCase();
  return rows
    .filter((r) => !needle || r.name.toLowerCase().includes(needle) || r.nameMl.includes(needle) || r.blockName?.toLowerCase().includes(needle))
    .sort((a, b) => TYPE_ORDER[a.type] - TYPE_ORDER[b.type] || a.name.localeCompare(b.name))
    .map(toLocalBodyDTO);
}

/** Nearest active local body by centroid distance. */
export async function findNearest(lat: number, lng: number) {
  const rows = await db.localBody.findMany({ where: { isActive: true, district: { isActive: true } } });
  let best: { lb: LocalBody; km: number } | null = null;
  for (const lb of rows) {
    const km = haversineKm({ lat, lng }, lb);
    if (!best || km < best.km) best = { lb, km };
  }
  if (!best) return null;
  return {
    localBody: toLocalBodyDTO(best.lb),
    distanceKm: Math.round(best.km * 10) / 10,
    withinServiceArea: best.km <= MAX_NEAREST_KM,
  };
}

export async function getActiveLocalBody(id: string) {
  return db.localBody.findFirst({ where: { id, isActive: true, district: { isActive: true } } });
}
