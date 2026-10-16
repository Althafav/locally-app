"use client";

import type { SavedLocation } from "./types";

export class FetchError extends Error {
  constructor(public status: number, message: string, public code?: string) {
    super(message);
  }
}

/** fetch + JSON with the API's `{ error }` shape turned into a FetchError. */
export async function api<T>(url: string, init?: RequestInit & { json?: unknown }): Promise<T> {
  const { json, ...rest } = init ?? {};
  const res = await fetch(url, {
    ...rest,
    headers: { ...(json !== undefined && { "Content-Type": "application/json" }), ...rest.headers },
    body: json !== undefined ? JSON.stringify(json) : rest.body,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && typeof window !== "undefined") window.location.href = "/login?expired=1";
    throw new FetchError(res.status, data.error ?? "Something went wrong.", data.code);
  }
  return data as T;
}

// ─── Location cache (localStorage) for instant first paint ───────────

const LOCATION_KEY = "locally.location";

export function readCachedLocation(): SavedLocation | null {
  try {
    const raw = localStorage.getItem(LOCATION_KEY);
    return raw ? (JSON.parse(raw) as SavedLocation) : null;
  } catch {
    return null;
  }
}

export function writeCachedLocation(loc: SavedLocation | null) {
  try {
    if (loc) localStorage.setItem(LOCATION_KEY, JSON.stringify(loc));
    else localStorage.removeItem(LOCATION_KEY);
  } catch {
    /* storage unavailable — fine, the server copy is the source of truth */
  }
}
