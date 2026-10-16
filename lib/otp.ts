import "server-only";
import { createHmac, randomInt, timingSafeEqual } from "node:crypto";
import { db } from "./db";
import { getSmsProvider } from "./sms";
import { ApiError } from "./api";
import { DEMO_OTP } from "./demo-otp";

export const OTP_LENGTH = 6;
export const OTP_TTL_SECONDS = 5 * 60;
export const OTP_RESEND_SECONDS = 30;
const MAX_ATTEMPTS = 5;
const MAX_SENDS_PER_HOUR = 5;

const isDev = process.env.NODE_ENV !== "production";

function hash(phone: string, code: string) {
  return createHmac("sha256", process.env.JWT_SECRET ?? "").update(`${phone}:${code}`).digest("hex");
}

export async function sendOtp(phone: string) {
  const now = Date.now();
  const recent = await db.otpRequest.findMany({
    where: { phone, createdAt: { gt: new Date(now - 60 * 60 * 1000) } },
    orderBy: { createdAt: "desc" },
  });
  const last = recent[0];
  if (last && now - last.createdAt.getTime() < OTP_RESEND_SECONDS * 1000) {
    const wait = Math.ceil((OTP_RESEND_SECONDS * 1000 - (now - last.createdAt.getTime())) / 1000);
    throw new ApiError(429, `Please wait ${wait}s before requesting another code.`, "RESEND_TOO_SOON");
  }
  if (!isDev && recent.length >= MAX_SENDS_PER_HOUR) {
    throw new ApiError(429, "Too many codes requested. Try again in an hour.", "RATE_LIMITED");
  }

  const code = DEMO_OTP ?? String(randomInt(0, 10 ** OTP_LENGTH)).padStart(OTP_LENGTH, "0");
  const otp = await db.otpRequest.create({
    data: { phone, codeHash: hash(phone, code), expiresAt: new Date(now + OTP_TTL_SECONDS * 1000) },
  });
  try {
    await getSmsProvider().sendOtp(phone, code);
  } catch (err) {
    // Don't let a failed send count towards the resend wait or hourly limit.
    await db.otpRequest.delete({ where: { id: otp.id } });
    throw err;
  }
  return { resendIn: OTP_RESEND_SECONDS };
}

export async function verifyOtp(phone: string, code: string) {
  const req = await db.otpRequest.findFirst({
    where: { phone, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });
  if (!req) throw new ApiError(400, "This code has expired. Please request a new one.", "OTP_EXPIRED");
  // Claim an attempt atomically before comparing, so parallel requests can't
  // all pass a stale `attempts` check and brute-force the code.
  const { count } = await db.otpRequest.updateMany({
    where: { id: req.id, attempts: { lt: MAX_ATTEMPTS } },
    data: { attempts: { increment: 1 } },
  });
  if (count === 0) throw new ApiError(429, "Too many wrong attempts. Request a new code.", "OTP_LOCKED");

  const a = Buffer.from(hash(phone, code));
  const b = Buffer.from(req.codeHash);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    throw new ApiError(400, "That code is not right. Please check and try again.", "OTP_INVALID");
  }
  await db.otpRequest.deleteMany({ where: { phone } });
}
