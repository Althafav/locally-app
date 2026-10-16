/**
 * Fixed OTP for testing without real SMS, or undefined when codes are random.
 * Always "123456" in development; in production only when NEXT_PUBLIC_DEMO_OTP
 * is set to a 6-digit code. Shared by the server (to issue it) and the login
 * page (to show the hint), hence NEXT_PUBLIC_ and no "server-only".
 */
export const DEMO_OTP: string | undefined =
  process.env.NODE_ENV !== "production"
    ? "123456"
    : /^\d{6}$/.test(process.env.NEXT_PUBLIC_DEMO_OTP ?? "")
      ? process.env.NEXT_PUBLIC_DEMO_OTP
      : undefined;
