"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";
import { Loader } from "@/components/Loader";
import { api, writeCachedLocation } from "@/lib/client";
import { t } from "@/lib/i18n";

export function LogoutButton({ compact = false }: { compact?: boolean }) {
  const [busy, setBusy] = useState(false);
  async function logout() {
    setBusy(true);
    await api("/api/auth/logout", { method: "POST" }).catch(() => {});
    writeCachedLocation(null);
    window.location.href = "/";
  }
  if (compact) {
    return (
      <button
        onClick={logout}
        disabled={busy}
        className="flex min-h-[48px] w-full items-center gap-3 rounded-xl px-3 text-left text-[15px] font-semibold text-red-700 outline-none hover:bg-red-50 focus-visible:ring-2 focus-visible:ring-red-700/30 disabled:opacity-50"
      >
        {busy ? <Loader className="h-[18px] w-[18px]" /> : <LogOut className="h-[18px] w-[18px]" />}
        {t.profile.logout}
      </button>
    );
  }
  return (
    <button onClick={logout} disabled={busy} className="btn-secondary mt-4 w-full !ring-red-100 text-red-700">
      {busy ? <Loader className="h-5 w-5" /> : <LogOut className="h-5 w-5" />}
      {t.profile.logout}
    </button>
  );
}
