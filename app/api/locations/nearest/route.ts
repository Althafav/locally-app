import { handler, json, ApiError } from "@/lib/api";
import { findNearest } from "@/lib/locations";

export const GET = handler(async (req: Request) => {
  const url = new URL(req.url);
  const lat = Number(url.searchParams.get("lat"));
  const lng = Number(url.searchParams.get("lng"));
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
    throw new ApiError(400, "lat and lng are required.");
  }
  const nearest = await findNearest(lat, lng);
  if (!nearest) throw new ApiError(404, "No active locations yet.");
  return json(nearest);
});
