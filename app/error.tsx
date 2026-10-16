"use client";

import { useEffect } from "react";
import Link from "next/link";
import { TriangleAlert } from "lucide-react";
import { t } from "@/lib/i18n";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 pb-16 text-center">
      <span className="grid h-16 w-16 place-items-center rounded-full bg-white ring-1 ring-line">
        <TriangleAlert className="h-7 w-7 text-ink-faint" />
      </span>
      <h1 className="mt-4 text-lg font-semibold">{t.errors.title}</h1>
      <p className="mt-1 text-sm text-ink-soft">{t.errors.body}</p>
      <div className="mt-5 flex gap-2">
        <button className="btn-primary" onClick={reset}>{t.errors.retry}</button>
        <Link href="/home" className="btn-secondary">{t.errors.home}</Link>
      </div>
    </main>
  );
}
