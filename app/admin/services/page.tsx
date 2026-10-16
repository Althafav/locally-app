import { adminListServices } from "@/lib/admin";
import { ServicePrices } from "./ServicePrices";

export const metadata = { title: "Services · Admin · Locally" };

export default async function AdminServicesPage() {
  return <ServicePrices categories={await adminListServices()} />;
}
