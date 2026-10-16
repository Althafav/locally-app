import { handler, json } from "@/lib/api";
import { clearSessionCookie } from "@/lib/auth";

export const POST = handler(async () => {
  const res = json({ ok: true });
  clearSessionCookie(res);
  return res;
});
