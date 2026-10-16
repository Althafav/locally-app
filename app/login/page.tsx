"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { Loader, PageLoader } from "@/components/Loader";
import { LogoMark } from "@/components/Logo";
import { api, FetchError } from "@/lib/client";
import { t } from "@/lib/i18n";
import { INDIAN_MOBILE } from "@/lib/phone";

type Step = "phone" | "otp";

/** `next` as a same-origin path, or null. Parsing (not prefix checks) also catches `/\evil.com`. */
function sameOriginPath(next: string | null) {
  if (!next?.startsWith("/")) return null;
  try {
    const url = new URL(next, window.location.origin);
    return url.origin === window.location.origin ? url.pathname + url.search + url.hash : null;
  } catch {
    return null;
  }
}

export default function LoginPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Login />
    </Suspense>
  );
}

function Login() {
  const router = useRouter();
  const params = useSearchParams();
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [resendIn, setResendIn] = useState(0);
  const otpRef = useRef<HTMLInputElement>(null);

  const phoneValid = INDIAN_MOBILE.test(phone);
  const pretty = `+91 ${phone.slice(0, 5)} ${phone.slice(5)}`;

  useEffect(() => {
    if (resendIn <= 0) return;
    const id = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [resendIn]);

  useEffect(() => {
    if (step === "otp") otpRef.current?.focus();
  }, [step]);

  async function sendCode() {
    if (!phoneValid) return setError(t.login.phoneInvalid);
    setBusy(true);
    setError(null);
    try {
      const res = await api<{ resendIn: number }>("/api/auth/send-otp", { method: "POST", json: { phone } });
      setResendIn(res.resendIn);
      setCode("");
      setStep("otp");
    } catch (e) {
      setError((e as Error).message);
      // Already sent recently: still let them enter the code they have.
      if (e instanceof FetchError && e.code === "RESEND_TOO_SOON") setStep("otp");
    } finally {
      setBusy(false);
    }
  }

  async function verify(value = code) {
    if (value.length !== 6 || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await api<{ next: string }>("/api/auth/verify-otp", { method: "POST", json: { phone, code: value } });
      const requested = sameOriginPath(params.get("next"));
      const dest = res.next === "/home" && requested ? requested : res.next;
      router.replace(dest);
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
      setCode("");
      otpRef.current?.focus();
      setBusy(false);
    }
  }

  return (
    <main className="flex flex-1 flex-col bg-white px-6 pb-8 pt-4">
      {step === "otp" && (
        <div className="flex h-12 items-center">
          <button onClick={() => { setStep("phone"); setError(null); }} className="-ml-1 grid h-11 w-11 place-items-center rounded-full bg-white shadow-card" aria-label={t.common.back}>
            <ChevronLeft className="h-6 w-6" />
          </button>
        </div>
      )}

      {step === "phone" ? (
        <form className="flex flex-1 flex-col" onSubmit={(e) => { e.preventDefault(); sendCode(); }}>
          <div className="-mx-6 -mt-4 rounded-b-[32px] bg-brand-deep px-6 pb-9 pt-6 text-white">
            <LogoMark className="h-11 w-11" />
            <h1 className="mt-8 text-[28px] font-extrabold leading-tight tracking-tight">{t.login.phoneTitle}</h1>
            <p className="mt-2 text-sm text-white/75">{t.login.phoneHint}</p>
          </div>

          <label htmlFor="phone" className="label mt-8">{t.login.phoneLabel}</label>
          <div className={`flex items-center rounded-2xl border bg-white transition focus-within:ring-4 ${error ? "border-red-400 focus-within:ring-red-100" : "border-line focus-within:border-accent focus-within:ring-accent/15"}`}>
            <span className="border-r border-line px-4 py-3 font-semibold text-ink-soft">+91</span>
            <input
              id="phone"
              type="tel"
              inputMode="numeric"
              autoComplete="tel-national"
              autoFocus
              placeholder="98765 43210"
              maxLength={10}
              value={phone}
              onChange={(e) => { setPhone(e.target.value.replace(/\D/g, "").slice(0, 10)); setError(null); }}
              className="w-full rounded-r-xl bg-transparent px-4 py-3 text-lg font-semibold tracking-wide outline-none placeholder:font-normal placeholder:text-ink-faint"
            />
          </div>
          {error && <p className="mt-2 text-sm text-red-600" role="alert">{error}</p>}

          <div className="flex-1" />
          <button type="submit" className="btn-primary w-full" disabled={busy || !phoneValid}>
            {busy && <Loader className="h-5 w-5" />}
            {t.login.sendCode}
          </button>
        </form>
      ) : (
        <form className="mt-6 flex flex-1 flex-col" onSubmit={(e) => { e.preventDefault(); verify(); }}>
          <h1 className="text-[28px] font-extrabold leading-tight tracking-tight">{t.login.otpTitle}</h1>
          <p className="mt-1.5 text-sm text-ink-soft">
            {t.login.otpSentTo(pretty)} ·{" "}
            <button type="button" className="font-semibold text-ink underline underline-offset-2" onClick={() => setStep("phone")}>
              {t.login.change}
            </button>
          </p>

          {/* One real input (works with SMS autofill), drawn as 6 boxes. */}
          <div className="relative mt-8" onClick={() => otpRef.current?.focus()}>
            <input
              ref={otpRef}
              aria-label="6-digit code"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={(e) => {
                const v = e.target.value.replace(/\D/g, "").slice(0, 6);
                setCode(v);
                setError(null);
                if (v.length === 6) verify(v);
              }}
              className="absolute inset-0 h-full w-full opacity-0"
            />
            <div className="grid grid-cols-6 gap-2" aria-hidden>
              {Array.from({ length: 6 }).map((_, i) => {
                const filled = i < code.length;
                const current = i === code.length;
                return (
                  <div
                    key={i}
                    className={`grid h-14 place-items-center rounded-2xl border bg-white text-2xl font-bold transition ${error ? "border-red-400" : current ? "border-accent ring-4 ring-accent/15" : filled ? "border-ink/30" : "border-line"}`}
                  >
                    {code[i] ?? ""}
                  </div>
                );
              })}
            </div>
          </div>
          {error && <p className="mt-3 text-sm text-red-600" role="alert">{error}</p>}

          <div className="mt-6 text-sm">
            {resendIn > 0 ? (
              <span className="text-ink-faint">{t.login.resendIn(resendIn)}</span>
            ) : (
              <button type="button" onClick={sendCode} disabled={busy} className="font-semibold text-accent">
                {t.login.resend}
              </button>
            )}
          </div>
          {process.env.NODE_ENV !== "production" && (
            <p className="mt-4 rounded-lg bg-white px-3 py-2 text-xs text-ink-soft ring-1 ring-line">{t.login.devHint}</p>
          )}

          <div className="flex-1" />
          <button type="submit" className="btn-primary w-full" disabled={busy || code.length !== 6}>
            {busy && <Loader className="h-5 w-5" />}
            {t.login.verify}
          </button>
        </form>
      )}
    </main>
  );
}
