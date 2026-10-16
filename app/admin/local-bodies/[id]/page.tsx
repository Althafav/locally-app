import { notFound } from "next/navigation";
import { adminGetLocalBody } from "@/lib/admin";
import { AssignmentEditor } from "./AssignmentEditor";

export default async function AdminLocalBodyPage({ params }: { params: Promise<{ id: string }> }) {
  const detail = await adminGetLocalBody(decodeURIComponent((await params).id));
  if (!detail) notFound();
  return <AssignmentEditor detail={detail} />;
}
