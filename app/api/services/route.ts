import { handler, json, ApiError } from "@/lib/api";
import { getSession } from "@/lib/auth";
import { getCatalog } from "@/lib/catalog";

/** GET /api/services?localBodyId= → categories with services flagged `available`. */
export const GET = handler(async (req: Request) => {
  const localBodyId = new URL(req.url).searchParams.get("localBodyId");
  if (!localBodyId) throw new ApiError(400, "localBodyId is required.");
  const session = await getSession();
  return json(await getCatalog(localBodyId, session?.sub));
});
