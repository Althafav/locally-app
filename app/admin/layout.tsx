import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { adminCountNewBookings } from "@/lib/admin";
import { formatPhone } from "@/lib/phone";
import { AdminHeader } from "./AdminHeader";
import { AdminNav } from "./AdminNav";

export const metadata = { title: "Admin · Locally" };

/** The middleware only checks the session claim; re-check the DB role here. */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?expired=1");
  if (user.role !== "ADMIN") redirect("/home");
  const newBookings = await adminCountNewBookings();

  return (
    <div className="flex flex-1 flex-col pb-[88px]">
      <AdminHeader name={user.name} phone={formatPhone(user.phone)} />
      {children}
      <AdminNav newBookings={newBookings} />
    </div>
  );
}
