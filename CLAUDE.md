# CLAUDE.md

Locally is a mobile-first PWA for booking home services in Kerala, launching in Kannur district. Users log in with a phone OTP, pick a **local body** (corporation, municipality or grama panchayat) and see the services bookable there.

[README.md](README.md) has the full setup, API table, project structure and seed-data guide. [locally-mvp-prompt.md](locally-mvp-prompt.md) is the original product brief. This file covers what you need while working in the code.

## Stack

Next.js 15 (App Router) · React 19 · TypeScript (strict) · Tailwind 3 · Prisma 6 on PostgreSQL (Prisma Postgres) · `jose` JWT session cookie · `zod` for request validation. Import paths use `@/*` from the repo root.

## Commands

```bash
npm run dev          # dev server
npm run typecheck    # tsc --noEmit (no test suite exists; this and `npm run build` are the checks)
npm run build
npm run db:migrate   # prisma migrate dev
npm run seed         # idempotent: upserts seed JSON, rebuilds availability
npm run db:reset     # wipe + migrate + seed
```

- Port 3000 is often taken by another local project, so Next falls back to 3001. Use the URL the dev server prints.
- In the Claude desktop app, start the server with the `locally-dev` config in `.claude/launch.json`, not from Bash.
- Dev login: any valid Indian mobile number (10 digits starting with 6–9), OTP **`123456`**. `9000000001` is in the dev `ADMIN_PHONES`, so it logs in as admin. The code is also logged as `[sms:console] OTP for ...`.
- "Failed to fetch" in the browser usually means the dev server isn't running.

## Architecture and conventions

- **Route handlers stay thin.** Wrap each one in `handler()` from `lib/api.ts`, validate with `parseBody(req, zodSchema)`, authenticate with `requireUser()`, and throw `ApiError(status, userMessage, code?)` for expected failures. Put logic in `lib/` (`catalog.ts`, `locations.ts`, `me.ts`, `otp.ts` …). Error responses are `{ error, code? }`.
- **Client fetches go through `api()` in `lib/client.ts`.** It sends JSON, throws `FetchError`, and redirects to `/login` on a 401.
- **Server-only modules** import `"server-only"`. `lib/session-token.ts` must stay edge-safe (no Prisma) because `middleware.ts` uses it.
- **Session:** an httpOnly `locally_session` JWT with claims `onb` (user has a name), `lb` (local body id) and `adm` (admin). Call `setSessionCookie(res, user)` again whenever the user's name or location changes, or the middleware will route them wrongly.
- **Route guard** (`middleware.ts`, pages only): logged out → `/login`, no name → `/setup`, no location → `/location`; `/admin/*` needs `adm` (no name/location required). API routes check auth themselves.
- **Admin:** `User.role` is `USER | ADMIN`; numbers in `ADMIN_PHONES` are promoted at login. `/admin` is the dashboard; tabs are Bookings, Localities (`/admin/localities`, detail at `/admin/local-bodies/[id]`) and Services. Admin APIs live under `/api/admin/*`, use `requireAdmin()`, and logic is in `lib/admin.ts`. The service list is fixed (seed); admins only edit base prices and per-local-body assignment / local price. Admins also manage booking status; allowed moves are `NEXT_STATUSES` in `lib/types.ts`.
- **UI strings** all live in `lib/i18n.ts` (English `en` for now; Malayalam `ml` comes later). Don't hardcode user-facing text in components. Data models carry `nameMl`.
- **DTOs** shared by the API and UI are in `lib/types.ts`.
- **Prisma client:** use the singleton `db` from `lib/db.ts`.
- **Mobile-first:** design for 360–430 px screens; on desktop the app is a centred, phone-width column.
- **Service icons:** new category icon keys must be mapped in `components/ServiceIcon.tsx`.

## Seed data (`prisma/seed/`)

- `districts.json`: only Kannur has `isActive: true`. Inactive districts show as "Coming soon".
- `kannur-local-bodies.json`: 1 corporation, 9 municipalities and all 71 grama panchayats. Ids look like `kannur.<slug>`.
  - Names (English and Malayalam) follow the official LSG Kerala list.
  - Malayalam uses atomic chillu letters (ൽ ർ ൻ ൾ).
  - `lat`/`lng` are approximate centroids, used only for "use my current location".
  - The `_comment` block in the file records sources and caveats.
- `availability.json`:
  - Corporations get every service.
  - Municipalities get everything except `municipalityExcept` and their own `municipalityExtraExcept` entry.
  - Grama panchayats get only the services listed under `panchayats`. A panchayat that isn't listed shows the "not here yet" state.
  - `priceOverrides` sets per-local-body prices.
- `services.json`: categories and services.
- New district files must also be added to `LOCAL_BODY_FILES` in `prisma/seed.ts`.

Run `npm run seed` after editing any of these. Once availability exists, the seed keeps availability and `basePrice` as admins left them; use `npm run seed -- --reset-availability` to rebuild availability from the JSON.

## Environment

Copy `.env.example` to `.env`. It needs `DATABASE_URL` (a Prisma Postgres `postgres://` connection string), `JWT_SECRET` and `SMS_PROVIDER=console`. The MSG91 and Twilio providers in `lib/sms.ts` are stubs. `.env` is gitignored.
