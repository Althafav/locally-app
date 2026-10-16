import { z } from "zod";
import { handler, json, parseBody, requireAdmin } from "@/lib/api";
import { adminSetBasePrice } from "@/lib/admin";

const Body = z.object({
  basePrice: z.number().int("Price must be in whole rupees.").min(1, "Price must be at least ₹1.").max(1_000_000),
});

/** Update a service's base price (used wherever no local price is set). */
export const PATCH = handler(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  await requireAdmin();
  const { id } = await params;
  const { basePrice } = await parseBody(req, Body);
  const service = await adminSetBasePrice(id, basePrice);
  return json({ id: service.id, basePrice: service.basePrice });
});
