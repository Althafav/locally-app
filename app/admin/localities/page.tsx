import { adminListLocalBodies } from "@/lib/admin";
import { db } from "@/lib/db";
import { LocalityList } from "./LocalityList";

export const metadata = { title: "Localities · Admin · Locally" };

export default async function AdminLocalitiesPage() {
  const [localBodies, totalServices] = await Promise.all([
    adminListLocalBodies(),
    db.service.count({ where: { isActive: true } }),
  ]);
  return <LocalityList localBodies={localBodies} totalServices={totalServices} />;
}
