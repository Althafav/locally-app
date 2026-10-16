/**
 * Session JWT — edge-safe (used by middleware.ts and server code).
 * Kept tiny: only what the route guard needs, so it never has to hit the DB.
 */
import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "locally_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export type SessionClaims = {
  sub: string; // user id
  /** user has completed the name step */
  onb: boolean;
  /** selected local body id, or null if location not chosen yet */
  lb: string | null;
  /** user is an admin (pages only; API routes re-check the DB role) */
  adm: boolean;
};

function secret() {
  const s = process.env.JWT_SECRET;
  if (!s || s.length < 16) throw new Error("JWT_SECRET is missing or too short (see .env.example)");
  return new TextEncoder().encode(s);
}

export async function signSession(claims: SessionClaims): Promise<string> {
  return new SignJWT({ onb: claims.onb, lb: claims.lb, adm: claims.adm })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(claims.sub)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(secret());
}

export async function verifySession(token: string | undefined): Promise<SessionClaims | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret(), { algorithms: ["HS256"] });
    if (typeof payload.sub !== "string") return null;
    return {
      sub: payload.sub,
      onb: payload.onb === true,
      lb: typeof payload.lb === "string" ? payload.lb : null,
      adm: payload.adm === true,
    };
  } catch {
    return null;
  }
}
