# Locally — MVP

Mobile-first home-services booking app (PWA) for Kerala, launching in **Kannur district**.
Users log in with their phone number, pick their **local body** (corporation / municipality / grama panchayat),
and see which services are bookable there.

Stack: Next.js 15 (App Router) · TypeScript · Tailwind CSS · Prisma on PostgreSQL (Prisma Postgres) · JWT session cookie (`jose`).

## Setup

```bash
npm install                 # also runs `prisma generate`
cp .env.example .env        # then set DATABASE_URL and a long random JWT_SECRET
npx prisma migrate dev      # applies migrations to the database
npm run seed                # districts, Kannur local bodies, services, availability
npm run dev                 # http://localhost:3000
```

> npm 11 may hold back install scripts for `prisma`, `@prisma/engines`, `@prisma/client` and `esbuild`.
> They are approved in `package.json#allowScripts`; if you see a warning, run `npm approve-scripts` for those packages.

Other scripts: `npm run typecheck`, `npm run build`, `npm run db:reset` (wipe + migrate + seed).

### Try it

1. Open the app on a phone-sized window → **Get started**.
2. Enter any valid Indian mobile number (10 digits starting 6–9), e.g. `98765 43210`.
3. Enter OTP **`123456`**.
4. New user → enter a name → choose a location.
5. Compare locations from the location chip on Home:
   - **Kannur Corporation**: all 28 services (some with local prices)
   - **Thalassery / Payyannur …**: most services
   - **Pinarayi, Mayyil, Narath …**: 3–5 services
   - **Chokli, Kunnothuparamba**: nothing yet (shows the "not here yet / Notify me" state)

## How the mock OTP works

- `POST /api/auth/send-otp` validates the number, rate-limits (30 s resend, 5/hour in production),
  stores an **HMAC hash** of the code in `OtpRequest` (5-minute expiry) and hands it to the SMS provider.
- In development (`NODE_ENV !== "production"`) the code is always **`123456`**, and the console provider
  prints it to the server terminal: `[sms:console] OTP for +919876543210: 123456`.
- In production, set `NEXT_PUBLIC_DEMO_OTP=123456` to use a fixed code there too (demo mode; anyone can
  log in as any number). Unset it once real SMS works.
- `POST /api/auth/verify-otp` allows 5 attempts per code, then creates the user if new and sets an
  httpOnly `locally_session` JWT cookie (30 days).
- To send real SMS, set `SMS_PROVIDER=msg91`, `MSG91_AUTH_KEY` and `MSG91_TEMPLATE_ID` (a DLT-registered
  OTP template containing `##OTP##`). Twilio in [`lib/sms.ts`](lib/sms.ts) is still a stub.

## Route guard

[`middleware.ts`](middleware.ts) reads the session JWT (no DB hit):
logged out → `/login` · no name yet → `/setup` · no location yet → `/location` · logged in on `/` or `/login` → `/home`.
The JWT carries `onb` (has name), `lb` (local body id) and `adm` (admin); it is re-issued whenever those change.

## Admin

Admins manage the catalogue at `/admin`. The service list itself (names, icons, categories) is fixed and comes from
`prisma/seed/services.json`; admins can:

- **Dashboard** (`/admin`, the landing page) — bookings waiting for confirmation (oldest first), headline numbers
  (bookings in the last 7 days vs the 7 before, completed value this month, customers, localities live), new
  bookings per day for 14 days, jobs confirmed for today and tomorrow, "Notify me" requests for services not offered
  yet, and the busiest localities. Rows link into the tabs below. Data comes from `adminDashboard()` in `lib/admin.ts`.
- **Bookings tab** — every customer's bookings, newest first (latest 100), filterable by status and local body,
  with the customer's name and tap-to-call phone. Admins move a booking Requested → Confirmed → In progress →
  Completed, or cancel it (Completed and Cancelled are final; see `NEXT_STATUSES` in `lib/types.ts`). The tab shows
  a count of Requested bookings, and customers see the new status under My bookings.
- **Services tab** — change each service's base price.
- **Localities tab** (`/admin/localities`) — pick a corporation, municipality or panchayat, switch services on or off there, and set a
  local price (blank = base price). Switching a service off keeps its local price for when it is switched back on.

To make someone an admin, add their mobile number to `ADMIN_PHONES` in `.env` (comma-separated, e.g.
`ADMIN_PHONES="9876543210,9123456789"`). They become `ADMIN` the next time they log in and land on `/admin`.
Removing a number does not demote; set `User.role` back to `USER` in the database for that. Admin API routes live
under `/api/admin/*` and check the role in the DB (`requireAdmin()`), not just the JWT.

## Adding a district / local body and turning on services

All seed data lives in [`prisma/seed/`](prisma/seed) and `npm run seed` is idempotent (upserts).
Once the database has availability rows, the seed leaves availability and base prices alone so admin edits survive;
`npm run seed -- --reset-availability` rebuilds availability from `availability.json` (discarding admin changes).

**Add local bodies to Kannur** — append to `prisma/seed/kannur-local-bodies.json`:

```json
{ "id": "kannur.kathiroor", "name": "Kathiroor", "nameMl": "കതിരൂർ", "type": "GRAMA_PANCHAYAT",
  "blockName": "Thalassery", "lat": 11.78, "lng": 75.53 }
```

`type` is `CORPORATION`, `MUNICIPALITY` or `GRAMA_PANCHAYAT`. `lat`/`lng` is an approximate centroid used for
"use my current location". TODO: the file has 21 of Kannur's 71 grama panchayats — complete it (and verify the
Malayalam names) from the official LSG Kerala list.

**Turn on services there** — edit `prisma/seed/availability.json`:

- Corporations get every service automatically.
- Municipalities get every service except `municipalityExcept` and their entry in `municipalityExtraExcept`.
- Grama panchayats get exactly the service ids listed under `panchayats["<local body id>"]`.
- `priceOverrides["<local body id>"]["<service id>"]` sets a local price (otherwise `Service.basePrice`).

Then run `npm run seed -- --reset-availability` (or assign them in `/admin`).

**Activate a new district** (e.g. Kozhikode):

1. Set `"isActive": true` for it in `prisma/seed/districts.json`.
2. Create `prisma/seed/kozhikode-local-bodies.json` (same shape as the Kannur file, `"districtId": "kozhikode"`, ids like `kozhikode.<slug>`).
3. Add the file name to `LOCAL_BODY_FILES` in [`prisma/seed.ts`](prisma/seed.ts).
4. Add availability entries, then `npm run seed`.

Inactive districts appear in the picker as "Coming soon". Individual local bodies can be hidden with `LocalBody.isActive = false`.

**Add a service** — add it to a category in `prisma/seed/services.json` (new categories need an `icon` key mapped in
[`components/ServiceIcon.tsx`](components/ServiceIcon.tsx)), then list it in `availability.json`.

## Database

The app runs on Prisma Postgres. Create a database in the [Prisma console](https://console.prisma.io), copy its direct
`postgres://` connection string into `DATABASE_URL`, then run `npx prisma migrate dev` and `npm run seed`.
Use a separate database for local dev and production. On Vercel, set `DATABASE_URL` in the project's environment
variables and apply migrations with `npx prisma migrate deploy`.

## Project structure

```
app/
  page.tsx                  Welcome / splash
  login/                    Phone → OTP
  setup/                    New user: name (+ optional email)
  location/                 Required location step (also "change location" from Profile)
  (main)/                   Screens with bottom nav
    home/                   Location chip, search, categories, available / coming-soon services
    bookings/  profile/
  services/[id]/            Service detail → book/ (date, slot, address)
  api/                      Route handlers (thin — logic lives in lib/)
  manifest.ts  icons/[size] PWA manifest and generated PNG icons
components/                 LocationPicker, BottomSheet, BottomNav, NotifyButton, ServiceIcon …
lib/
  auth.ts session-token.ts  Session cookie (JWT) helpers; session-token is edge-safe for middleware
  otp.ts sms.ts phone.ts    OTP flow, SMS provider interface, Indian mobile validation
  locations.ts geo.ts       Districts, local bodies, nearest-by-centroid
  catalog.ts                Services per local body, availability, "notify me" interest
  me.ts                     User + bookings DTOs
  i18n.ts                   All UI strings (English now; add `ml` later)
  types.ts                  DTOs shared by API and UI
prisma/
  schema.prisma  migrations/  seed.ts  seed/*.json
middleware.ts               Route guard
public/sw.js                Minimal service worker (installable, offline page)
```

### API

| Method | Path | Notes |
|---|---|---|
| POST | `/api/auth/send-otp` | `{ phone }` |
| POST | `/api/auth/verify-otp` | `{ phone, code }` → sets cookie, returns `next` route |
| POST | `/api/auth/logout` | |
| GET / PATCH | `/api/me` | PATCH `{ name?, email? }` |
| PUT | `/api/me/location` | `{ localBodyId, ward?, landmark? }` |
| GET | `/api/locations/districts` | |
| GET | `/api/locations/local-bodies?districtId=&q=` | grouped order: corporation, municipalities, panchayats |
| GET | `/api/locations/nearest?lat=&lng=` | `{ localBody, distanceKm, withinServiceArea }` |
| POST | `/api/locations/local-bodies/:id/interest` | "Notify me when you launch here" |
| GET | `/api/services?localBodyId=` | categories → services with `available`, `price`, `interested` |
| POST | `/api/services/:id/interest` | "Notify me" for one service `{ localBodyId? }` |
| GET / POST | `/api/bookings` | POST `{ serviceId, date: YYYY-MM-DD, slot, address }` → `REQUESTED` |

`ServiceInterest` rows (with `serviceId = null` meaning "anything here") are the launch-demand signal per local body.

### Built to extend

- **Provider (worker) app**: add `Worker` + `WorkerServiceArea` models; bookings already carry `serviceId`,
  `localBodyId` and a status enum (`REQUESTED → CONFIRMED → IN_PROGRESS → COMPLETED / CANCELLED`).
- **Admin panel, more**: districts and local bodies (`isActive`) are still seed-only.
- **Malayalam UI**: add an `ml` dictionary next to `en` in `lib/i18n.ts`; data already has `nameMl`.
