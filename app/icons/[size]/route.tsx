import { ImageResponse } from "next/og";

/** PNG app icons generated at request time: /icons/192, /icons/512, /icons/180 (+ ?maskable=1). */
const SIZES = new Set([180, 192, 512]);

export async function GET(req: Request, { params }: { params: Promise<{ size: string }> }) {
  const size = Number((await params).size);
  if (!SIZES.has(size)) return new Response("Not found", { status: 404 });
  const maskable = new URL(req.url).searchParams.has("maskable");
  // Maskable icons need the artwork inside the central 80% safe zone.
  const art = Math.round(size * (maskable ? 0.5 : 0.62));

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center",
          background: "#0B8746", borderRadius: maskable ? 0 : size * 0.22,
        }}
      >
        <svg width={art} height={art} viewBox="11 9 18 22.5">
          <path d="M20 9c-5.2 0-9 3.9-9 8.9 0 6.2 7.4 12.4 8.3 13.1a1.1 1.1 0 0 0 1.4 0c.9-.7 8.3-6.9 8.3-13.1C29 12.9 25.2 9 20 9Z" fill="#FFFFFF" />
          <path d="m15.5 19.2 4.5-3.7 4.5 3.7M17 18v4.4h6V18" stroke="#0B8746" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    ),
    { width: size, height: size, headers: { "Cache-Control": "public, max-age=86400" } }
  );
}
