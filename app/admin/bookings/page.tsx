import { ADMIN_BOOKINGS_LIMIT, adminCountBookingsByStatus, adminListBookings } from "@/lib/admin";
import { db } from "@/lib/db";
import { BOOKING_STATUSES, type BookingStatus } from "@/lib/types";
import { BookingsBoard } from "./BookingsBoard";

export const metadata = { title: "Bookings · Admin · Locally" };

type Search = { status?: string; lb?: string };

export default async function AdminBookingsPage({ searchParams }: { searchParams: Promise<Search> }) {
  const params = await searchParams;
  const status = BOOKING_STATUSES.find((s) => s === params.status) as BookingStatus | undefined;
  const localBodyId = params.lb || undefined;

  const [bookings, counts, localBodies] = await Promise.all([
    adminListBookings({ status, localBodyId }),
    adminCountBookingsByStatus(localBodyId),
    db.localBody.findMany({ where: { isActive: true }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <BookingsBoard
      bookings={bookings}
      counts={counts}
      localBodies={localBodies}
      status={status ?? null}
      localBodyId={localBodyId ?? null}
      limit={ADMIN_BOOKINGS_LIMIT}
    />
  );
}
