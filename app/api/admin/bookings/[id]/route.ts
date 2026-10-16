import { z } from "zod";
import { handler, json, parseBody, requireAdmin } from "@/lib/api";
import { adminSetBookingStatus } from "@/lib/admin";

const Body = z.object({
  status: z.enum(["CONFIRMED", "IN_PROGRESS", "COMPLETED", "CANCELLED"], { message: "Pick a status." }),
});

/** Change a booking's status (see NEXT_STATUSES in lib/types.ts for allowed moves). */
export const PATCH = handler(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  await requireAdmin();
  const { id } = await params;
  const { status } = await parseBody(req, Body);
  return json(await adminSetBookingStatus(id, status));
});
