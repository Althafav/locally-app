import { z } from "zod";
import { handler, json, parseBody, requireAdmin } from "@/lib/api";
import { adminSetAssignment } from "@/lib/admin";

const Body = z
  .object({
    assigned: z.boolean().optional(),
    /** null clears the local price (falls back to the base price) */
    priceOverride: z
      .number()
      .int("Price must be in whole rupees.")
      .min(1, "Price must be at least ₹1.")
      .max(1_000_000)
      .nullable()
      .optional(),
  })
  .refine((b) => b.assigned !== undefined || b.priceOverride !== undefined, "Nothing to update.");

/** Assign/unassign a service in a local body and/or set its local price. */
export const PUT = handler(
  async (req: Request, { params }: { params: Promise<{ id: string; serviceId: string }> }) => {
    await requireAdmin();
    const { id, serviceId } = await params;
    const body = await parseBody(req, Body);
    return json(await adminSetAssignment(id, serviceId, body));
  }
);
