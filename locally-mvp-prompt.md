# Build: Locally MVP (mobile-first home services booking app)

## Context
Locally is a home services booking app inspired by Justlife (Dubai). It connects people who need a service with nearby workers. It launches first in **Kannur district, Kerala**, and will later expand across Kerala. This is the MVP: focus on login, location selection by local body (panchayat), and showing which services are available in the chosen location.

Build it as a **mobile-first web app (PWA)**. Design for a 360–430px phone screen first; desktop should just be a centered phone-width layout.

## Tech stack
- Next.js 14+ (App Router) + TypeScript
- Tailwind CSS
- Prisma ORM with PostgreSQL (use SQLite locally if Postgres is not set up; keep the schema Postgres-compatible)
- Auth: phone number + OTP. For the MVP, **mock the OTP** (always accept `123456` in development, log the code to the server console). Put the SMS sender behind an interface (`lib/sms.ts`) so MSG91 or Twilio can be plugged in later.
- Session: httpOnly cookie (JWT or iron-session)
- PWA: manifest + icons so it can be added to the home screen

## Core user flow
1. **Splash / Welcome** → "Get started"
2. **Login**: enter Indian mobile number (+91, 10 digits, validate) → OTP screen (6 digits, resend timer 30s)
3. **New user only**: ask name (optional email)
4. **Choose your location** (required before the home screen):
   - Option A: **"Use my current location"** → browser geolocation → find the nearest local body by centroid distance → show "You're in *X*. Is this right?" with Confirm / Choose manually
   - Option B: **Select manually** → District (only Kannur active; other Kerala districts shown as "Coming soon", disabled) → searchable list of **local bodies** grouped by type: Corporation, Municipality, Grama Panchayat
   - Optional: ward number / landmark text field
   - Save selection to the user's profile and also in localStorage for fast reload
5. **Home**:
   - Top bar: location chip showing the panchayat name ("📍 Pinarayi ▾"). Tapping it opens the **Change location** bottom sheet (same picker as step 4 + "Use current location")
   - Search bar for services
   - Service categories grid (icons)
   - Only services **available in the selected local body** are bookable. Services not available there show a muted "Coming soon to *X*" state with a "Notify me" button (store the interest in a table; this is useful launch-demand data)
   - Changing location instantly refreshes the services list
6. **Service detail**: description, starting price (₹), duration, what's included → "Book" button (booking can be a simple stub for MVP: pick date + time slot + address → creates a `Booking` with status `REQUESTED`)
7. **Profile**: name, phone, saved location, my bookings, logout

## Data model (Prisma)
- `District` { id, name, nameMl, isActive }
- `LocalBody` { id, districtId, name, nameMl, type: CORPORATION | MUNICIPALITY | GRAMA_PANCHAYAT, blockName?, lat, lng, isActive }
- `ServiceCategory` { id, name, nameMl, icon, sortOrder }
- `Service` { id, categoryId, name, nameMl, description, basePrice, durationMins, isActive }
- `ServiceAvailability` { id, serviceId, localBodyId, isAvailable, priceOverride? } — unique (serviceId, localBodyId)
- `User` { id, phone (unique), name, email?, localBodyId?, ward?, landmark?, createdAt }
- `OtpRequest` { id, phone, codeHash, expiresAt, attempts }
- `ServiceInterest` { id, userId, serviceId, localBodyId, createdAt } (for "Notify me")
- `Booking` { id, userId, serviceId, localBodyId, date, slot, address, status, createdAt }

## Seed data
- District: Kannur (active) + the other 13 Kerala districts (inactive)
- Local bodies for Kannur: Kannur Corporation; municipalities (Thalassery, Payyannur, Taliparamba, Mattannur, Iritty, Koothuparamba, Anthoor, Panoor, Sreekandapuram); and grama panchayats, starting with e.g. Azhikode, Chirakkal, Pappinisseri, Kalliasseri, Valapattanam, Narath, Kolachery, Mayyil, Munderi, Chembilode, Peralassery, Kadambur, Muzhappilangad, Dharmadam, Pinarayi, Vengad, Anjarakandy, Eranholi, Kunnothuparamba, Chokli, Panniyannur.
  - Put the list in `prisma/seed/kannur-local-bodies.json` so it is easy to complete. Kannur has 71 grama panchayats in total; leave a TODO to fill the full list (and Malayalam names) from the official LSG Kerala source. Use approximate centroid lat/lng for each; mark them as approximate in a comment.
- Categories and services (prices in ₹): Home cleaning (regular, deep cleaning, bathroom, kitchen), Electrician, Plumber, AC service & repair, Appliance repair (washing machine, fridge), Painting, Carpentry, Pest control, Coconut tree climbing, Well cleaning, Gardening, Water tank cleaning
- Availability: make it uneven on purpose so the location switch is visibly meaningful (e.g. Kannur Corporation and the municipalities have most services; smaller panchayats have only 3–5)

## API routes
- `POST /api/auth/send-otp`, `POST /api/auth/verify-otp`, `POST /api/auth/logout`, `GET /api/me`
- `GET /api/locations/districts`
- `GET /api/locations/local-bodies?districtId=&q=`
- `GET /api/locations/nearest?lat=&lng=`
- `PUT /api/me/location`
- `GET /api/services?localBodyId=` → returns categories with services, each flagged `available` (with effective price)
- `POST /api/services/:id/interest`
- `POST /api/bookings`, `GET /api/bookings`

## UI / UX requirements
- Mobile-first, thumb-friendly: bottom navigation (Home, Bookings, Profile), 44px+ touch targets, bottom sheets for pickers
- Fast: skeleton loaders, optimistic location switch
- Language: English UI, with Malayalam names shown as secondary text in the location picker (structure strings so a full Malayalam toggle can be added later)
- Clean, local feel; avoid generic template look. Pick one strong accent color and use it sparingly
- Empty/error states: no services in this location yet → friendly message + "Notify me when you launch here"; geolocation denied → fall back to manual picker with a short explanation
- Route guard: logged out → login; logged in without location → location picker

## Deliverables
1. Working app with `npm run dev`
2. `prisma` schema, migration, and seed script (`npm run seed`)
3. `.env.example` (DATABASE_URL, JWT_SECRET, SMS_PROVIDER)
4. README: setup steps, how the mock OTP works, how to add a new district/local body and turn on services for it
5. Keep the code modular so a provider (worker) app and an admin panel can be added later

Start by proposing the folder structure and the Prisma schema, then build screen by screen: login → location picker → home with location switching → service detail/booking → profile.
