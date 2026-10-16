import { handler, json, requireAdmin, ApiError } from "@/lib/api";
import { adminGetLocalBody } from "@/lib/admin";

export const GET = handler(async (_req: Request, { params }: { params: Promise<{ id: string }> }) => {
  await requireAdmin();
  const detail = await adminGetLocalBody((await params).id);
  if (!detail) throw new ApiError(404, "Local body not found.", "LOCAL_BODY_NOT_FOUND");
  return json(detail);
});
