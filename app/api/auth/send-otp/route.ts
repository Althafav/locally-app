import { z } from "zod";
import { handler, json, parseBody, ApiError } from "@/lib/api";
import { normalizeIndianMobile } from "@/lib/phone";
import { sendOtp } from "@/lib/otp";

const Body = z.object({ phone: z.string().min(10).max(16) });

export const POST = handler(async (req: Request) => {
  const { phone: raw } = await parseBody(req, Body);
  const phone = normalizeIndianMobile(raw);
  if (!phone) throw new ApiError(400, "Enter a valid 10-digit Indian mobile number.", "PHONE_INVALID");
  const { resendIn } = await sendOtp(phone);
  return json({ ok: true, resendIn });
});
