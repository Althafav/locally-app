import { z } from "zod";
import { handler, json, parseBody, requireUser, ApiError } from "@/lib/api";
import { getActiveLocalBody } from "@/lib/locations";
import { getServiceIn, registerInterest } from "@/lib/catalog";

const Body = z.object({ localBodyId: z.string().min(1).optional() });

/** "Notify me" for a service that isn't available in the user's local body yet. */
export const POST = handler(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const user = await requireUser();
  const { id } = await params;
  const body = await parseBody(req, Body);
  const localBodyId = body.localBodyId ?? user.localBodyId;
  if (!localBodyId || !(await getActiveLocalBody(localBodyId))) throw new ApiError(400, "Choose your location first.");

  const svc = await getServiceIn(id, localBodyId);
  if (!svc) throw new ApiError(404, "Service not found.");
  if (svc.available) throw new ApiError(409, "This service is already available here.");

  await registerInterest(user.id, localBodyId, id);
  return json({ ok: true });
});
