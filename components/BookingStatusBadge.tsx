import { t } from "@/lib/i18n";
import type { BookingStatus } from "@/lib/types";

const STATUS_STYLE: Record<BookingStatus, string> = {
  REQUESTED: "bg-amber-50 text-amber-800 ring-amber-200/70",
  CONFIRMED: "bg-accent-tint text-accent-dark ring-accent/20",
  IN_PROGRESS: "bg-sky-50 text-sky-800 ring-sky-200/70",
  COMPLETED: "bg-gray-100 text-ink-soft ring-transparent",
  CANCELLED: "bg-red-50 text-red-700 ring-red-200/70",
};

export function BookingStatusBadge({ status }: { status: BookingStatus }) {
  return (
    <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ${STATUS_STYLE[status]}`}>
      {t.bookings.status[status]}
    </span>
  );
}
