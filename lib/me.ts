import "server-only";
import type { User } from "@prisma/client";
import { db } from "./db";
import { toLocalBodyDTO } from "./locations";
import type { BookingDTO, MeDTO } from "./types";

export async function toMeDTO(user: User): Promise<MeDTO> {
  const lb = user.localBodyId ? await db.localBody.findUnique({ where: { id: user.localBodyId } }) : null;
  return {
    id: user.id,
    phone: user.phone,
    name: user.name,
    email: user.email,
    location: lb ? { ...toLocalBodyDTO(lb), ward: user.ward, landmark: user.landmark } : null,
  };
}

export async function listBookings(userId: string): Promise<BookingDTO[]> {
  const rows = await db.booking.findMany({
    where: { userId },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    include: { service: { include: { category: true } }, localBody: true },
  });
  return rows.map((b) => ({
    id: b.id,
    serviceId: b.serviceId,
    serviceName: b.service.name,
    categoryIcon: b.service.category.icon,
    localBodyName: b.localBody.name,
    date: b.date.toISOString().slice(0, 10),
    slot: b.slot,
    address: b.address,
    price: b.price,
    status: b.status,
    createdAt: b.createdAt.toISOString(),
  }));
}
