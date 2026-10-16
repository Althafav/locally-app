import Link from "next/link";
import { Logo } from "@/components/Logo";
import { ServiceIcon } from "@/components/ServiceIcon";
import { t } from "@/lib/i18n";

const TILES = [
  { icon: "cleaning", label: "Cleaning" },
  { icon: "coconut", label: "Coconut climbing" },
  { icon: "electrician", label: "Electrician" },
  { icon: "well", label: "Well cleaning" },
  { icon: "plumber", label: "Plumber" },
  { icon: "ac", label: "AC service" },
];

export default function WelcomePage() {
  return (
    <main className="flex flex-1 flex-col px-6 pb-8 pt-6">
      <section className="-mx-6 -mt-6 rounded-b-[36px] bg-brand-deep px-6 pb-8 pt-6 text-white">
        <Logo />
        <div className="mt-8 grid grid-cols-3 gap-2.5">
          {TILES.map((tile, i) => (
            <div
              key={tile.icon}
              className={`flex aspect-square flex-col items-center justify-center gap-2 rounded-2xl ${i === 1 ? "bg-accent-bright" : "bg-white/10"}`}
            >
              <ServiceIcon icon={tile.icon} className="h-7 w-7 text-white" />
              <span className="px-1 text-center text-[11px] font-semibold leading-tight text-white/85">{tile.label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-8 flex-1">
        <p className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-accent-tint px-3 py-1 text-xs font-bold text-accent-dark">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" /> Now live in Kannur · <span className="font-ml font-medium">കണ്ണൂർ</span>
        </p>
        <h1 className="text-[28px] font-extrabold leading-[1.15] tracking-tight">{t.welcome.title}</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-ink-soft">{t.welcome.body}</p>
      </section>

      <Link href="/login" className="btn-primary mt-8 w-full">
        {t.welcome.cta}
      </Link>
    </main>
  );
}
