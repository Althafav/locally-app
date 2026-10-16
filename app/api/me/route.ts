import { z } from "zod";
import { handler, json, parseBody, requireUser } from "@/lib/api";
import { setSessionCookie } from "@/lib/auth";
import { db } from "@/lib/db";
import { toMeDTO } from "@/lib/me";

export const GET = handler(async () => {
  const user = await requireUser();
  return json({ user: await toMeDTO(user) });
});

const Patch = z.object({
  name: z.string().trim().min(1, "Please enter your name.").max(60).optional(),
  email: z
    .string()
    .trim()
    .max(120)
    .email("Enter a valid email or leave it empty.")
    .or(z.literal(""))
    .optional(),
});

/** Update profile basics (name, email). Used by the new-user step. */
export const PATCH = handler(async (req: Request) => {
  const user = await requireUser();
  const body = await parseBody(req, Patch);
  const updated = await db.user.update({
    where: { id: user.id },
    data: {
      ...(body.name !== undefined && { name: body.name }),
      ...(body.email !== undefined && { email: body.email || null }),
    },
  });
  const res = json({ user: await toMeDTO(updated) });
  await setSessionCookie(res, updated);
  return res;
});
