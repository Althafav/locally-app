import "server-only";
import { cookies } from "next/headers";
import type { NextResponse } from "next/server";
import type { User } from "@prisma/client";
import { db } from "./db";
import { SESSION_COOKIE, SESSION_MAX_AGE, signSession, verifySession, type SessionClaims } from "./session-token";

export async function getSession(): Promise<SessionClaims | null> {
  const store = await cookies();
  return verifySession(store.get(SESSION_COOKIE)?.value);
}

/** Current user from the DB, or null. Use in API routes and server components. */
export async function getCurrentUser(): Promise<User | null> {
  const session = await getSession();
  if (!session) return null;
  return db.user.findUnique({ where: { id: session.sub } });
}

/** (Re)issue the session cookie from the user's current DB state. */
export async function setSessionCookie(res: NextResponse, user: Pick<User, "id" | "name" | "localBodyId" | "role">) {
  const token = await signSession({ sub: user.id, onb: !!user.name, lb: user.localBodyId, adm: user.role === "ADMIN" });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export function clearSessionCookie(res: NextResponse) {
  res.cookies.set(SESSION_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
}
