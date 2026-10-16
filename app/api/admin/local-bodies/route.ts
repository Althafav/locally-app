import { handler, json, requireAdmin } from "@/lib/api";
import { adminListLocalBodies } from "@/lib/admin";

export const GET = handler(async () => {
  await requireAdmin();
  return json({ localBodies: await adminListLocalBodies() });
});
