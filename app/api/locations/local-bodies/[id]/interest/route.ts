import { handler, json, requireUser, ApiError } from "@/lib/api";
import { getActiveLocalBody } from "@/lib/locations";
import { registerInterest } from "@/lib/catalog";

/** "Notify me when you launch here" — interest in any service in this local body. */
export const POST = handler(async (_req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const user = await requireUser();
  const { id } = await params;
  if (!(await getActiveLocalBody(id))) throw new ApiError(404, "Location not found.");
  await registerInterest(user.id, id, null);
  return json({ ok: true });
});
