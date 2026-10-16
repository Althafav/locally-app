"use client";

import { useEffect } from "react";
import { t } from "@/lib/i18n";
import "./globals.css";

// Replaces the root layout when it throws, so it renders its own <html>/<body>.
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <main className="mx-auto flex min-h-dvh max-w-[430px] flex-col items-center justify-center bg-paper px-6 text-center">
          <h1 className="text-lg font-semibold">{t.errors.title}</h1>
          <p className="mt-1 text-sm text-ink-soft">{t.errors.body}</p>
          <button className="btn-primary mt-5" onClick={reset}>{t.errors.retry}</button>
        </main>
      </body>
    </html>
  );
}
