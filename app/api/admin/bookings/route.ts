import { z } from "zod";
import { handler, json, requireAdmin, ApiError } from "@/lib/api";
import { adminListBookings } from "@/lib/admin";
import { BOOKING_STATUSES } from "@/lib/types";

const Query = z.object({
  status: z.enum(BOOKING_STATUSES).optional(),
  localBodyId: z.string().min(1).optional(),
});

/** GET /api/admin/bookings?status=REQUESTED&localBodyId=kannur.pinarayi */
export const GET = handler(async (req: Request) => {
  await requireAdmin();
  const params = Object.fromEntries(new URL(req.url).searchParams);
  const parsed = Query.safeParse(params);
  if (!parsed.success) throw new ApiError(400, "Invalid filter.", "VALIDATION");
  return json({ bookings: await adminListBookings(parsed.data) });
});
