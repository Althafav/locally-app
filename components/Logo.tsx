export function LogoMark({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden>
      <rect width="40" height="40" rx="12" fill="#0B8746" />
      {/* pin with a roof line inside — a home on the map */}
      <path d="M20 9c-5.2 0-9 3.9-9 8.9 0 6.2 7.4 12.4 8.3 13.1a1.1 1.1 0 0 0 1.4 0c.9-.7 8.3-6.9 8.3-13.1C29 12.9 25.2 9 20 9Z" fill="#FFFFFF" />
      <path d="m15.5 19.2 4.5-3.7 4.5 3.7M17 18v4.4h6V18" stroke="#0B8746" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <LogoMark />
      <span className="text-xl font-extrabold tracking-tight">Locally</span>
    </div>
  );
}
