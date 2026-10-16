import { z } from "zod";
import { handler, json, parseBody, requireUser, ApiError } from "@/lib/api";
import { db } from "@/lib/db";
import { getServiceIn } from "@/lib/catalog";
import { listBookings } from "@/lib/me";
import { isSlotOpen, TIME_SLOTS } from "@/lib/format";

export const GET = handler(async () => {
  const user = await requireUser();
  return json({ bookings: await listBookings(user.id) });
});

const Body = z.object({
  serviceId: z.string().min(1),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a date.")
    // Reject impossible dates like 2026-10-32 or 2026-02-30 (they'd sort as "in range").
    .refine((d) => {
      const ms = Date.parse(`${d}T00:00:00Z`);
      return !Number.isNaN(ms) && new Date(ms).toISOString().slice(0, 10) === d;
    }, "Pick a date."),
  slot: z.enum(TIME_SLOTS.map((s) => s.id) as [string, ...string[]], { message: "Pick a time slot." }),
  address: z.string().trim().min(5, "Please enter your address.").max(300),
});

/** MVP stub: creates a REQUESTED booking. Worker assignment comes with the provider app. */
export const POST = handler(async (req: Request) => {
  const user = await requireUser();
  const body = await parseBody(req, Body);
  if (!user.localBodyId) throw new ApiError(400, "Choose your location first.");
  if (!isSlotOpen(body.date, body.slot)) throw new ApiError(400, "That time slot is no longer available.", "SLOT_CLOSED");

  const svc = await getServiceIn(body.serviceId, user.localBodyId);
  if (!svc) throw new ApiError(404, "Service not found.");
  if (!svc.available) throw new ApiError(409, "This service is not available in your location yet.", "NOT_AVAILABLE");

  const booking = await db.booking.create({
    data: {
      userId: user.id,
      serviceId: svc.service.id,
      localBodyId: user.localBodyId,
      date: new Date(`${body.date}T00:00:00Z`),
      slot: body.slot,
      address: body.address,
      price: svc.price,
    },
  });
  return json({ booking: { id: booking.id, status: booking.status } }, { status: 201 });
});
