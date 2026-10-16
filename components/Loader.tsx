import { t } from "@/lib/i18n";

/**
 * Inline busy indicator: three dots in a travelling wave, drawn in `currentColor`
 * so it takes the colour of the button or text it sits in. Size it like an icon.
 */
export function Loader({ className = "h-5 w-5", label = t.common.loading }: { className?: string; label?: string }) {
  return (
    <span role="status" className="inline-flex shrink-0">
      <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
        <circle className="loader-dot" cx="4" cy="12" r="3" />
        <circle className="loader-dot [animation-delay:120ms]" cx="12" cy="12" r="3" />
        <circle className="loader-dot [animation-delay:240ms]" cx="20" cy="12" r="3" />
      </svg>
      <span className="sr-only">{label}</span>
    </span>
  );
}

/**
 * Full-area loader for route transitions: the Locally pin hops over the map
 * while a ripple spreads from where it lands.
 */
export function PageLoader({ label = t.common.loading }: { label?: string }) {
  return (
    <div role="status" className="flex flex-1 flex-col items-center justify-center gap-5 py-24">
      <div className="relative flex h-24 w-24 items-end justify-center">
        <span className="loader-ripple absolute bottom-1 h-5 w-16 rounded-[50%] border-2 border-accent/40" />
        <span className="loader-shadow absolute bottom-2 h-2 w-8 rounded-[50%] bg-ink/15" />
        <svg viewBox="0 0 40 40" className="loader-pin relative mb-3 h-14 w-14 drop-shadow-sm" aria-hidden>
          <path
            d="M20 3C12.8 3 7.5 8.4 7.5 15.3c0 8.6 10.2 17.2 11.5 18.2a1.6 1.6 0 0 0 2 0c1.3-1 11.5-9.6 11.5-18.2C32.5 8.4 27.2 3 20 3Z"
            className="fill-accent"
          />
          <path
            d="m13.8 17.2 6.2-5.1 6.2 5.1M15.8 15.6v6.1h8.4v-6.1"
            stroke="#fff"
            strokeWidth="2.2"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <p className="loader-label text-sm font-semibold text-ink-soft">{label}</p>
    </div>
  );
}
