import { notFound, redirect } from "next/navigation";
import { BackHeader } from "@/components/BackHeader";
import { getCurrentUser } from "@/lib/auth";
import { getServiceIn } from "@/lib/catalog";
import { db } from "@/lib/db";
import { t } from "@/lib/i18n";
import { BookingForm } from "./BookingForm";

export default async function BookPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login?expired=1");
  if (!user.localBodyId) redirect("/location");
  const [svc, localBody] = await Promise.all([
    getServiceIn(id, user.localBodyId),
    db.localBody.findUnique({ where: { id: user.localBodyId } }),
  ]);
  if (!svc) notFound();
  if (!svc.available) redirect(`/services/${id}`);

  // Prefill from the saved location so the user only adds their house name.
  const addressHint = [user.landmark && `Near ${user.landmark}`, user.ward && `Ward ${user.ward}`].filter(Boolean).join(", ");

  return (
    <main className="flex flex-1 flex-col">
      <BackHeader title={`${t.booking.title}: ${svc.service.name}`} fallback={`/services/${id}`} />
      <BookingForm
        serviceId={svc.service.id}
        price={svc.price}
        localBodyName={localBody?.name ?? ""}
        initialAddress={addressHint}
      />
    </main>
  );
}
