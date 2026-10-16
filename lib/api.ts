import "server-only";
import { NextResponse } from "next/server";
import type { ZodSchema } from "zod";
import type { User } from "@prisma/client";
import { getCurrentUser } from "./auth";

export class ApiError extends Error {
  constructor(public status: number, message: string, public code?: string) {
    super(message);
  }
}

export const json = <T>(data: T, init?: ResponseInit) => NextResponse.json(data, init);

/** Wrap a route handler: converts ApiError / unknown errors to JSON responses. */
export function handler<A extends unknown[]>(fn: (...args: A) => Promise<Response>) {
  return async (...args: A): Promise<Response> => {
    try {
      return await fn(...args);
    } catch (e) {
      if (e instanceof ApiError) return json({ error: e.message, code: e.code }, { status: e.status });
      console.error(e);
      return json({ error: "Something went wrong. Please try again." }, { status: 500 });
    }
  };
}

export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) throw new ApiError(401, "Please log in again.", "UNAUTHENTICATED");
  return user;
}

export async function requireAdmin(): Promise<User> {
  const user = await requireUser();
  if (user.role !== "ADMIN") throw new ApiError(403, "Only admins can do that.", "FORBIDDEN");
  return user;
}

export async function parseBody<T>(req: Request, schema: ZodSchema<T>): Promise<T> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    throw new ApiError(400, "Invalid request body.");
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) throw new ApiError(400, parsed.error.issues[0]?.message ?? "Invalid input.", "VALIDATION");
  return parsed.data;
}
