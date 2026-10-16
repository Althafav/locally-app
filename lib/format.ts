/** Client-safe formatting + booking-calendar helpers. All dates are Asia/Kolkata. */

export const rupees = (n: number) => `₹${n.toLocaleString("en-IN")}`;

export function duration(mins: number) {
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h} hr ${m} min` : `${h} hr${h > 1 ? "s" : ""}`;
}

export const TIME_SLOTS = [
  { id: "08:00-10:00", label: "8 – 10 AM", startHour: 8 },
  { id: "10:00-12:00", label: "10 – 12 PM", startHour: 10 },
  { id: "12:00-14:00", label: "12 – 2 PM", startHour: 12 },
  { id: "14:00-16:00", label: "2 – 4 PM", startHour: 14 },
  { id: "16:00-18:00", label: "4 – 6 PM", startHour: 16 },
] as const;

export const BOOKING_DAYS_AHEAD = 7;
/** A slot must start at least this many hours from now. */
export const MIN_LEAD_HOURS = 2;

const IST_OFFSET_MIN = 330;

/** Current wall-clock time in IST, as a Date whose UTC fields read as IST. */
function istNow(now = new Date()) {
  return new Date(now.getTime() + IST_OFFSET_MIN * 60_000);
}

/** YYYY-MM-DD for today in IST. */
export function istToday(now = new Date()) {
  return istNow(now).toISOString().slice(0, 10);
}

export function addDays(ymd: string, days: number) {
  const d = new Date(`${ymd}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Is this date + slot still bookable right now? */
export function isSlotOpen(ymd: string, slotId: string, now = new Date()) {
  const slot = TIME_SLOTS.find((s) => s.id === slotId);
  if (!slot) return false;
  const today = istToday(now);
  if (ymd < today || ymd > addDays(today, BOOKING_DAYS_AHEAD - 1)) return false;
  if (ymd > today) return true;
  const nowHour = istNow(now).getUTCHours() + istNow(now).getUTCMinutes() / 60;
  return slot.startHour - nowHour >= MIN_LEAD_HOURS;
}

export function dayLabel(ymd: string, today = istToday()) {
  if (ymd === today) return "Today";
  if (ymd === addDays(today, 1)) return "Tomorrow";
  return new Date(`${ymd}T00:00:00Z`).toLocaleDateString("en-IN", { weekday: "short", timeZone: "UTC" });
}

export function prettyDate(ymd: string) {
  return new Date(`${ymd}T00:00:00Z`).toLocaleDateString("en-IN", {
    weekday: "short", day: "numeric", month: "short", timeZone: "UTC",
  });
}

export function slotLabel(slotId: string) {
  return TIME_SLOTS.find((s) => s.id === slotId)?.label ?? slotId;
}
