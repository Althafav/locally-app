/** DTOs shared by API routes and client components (client-safe, no Prisma imports). */

export type LocalBodyType = "CORPORATION" | "MUNICIPALITY" | "GRAMA_PANCHAYAT";

export type DistrictDTO = { id: string; name: string; nameMl: string; isActive: boolean };

export type LocalBodyDTO = {
  id: string;
  districtId: string;
  name: string;
  nameMl: string;
  type: LocalBodyType;
  blockName: string | null;
};

export type SavedLocation = LocalBodyDTO & { ward: string | null; landmark: string | null };

export type ServiceDTO = {
  id: string;
  categoryId: string;
  name: string;
  nameMl: string;
  description: string;
  durationMins: number;
  /** effective price in this local body (override or base) */
  price: number;
  available: boolean;
  /** current user already tapped "Notify me" for this service here */
  interested: boolean;
};

export type CategoryDTO = {
  id: string;
  name: string;
  nameMl: string;
  icon: string;
  services: ServiceDTO[];
};

export type ServicesResponse = {
  localBody: LocalBodyDTO;
  categories: CategoryDTO[];
  availableCount: number;
  /** user asked to be notified when anything launches here */
  notifyLaunch: boolean;
};

export type MeDTO = {
  id: string;
  phone: string;
  name: string | null;
  email: string | null;
  location: SavedLocation | null;
};

export type BookingStatus = "REQUESTED" | "CONFIRMED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

export const BOOKING_STATUSES = ["REQUESTED", "CONFIRMED", "IN_PROGRESS", "COMPLETED", "CANCELLED"] as const satisfies readonly BookingStatus[];

/** Allowed admin status changes. COMPLETED and CANCELLED are final. */
export const NEXT_STATUSES: Record<BookingStatus, BookingStatus[]> = {
  REQUESTED: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["IN_PROGRESS", "CANCELLED"],
  IN_PROGRESS: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
};

export type BookingDTO = {
  id: string;
  serviceId: string;
  serviceName: string;
  categoryIcon: string;
  localBodyName: string;
  date: string; // YYYY-MM-DD
  slot: string;
  address: string;
  price: number;
  status: BookingStatus;
  createdAt: string;
};

// ─── Admin ────────────────────────────────────────────────────

export type AdminServiceDTO = {
  id: string;
  name: string;
  basePrice: number;
  /** number of local bodies where it is assigned */
  assignedCount: number;
};

export type AdminCategoryDTO = { id: string; name: string; icon: string; services: AdminServiceDTO[] };

export type AdminLocalBodyDTO = LocalBodyDTO & { assignedCount: number };

export type AdminAssignmentDTO = {
  serviceId: string;
  name: string;
  basePrice: number;
  assigned: boolean;
  /** local price, or null to use basePrice */
  priceOverride: number | null;
};

export type AdminBookingDTO = BookingDTO & {
  localBodyId: string;
  customerName: string | null;
  customerPhone: string;
};

export type AdminDashboardDTO = {
  newBookings: number;
  /** oldest REQUESTED bookings first */
  waiting: AdminBookingDTO[];
  /** CONFIRMED / IN_PROGRESS jobs scheduled today or tomorrow (IST) */
  upcoming: AdminBookingDTO[];
  today: string; // YYYY-MM-DD (IST)
  stats: {
    bookingsThisWeek: number;
    bookingsLastWeek: number;
    completedValueThisMonth: number;
    customers: number;
    localitiesLive: number;
    localitiesTotal: number;
  };
  /** bookings created per IST day, oldest first, 14 entries */
  daily: { date: string; count: number }[];
  topLocalities: { id: string; name: string; count: number }[];
  /** "Notify me" taps for things not offered yet; serviceId null = "anything here" */
  unmetDemand: { localBodyId: string; localBodyName: string; serviceId: string | null; serviceName: string | null; count: number }[];
};

export type AdminLocalBodyDetail = {
  localBody: LocalBodyDTO;
  categories: { id: string; name: string; icon: string; services: AdminAssignmentDTO[] }[];
};
