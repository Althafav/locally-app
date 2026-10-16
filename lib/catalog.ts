import "server-only";
import { db } from "./db";
import { ApiError } from "./api";
import { getActiveLocalBody, toLocalBodyDTO } from "./locations";
import type { CategoryDTO, ServicesResponse } from "./types";

/**
 * Catalogue for one local body: every active service, flagged `available`
 * with the effective price. Unavailable services are still returned so the UI
 * can show "Coming soon to X" + Notify me.
 */
export async function getCatalog(localBodyId: string, userId?: string): Promise<ServicesResponse> {
  const lb = await getActiveLocalBody(localBodyId);
  if (!lb) throw new ApiError(404, "We could not find that location.", "LOCAL_BODY_NOT_FOUND");

  const [categories, availability, interests] = await Promise.all([
    db.serviceCategory.findMany({
      orderBy: { sortOrder: "asc" },
      include: { services: { where: { isActive: true }, orderBy: { sortOrder: "asc" } } },
    }),
    db.serviceAvailability.findMany({ where: { localBodyId, isAvailable: true } }),
    userId ? db.serviceInterest.findMany({ where: { userId, localBodyId } }) : Promise.resolve([]),
  ]);

  const avail = new Map(availability.map((a) => [a.serviceId, a]));
  const interested = new Set(interests.map((i) => i.serviceId ?? "*"));

  let availableCount = 0;
  const result: CategoryDTO[] = categories
    .map((c) => ({
      id: c.id,
      name: c.name,
      nameMl: c.nameMl,
      icon: c.icon,
      services: c.services.map((s) => {
        const a = avail.get(s.id);
        if (a) availableCount++;
        return {
          id: s.id,
          categoryId: c.id,
          name: s.name,
          nameMl: s.nameMl,
          description: s.description,
          durationMins: s.durationMins,
          price: a?.priceOverride ?? s.basePrice,
          available: !!a,
          interested: interested.has(s.id),
        };
      }),
    }))
    .filter((c) => c.services.length > 0);

  return { localBody: toLocalBodyDTO(lb), categories: result, availableCount, notifyLaunch: interested.has("*") };
}

/** Single service with availability in a local body (for detail + booking). */
export async function getServiceIn(serviceId: string, localBodyId: string | null) {
  const service = await db.service.findFirst({ where: { id: serviceId, isActive: true }, include: { category: true } });
  if (!service) return null;
  const availability = localBodyId
    ? await db.serviceAvailability.findUnique({ where: { serviceId_localBodyId: { serviceId, localBodyId } } })
    : null;
  const available = !!availability?.isAvailable;
  return {
    service,
    available,
    price: (available && availability?.priceOverride) || service.basePrice,
    inclusions: service.inclusions.split("\n").filter(Boolean),
  };
}

/** Record "Notify me" demand. serviceId = null → anything in this local body. Idempotent. */
export async function registerInterest(userId: string, localBodyId: string, serviceId: string | null) {
  const existing = await db.serviceInterest.findFirst({ where: { userId, localBodyId, serviceId } });
  if (existing) return existing;
  return db.serviceInterest.create({ data: { userId, localBodyId, serviceId } });
}
