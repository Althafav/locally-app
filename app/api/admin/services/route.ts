import { handler, json, requireAdmin } from "@/lib/api";
import { adminListServices } from "@/lib/admin";

export const GET = handler(async () => {
  await requireAdmin();
  return json({ categories: await adminListServices() });
});
