import { handler, json, ApiError } from "@/lib/api";
import { listLocalBodies } from "@/lib/locations";

export const GET = handler(async (req: Request) => {
  const url = new URL(req.url);
  const districtId = url.searchParams.get("districtId");
  if (!districtId) throw new ApiError(400, "districtId is required.");
  return json({ localBodies: await listLocalBodies(districtId, url.searchParams.get("q") ?? undefined) });
});
