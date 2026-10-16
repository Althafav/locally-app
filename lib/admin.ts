import "server-only";
import { db } from "./db";
import { ApiError } from "./api";
import { normalizeIndianMobile } from "./phone";
import { toLocalBodyDTO } from "./locations";
import { addDays, istToday } from "./format";
import type { Prisma } from "@prisma/client";
import { NEXT_STATUSES } from "./types";
import type {
  AdminBookingDTO, AdminCategoryDTO, AdminDashboardDTO, AdminLocalBodyDTO, AdminLocalBodyDetail, BookingStatus, LocalBodyType,
} from "./types";

const TYPE_ORDER: Record<LocalBodyType, number> = { CORPORATION: 0, MUNICIPALITY: 1, GRAMA_PANCHAYAT: 2 };

/** Phones listed in ADMIN_PHONES (comma-separated) are made admins at login. */
export function isAdminPhone(phone: string) {
  return (process.env.ADMIN_PHONES ?? "")
    .split(",")
    .map((p) => normalizeIndianMobile(p))
    .includes(phone);
}

const categoriesWithServices = () =>
  db.serviceCategory.findMany({
    orderBy: { sortOrder: "asc" },
    include: { services: { where: { isActive: true }, orderBy: { sortOrder: "asc" } } },
  });

/** The fixed service list (from seed) with base prices and how widely each is assigned. */
export async function adminListServices(): Promise<AdminCategoryDTO[]> {
  const [categories, counts] = await Promise.all([
    categoriesWithServices(),
    db.serviceAvailability.groupBy({ by: ["serviceId"], where: { isAvailable: true }, _count: true }),
  ]);
  const count = new Map(counts.map((c) => [c.serviceId, c._count]));
  return categories
    .filter((c) => c.services.length > 0)
    .map((c) => ({
      id: c.id,
      name: c.name,
      icon: c.icon,
      services: c.services.map((s) => ({ id: s.id, name: s.name, basePrice: s.basePrice, assignedCount: count.get(s.id) ?? 0 })),
    }));
}

export async function adminSetBasePrice(serviceId: string, basePrice: number) {
  const service = await db.service.findFirst({ where: { id: serviceId, isActive: true } });
  if (!service) throw new ApiError(404, "Service not found.", "SERVICE_NOT_FOUND");
  return db.service.update({ where: { id: serviceId }, data: { basePrice } });
}

export async function adminListLocalBodies(): Promise<AdminLocalBodyDTO[]> {
  const [rows, counts] = await Promise.all([
    db.localBody.findMany({ where: { isActive: true } }),
    db.serviceAvailability.groupBy({
      by: ["localBodyId"],
      where: { isAvailable: true, service: { isActive: true } },
      _count: true,
    }),
  ]);
  const count = new Map(counts.map((c) => [c.localBodyId, c._count]));
  return rows
    .sort((a, b) => TYPE_ORDER[a.type] - TYPE_ORDER[b.type] || a.name.localeCompare(b.name))
    .map((lb) => ({ ...toLocalBodyDTO(lb), assignedCount: count.get(lb.id) ?? 0 }));
}

export async function adminGetLocalBody(id: string): Promise<AdminLocalBodyDetail | null> {
  const lb = await db.localBody.findUnique({ where: { id } });
  if (!lb) return null;
  const [categories, availability] = await Promise.all([
    categoriesWithServices(),
    db.serviceAvailability.findMany({ where: { localBodyId: id } }),
  ]);
  const avail = new Map(availability.map((a) => [a.serviceId, a]));
  return {
    localBody: toLocalBodyDTO(lb),
    categories: categories
      .filter((c) => c.services.length > 0)
      .map((c) => ({
        id: c.id,
        name: c.name,
        icon: c.icon,
        services: c.services.map((s) => {
          const a = avail.get(s.id);
          return {
            serviceId: s.id,
            name: s.name,
            basePrice: s.basePrice,
            assigned: !!a?.isAvailable,
            priceOverride: a?.priceOverride ?? null,
          };
        }),
      })),
  };
}

/**
 * Assign / unassign a service in a local body and/or set its local price.
 * Unassigning keeps the row (isAvailable = false) so the local price survives a re-assign.
 */
export async function adminSetAssignment(
  localBodyId: string,
  serviceId: string,
  change: { assigned?: boolean; priceOverride?: number | null }
) {
  const [lb, service] = await Promise.all([
    db.localBody.findUnique({ where: { id: localBodyId } }),
    db.service.findFirst({ where: { id: serviceId, isActive: true } }),
  ]);
  if (!lb) throw new ApiError(404, "Local body not found.", "LOCAL_BODY_NOT_FOUND");
  if (!service) throw new ApiError(404, "Service not found.", "SERVICE_NOT_FOUND");

  const data = {
    ...(change.assigned !== undefined && { isAvailable: change.assigned }),
    ...(change.priceOverride !== undefined && { priceOverride: change.priceOverride }),
  };
  const row = await db.serviceAvailability.upsert({
    where: { serviceId_localBodyId: { serviceId, localBodyId } },
    create: { serviceId, localBodyId, isAvailable: false, ...data },
    update: data,
  });
  return { assigned: row.isAvailable, priceOverride: row.priceOverride };
}

export const ADMIN_BOOKINGS_LIMIT = 100;

const bookingInclude = { service: { include: { category: true } }, localBody: true, user: true } as const;
type BookingRow = Prisma.BookingGetPayload<{ include: typeof bookingInclude }>;

const toAdminBookingDTO = (b: BookingRow): AdminBookingDTO => ({
  id: b.id,
  serviceId: b.serviceId,
  serviceName: b.service.name,
  categoryIcon: b.service.category.icon,
  localBodyId: b.localBodyId,
  localBodyName: b.localBody.name,
  date: b.date.toISOString().slice(0, 10),
  slot: b.slot,
  address: b.address,
  price: b.price,
  status: b.status,
  createdAt: b.createdAt.toISOString(),
  customerName: b.user.name,
  customerPhone: b.user.phone,
});

/** Latest bookings across all customers, optionally filtered. */
export async function adminListBookings(filter: { status?: BookingStatus; localBodyId?: string }): Promise<AdminBookingDTO[]> {
  const rows = await db.booking.findMany({
    where: { status: filter.status, localBodyId: filter.localBodyId },
    orderBy: { createdAt: "desc" },
    take: ADMIN_BOOKINGS_LIMIT,
    include: bookingInclude,
  });
  return rows.map(toAdminBookingDTO);
}

/** Booking count per status (within one local body, if given), for the filter chips. */
export async function adminCountBookingsByStatus(localBodyId?: string): Promise<Partial<Record<BookingStatus, number>>> {
  const rows = await db.booking.groupBy({ by: ["status"], where: { localBodyId }, _count: { _all: true } });
  return Object.fromEntries(rows.map((r) => [r.status, r._count._all]));
}

export const adminCountNewBookings = () => db.booking.count({ where: { status: "REQUESTED" } });

/** Move a booking along REQUESTED → CONFIRMED → IN_PROGRESS → COMPLETED, or cancel it. */
export async function adminSetBookingStatus(id: string, status: BookingStatus) {
  const booking = await db.booking.findUnique({ where: { id } });
  if (!booking) throw new ApiError(404, "Booking not found.", "BOOKING_NOT_FOUND");
  if (!NEXT_STATUSES[booking.status].includes(status)) {
    throw new ApiError(409, "That status change isn't allowed.", "BAD_STATUS_CHANGE");
  }
  // Conditional update so two admins can't both move the same booking from the same state.
  const { count } = await db.booking.updateMany({ where: { id, status: booking.status }, data: { status } });
  if (count === 0) throw new ApiError(409, "This booking was just changed by someone else. Refresh and try again.", "STALE");
  return { id, status };
}

/** Start of an IST calendar day as a Date. */
const istStart = (ymd: string) => new Date(`${ymd}T00:00:00+05:30`);
/** IST calendar day (YYYY-MM-DD) of a timestamp. */
const istDay = (d: Date) => new Date(d.getTime() + 330 * 60_000).toISOString().slice(0, 10);

const DAILY_DAYS = 14;

/** Everything the /admin dashboard shows, in one round of parallel queries. */
export async function adminDashboard(): Promise<AdminDashboardDTO> {
  const today = istToday();
  const firstDay = addDays(today, -(DAILY_DAYS - 1));
  const monthStart = `${today.slice(0, 8)}01`;

  const [
    newBookings, waitingRows, upcomingRows, recent, completedValue, customers,
    liveRows, localitiesTotal, topRows, interestRows, availableRows,
  ] = await Promise.all([
    adminCountNewBookings(),
    db.booking.findMany({ where: { status: "REQUESTED" }, orderBy: { createdAt: "asc" }, take: 5, include: bookingInclude }),
    db.booking.findMany({
      where: {
        status: { in: ["CONFIRMED", "IN_PROGRESS"] },
        date: { gte: new Date(`${today}T00:00:00Z`), lte: new Date(`${addDays(today, 1)}T00:00:00Z`) },
      },
      orderBy: [{ date: "asc" }, { slot: "asc" }],
      take: 20,
      include: bookingInclude,
    }),
    db.booking.findMany({ where: { createdAt: { gte: istStart(firstDay) } }, select: { createdAt: true } }),
    db.booking.aggregate({ where: { status: "COMPLETED", createdAt: { gte: istStart(monthStart) } }, _sum: { price: true } }),
    db.user.count({ where: { role: "USER", name: { not: null } } }),
    db.serviceAvailability.groupBy({ by: ["localBodyId"], where: { isAvailable: true, service: { isActive: true } } }),
    db.localBody.count({ where: { isActive: true } }),
    db.booking.groupBy({
      by: ["localBodyId"],
      where: { status: { not: "CANCELLED" }, createdAt: { gte: istStart(addDays(today, -29)) } },
      _count: { _all: true },
      orderBy: { _count: { localBodyId: "desc" } },
      take: 5,
    }),
    db.serviceInterest.groupBy({ by: ["localBodyId", "serviceId"], _count: { _all: true } }),
    db.serviceAvailability.findMany({ where: { isAvailable: true }, select: { localBodyId: true, serviceId: true } }),
  ]);

  // Bookings per IST day for the chart and the week-on-week comparison.
  const perDay = new Map<string, number>();
  for (const { createdAt } of recent) perDay.set(istDay(createdAt), (perDay.get(istDay(createdAt)) ?? 0) + 1);
  const daily = Array.from({ length: DAILY_DAYS }, (_, i) => {
    const date = addDays(firstDay, i);
    return { date, count: perDay.get(date) ?? 0 };
  });
  const sum = (xs: { count: number }[]) => xs.reduce((n, x) => n + x.count, 0);

  // Demand for things not offered: a service not assigned there, or "anything" where nothing is assigned.
  const offered = new Set(availableRows.map((a) => `${a.localBodyId}|${a.serviceId}`));
  const live = new Set(liveRows.map((r) => r.localBodyId));
  const unmet = interestRows
    .filter((r) => (r.serviceId ? !offered.has(`${r.localBodyId}|${r.serviceId}`) : !live.has(r.localBodyId)))
    .sort((a, b) => b._count._all - a._count._all)
    .slice(0, 8);

  const [localBodies, services] = await Promise.all([
    db.localBody.findMany({
      where: { id: { in: [...new Set([...topRows, ...unmet].map((r) => r.localBodyId))] } },
      select: { id: true, name: true },
    }),
    db.service.findMany({
      where: { id: { in: unmet.flatMap((r) => (r.serviceId ? [r.serviceId] : [])) } },
      select: { id: true, name: true },
    }),
  ]);
  const lbName = new Map(localBodies.map((l) => [l.id, l.name]));
  const svcName = new Map(services.map((s) => [s.id, s.name]));

  return {
    newBookings,
    waiting: waitingRows.map(toAdminBookingDTO),
    upcoming: upcomingRows.map(toAdminBookingDTO),
    today,
    stats: {
      bookingsThisWeek: sum(daily.slice(-7)),
      bookingsLastWeek: sum(daily.slice(0, 7)),
      completedValueThisMonth: completedValue._sum.price ?? 0,
      customers,
      localitiesLive: live.size,
      localitiesTotal,
    },
    daily,
    topLocalities: topRows.map((r) => ({ id: r.localBodyId, name: lbName.get(r.localBodyId) ?? r.localBodyId, count: r._count._all })),
    unmetDemand: unmet.map((r) => ({
      localBodyId: r.localBodyId,
      localBodyName: lbName.get(r.localBodyId) ?? r.localBodyId,
      serviceId: r.serviceId,
      serviceName: r.serviceId ? svcName.get(r.serviceId) ?? r.serviceId : null,
      count: r._count._all,
    })),
  };
}
