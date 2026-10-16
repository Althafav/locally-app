import { z } from "zod";
import { handler, json, parseBody, requireUser, ApiError } from "@/lib/api";
import { setSessionCookie } from "@/lib/auth";
import { db } from "@/lib/db";
import { getActiveLocalBody } from "@/lib/locations";
import { toMeDTO } from "@/lib/me";

const Body = z.object({
  localBodyId: z.string().min(1),
  ward: z.string().trim().max(20).optional().nullable(),
  landmark: z.string().trim().max(120).optional().nullable(),
});

export const PUT = handler(async (req: Request) => {
  const user = await requireUser();
  const body = await parseBody(req, Body);
  const lb = await getActiveLocalBody(body.localBodyId);
  if (!lb) throw new ApiError(400, "We don't serve that location yet.", "LOCAL_BODY_INACTIVE");

  // Ward/landmark belong to a specific local body; clear them when it changes
  // unless new values were sent.
  const changed = user.localBodyId !== lb.id;
  const updated = await db.user.update({
    where: { id: user.id },
    data: {
      localBodyId: lb.id,
      ward: body.ward !== undefined ? body.ward || null : changed ? null : user.ward,
      landmark: body.landmark !== undefined ? body.landmark || null : changed ? null : user.landmark,
    },
  });
  const res = json({ user: await toMeDTO(updated) });
  await setSessionCookie(res, updated);
  return res;
});
