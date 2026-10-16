import { z } from "zod";
import { handler, json, parseBody, ApiError } from "@/lib/api";
import { normalizeIndianMobile } from "@/lib/phone";
import { verifyOtp } from "@/lib/otp";
import { setSessionCookie } from "@/lib/auth";
import { db } from "@/lib/db";
import { toMeDTO } from "@/lib/me";
import { isAdminPhone } from "@/lib/admin";

const Body = z.object({
  phone: z.string().min(10).max(16),
  code: z.string().regex(/^\d{6}$/, "Enter the 6-digit code."),
});

export const POST = handler(async (req: Request) => {
  const body = await parseBody(req, Body);
  const phone = normalizeIndianMobile(body.phone);
  if (!phone) throw new ApiError(400, "Enter a valid 10-digit Indian mobile number.", "PHONE_INVALID");

  await verifyOtp(phone, body.code);

  // ADMIN_PHONES only promotes; demote by editing User.role directly.
  const promote = isAdminPhone(phone) ? { role: "ADMIN" as const } : {};
  const user = await db.user.upsert({ where: { phone }, create: { phone, ...promote }, update: promote });
  const me = await toMeDTO(user);
  const next = user.role === "ADMIN" ? "/admin" : !user.name ? "/setup" : !user.localBodyId ? "/location" : "/home";
  const res = json({ user: me, isNew: !user.name, next });
  await setSessionCookie(res, user);
  return res;
});
