import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Noto_Sans_Malayalam } from "next/font/google";
import { ServiceWorker } from "@/components/ServiceWorker";
import "./globals.css";

const sans = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const ml = Noto_Sans_Malayalam({ subsets: ["malayalam"], variable: "--font-ml", display: "swap", weight: ["400", "500", "600"] });

export const metadata: Metadata = {
  title: "Locally — home services near you",
  description: "Book trusted cleaners, electricians, plumbers and more from your own panchayat. Now in Kannur.",
  applicationName: "Locally",
  appleWebApp: { capable: true, title: "Locally", statusBarStyle: "default" },
  icons: { icon: "/icons/192", apple: "/icons/180" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#064E3B",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${ml.variable}`}>
      <body>
        {/* Phone-width shell; on desktop it's a centred column. */}
        <div className="relative mx-auto flex min-h-dvh max-w-[430px] flex-col bg-paper shadow-[0_0_0_1px_rgba(0,0,0,0.04)] md:shadow-xl">
          {children}
        </div>
        <ServiceWorker />
      </body>
    </html>
  );
}
