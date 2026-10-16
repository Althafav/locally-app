import { handler, json } from "@/lib/api";
import { listDistricts } from "@/lib/locations";

export const GET = handler(async () => json({ districts: await listDistricts() }));
