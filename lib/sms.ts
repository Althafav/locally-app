import "server-only";

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

// Sketch for later: MSG91 OTP API (needs a DLT-approved template in India).
class Msg91SmsProvider implements SmsProvider {
  readonly name = "msg91";
  async sendOtp(_phone: string, _code: string) {
    // TODO: POST https://control.msg91.com/api/v5/otp with
    // authkey=MSG91_AUTH_KEY, template_id=MSG91_TEMPLATE_ID, mobile, otp
    throw new Error("MSG91 provider not implemented yet");
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
