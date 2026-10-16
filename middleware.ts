import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession, type SessionClaims } from "@/lib/session-token";

/**
 * Route guard (pages only; API routes check auth themselves):
 *   logged out              → /login
 *   logged in, no name      → /setup
 *   logged in, no location  → /location
 *   logged in on / or /login → wherever they should be
 *   /admin/*                → admins only (no name/location needed)
 */
const PUBLIC_ONLY = new Set(["/", "/login"]);

function nextStep(s: SessionClaims) {
  if (s.adm) return "/admin";
  if (!s.onb) return "/setup";
  if (!s.lb) return "/location";
  return "/home";
}

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const session = await verifySession(req.cookies.get(SESSION_COOKIE)?.value);
  const go = (path: string) => NextResponse.redirect(new URL(path, req.url));

  // The cookie can outlive its user (e.g. after `npm run db:reset`). Pages and
  // the client send them to /login?expired=1, which drops the cookie instead of
  // bouncing back to /home in a loop.
  if (pathname === "/login" && req.nextUrl.searchParams.has("expired")) {
    const res = NextResponse.next();
    res.cookies.delete(SESSION_COOKIE);
    return res;
  }

  if (PUBLIC_ONLY.has(pathname)) {
    return session ? go(nextStep(session)) : NextResponse.next();
  }

  if (!session) {
    const login = new URL("/login", req.url);
    if (pathname !== "/home") login.searchParams.set("next", pathname + search);
    return NextResponse.redirect(login);
  }

  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    return session.adm ? NextResponse.next() : go(nextStep(session));
  }

  if (!session.onb && pathname !== "/setup") return go("/setup");
  if (session.onb && !session.lb && pathname !== "/location") return go("/location");

  return NextResponse.next();
}

export const config = {
  // Everything except API routes, Next internals and static/PWA files.
  matcher: ["/((?!api|_next|icons|manifest.webmanifest|sw.js|favicon.ico|robots.txt).*)"],
};
