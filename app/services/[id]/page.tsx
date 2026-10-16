import Link from "next/link";
import { notFound } from "next/navigation";
import { Check, Clock, MapPin } from "lucide-react";
import { BackHeader } from "@/components/BackHeader";
import { NotifyButton } from "@/components/NotifyButton";
import { ServiceIcon } from "@/components/ServiceIcon";
import { getCurrentUser } from "@/lib/auth";
import { getServiceIn } from "@/lib/catalog";
import { db } from "@/lib/db";
import { duration, rupees } from "@/lib/format";
import { t } from "@/lib/i18n";

export default async function ServicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  const [svc, localBody, interest] = await Promise.all([
    getServiceIn(id, user?.localBodyId ?? null),
    user?.localBodyId ? db.localBody.findUnique({ where: { id: user.localBodyId } }) : null,
    user?.localBodyId ? db.serviceInterest.findFirst({ where: { userId: user.id, serviceId: id, localBodyId: user.localBodyId } }) : null,
  ]);
  if (!svc) notFound();
  const { service, available, price, inclusions } = svc;
  const place = localBody?.name ?? "";

  return (
    <main className="flex flex-1 flex-col pb-28">
      <BackHeader />

      <section className="px-5">
        <div className={`grid h-44 place-items-center rounded-[28px] ${available ? "bg-brand-deep text-white" : "bg-gray-200/70 text-ink-faint"}`}>
          <ServiceIcon icon={service.category.icon} className="h-16 w-16" strokeWidth={1.25} />
        </div>
        <p className="mt-5 inline-flex rounded-full bg-accent-tint px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-accent-dark">{service.category.name}</p>
        <h1 className="mt-2 text-[26px] font-extrabold leading-tight tracking-tight">{service.name}</h1>
        <p className="font-ml text-sm text-ink-soft">{service.nameMl}</p>

        <div className="mt-5 grid grid-cols-2 gap-2.5">
          <div className="card p-4">
            <p className="text-xs text-ink-soft">{t.service.startingAt}</p>
            <p className="mt-0.5 text-xl font-extrabold text-accent">{rupees(price)}</p>
          </div>
          <div className="card p-4">
            <p className="text-xs text-ink-soft">{t.service.duration}</p>
            <p className="mt-0.5 flex items-center gap-1.5 text-xl font-extrabold"><Clock className="h-4 w-4 text-ink-soft" />{duration(service.durationMins)}</p>
          </div>
        </div>

        <p className="mt-5 text-[15px] leading-relaxed text-ink-soft">{service.description}</p>

        {inclusions.length > 0 && (
          <>
            <h2 className="mt-6 text-[17px] font-extrabold tracking-tight">{t.service.included}</h2>
            <ul className="card mt-2.5 space-y-3 p-4">
              {inclusions.map((item) => (
                <li key={item} className="flex gap-2.5 text-[15px]">
                  <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-accent text-white"><Check className="h-3.5 w-3.5" strokeWidth={3} /></span>
                  {item}
                </li>
              ))}
            </ul>
          </>
        )}
        <p className="mt-6 text-xs leading-relaxed text-ink-faint">{t.service.priceNote}</p>
      </section>

      {/* Sticky action */}
      <div className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-[430px] bg-white px-5 pb-safe pt-3 shadow-bar">
        <div className="pb-3">
          {available ? (
            <Link href={`/services/${service.id}/book`} className="btn-primary w-full">
              {t.service.book} · {rupees(price)}
            </Link>
          ) : (
            <div className="space-y-2">
              <p className="flex items-center justify-center gap-1.5 text-sm font-medium text-ink-soft">
                <MapPin className="h-4 w-4" /> {t.service.notAvailable(place)}
              </p>
              {user?.localBodyId && (
                <NotifyButton serviceId={service.id} localBodyId={user.localBodyId} initial={!!interest} size="lg" />
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
