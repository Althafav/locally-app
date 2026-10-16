"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader } from "@/components/Loader";
import { api } from "@/lib/client";
import { t } from "@/lib/i18n";
import type { MeDTO } from "@/lib/types";

/** New-user step: name (required) + email (optional). */
export default function SetupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return setError(t.setup.nameRequired);
    setBusy(true);
    setError(null);
    try {
      const { user } = await api<{ user: MeDTO }>("/api/me", { method: "PATCH", json: { name: name.trim(), email: email.trim() } });
      router.replace(user.location ? "/home" : "/location");
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <main className="flex flex-1 flex-col px-6 pb-8 pt-16">
      <form onSubmit={submit} className="flex flex-1 flex-col">
        <p className="inline-flex w-fit rounded-full bg-accent-tint px-3 py-1 text-xs font-bold text-accent-dark">Welcome to Locally</p>
        <h1 className="mt-3 text-[28px] font-extrabold leading-tight tracking-tight">{t.setup.title}</h1>

        <label htmlFor="name" className="label mt-8">{t.setup.nameLabel}</label>
        <input id="name" className="field" autoFocus autoComplete="name" maxLength={60} value={name} onChange={(e) => { setName(e.target.value); setError(null); }} />

        <label htmlFor="email" className="label mt-5">{t.setup.emailLabel}</label>
        <input id="email" type="email" className="field" autoComplete="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} />

        {error && <p className="mt-3 text-sm text-red-600" role="alert">{error}</p>}
        <div className="flex-1" />
        <button type="submit" className="btn-primary w-full" disabled={busy}>
          {busy && <Loader className="h-5 w-5" />}
          {t.setup.continue}
        </button>
      </form>
    </main>
  );
}
