import Link from "next/link";
import { SearchX } from "lucide-react";
import { t } from "@/lib/i18n";

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 pb-16 text-center">
      <span className="grid h-16 w-16 place-items-center rounded-full bg-white ring-1 ring-line">
        <SearchX className="h-7 w-7 text-ink-faint" />
      </span>
      <h1 className="mt-4 text-lg font-semibold">{t.errors.notFoundTitle}</h1>
      <p className="mt-1 text-sm text-ink-soft">{t.errors.notFoundBody}</p>
      <Link href="/home" className="btn-primary mt-5">{t.errors.home}</Link>
    </main>
  );
}
