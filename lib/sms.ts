import "server-only";
import { ApiError } from "./api";
import { OTP_TTL_SECONDS } from "./otp";

/**
 * SMS provider interface. The MVP ships with a console provider that logs
 * messages to the server terminal. To go live, implement `SmsProvider` for
 * MSG91 / Twilio and select it with SMS_PROVIDER.
 */
export interface SmsProvider {
  readonly name: string;
  sendOtp(phoneE164: string, code: string): Promise<void>;
}

class ConsoleSmsProvider implements SmsProvider {
  readonly name = "console";
  async sendOtp(phone: string, code: string) {
    console.log(`\n[sms:console] OTP for +${phone}: ${code}\n`);
  }
}

/**
 * MSG91 OTP API (v5). Needs MSG91_AUTH_KEY and MSG91_TEMPLATE_ID; the template
 * must be DLT-approved and contain the ##OTP## variable. We generate and verify
 * the code ourselves, so MSG91 only delivers it.
 */
class Msg91SmsProvider implements SmsProvider {
  readonly name = "msg91";
  async sendOtp(phone: string, code: string) {
    const authKey = process.env.MSG91_AUTH_KEY;
    const templateId = process.env.MSG91_TEMPLATE_ID;
    if (!authKey || !templateId) throw new Error("MSG91_AUTH_KEY and MSG91_TEMPLATE_ID must be set");

    // `phone` is already "91XXXXXXXXXX", the format MSG91 expects.
    const url = new URL("https://control.msg91.com/api/v5/otp");
    url.searchParams.set("template_id", templateId);
    url.searchParams.set("mobile", phone);
    url.searchParams.set("otp", code);
    url.searchParams.set("otp_expiry", String(OTP_TTL_SECONDS / 60));

    const res = await fetch(url, {
      method: "POST",
      headers: { authkey: authKey, "content-type": "application/json" },
      body: "{}",
      signal: AbortSignal.timeout(10_000),
    });
    const data = (await res.json().catch(() => ({}))) as { type?: string; message?: string };
    if (!res.ok || data.type !== "success") {
      console.error(`[sms:msg91] send failed (${res.status}):`, data.message ?? data);
      throw new ApiError(502, "We couldn't send the code right now. Please try again.", "SMS_FAILED");
    }
  }
}

class TwilioSmsProvider implements SmsProvider {
  readonly name = "twilio";
  async sendOtp(_phone: string, _code: string) {
    // TODO: POST https://api.twilio.com/2010-04-01/Accounts/{SID}/Messages.json
    throw new Error("Twilio provider not implemented yet");
  }
}

let provider: SmsProvider | undefined;

export function getSmsProvider(): SmsProvider {
  if (provider) return provider;
  switch ((process.env.SMS_PROVIDER ?? "console").toLowerCase()) {
    case "msg91":
      provider = new Msg91SmsProvider();
      break;
    case "twilio":
      provider = new TwilioSmsProvider();
      break;
    default:
      provider = new ConsoleSmsProvider();
  }
  return provider;
}
