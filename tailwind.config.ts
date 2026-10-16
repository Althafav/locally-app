import type { Config } from "tailwindcss";

// Super-app look: one bold leaf green on white cards over a cool grey page.
// `accent` is the action colour (primary buttons, active nav, selected states);
// `brand.deep` is the dark green behind hero bands and the admin header.
// accent DEFAULT keeps white 15px text at AA contrast — don't lighten it.
export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#F4F5F7",
        // A step deeper than paper, for app chrome that sits around content (desktop backdrop, admin bottom bar).
        shell: "#ECEEF1",
        ink: { DEFAULT: "#111827", soft: "#4B5563", faint: "#9CA3AF" },
        line: "#E5E7EB",
        accent: { DEFAULT: "#0B8746", dark: "#086B37", bright: "#13B85F", tint: "#E7F7EE" },
        brand: { deep: "#064E3B" },
        leaf: "#0B8746",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "var(--font-ml)", "system-ui", "sans-serif"],
        ml: ["var(--font-ml)", "var(--font-sans)", "sans-serif"],
      },
      borderRadius: { xl2: "1.25rem" },
      boxShadow: {
        card: "0 1px 2px rgba(16,24,40,0.06), 0 4px 12px -4px rgba(16,24,40,0.08)",
        lift: "0 8px 24px -8px rgba(16,24,40,0.18)",
        bar: "0 -4px 16px -6px rgba(16,24,40,0.10)",
        cta: "0 8px 18px -8px rgba(11,135,70,0.65)",
      },
      keyframes: {
        "sheet-up": { from: { transform: "translateY(100%)" }, to: { transform: "translateY(0)" } },
        "fade-in": { from: { opacity: "0" }, to: { opacity: "1" } },
      },
      animation: {
        "sheet-up": "sheet-up 220ms cubic-bezier(.2,.8,.2,1)",
        "fade-in": "fade-in 160ms ease-out",
      },
    },
  },
  plugins: [],
} satisfies Config;
