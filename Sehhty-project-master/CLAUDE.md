# LOCATOMED — Project Constitution

LOCATOMED is a lightweight digital health platform connecting patients, pharmacies,
hospitals, and healthcare providers in Morocco. MVP is scoped to **Tangier**.
Hackathon demo-first — not production.

## Hero demo narrative (do not break)

Fatima (patient in Tangier) searches "paracetamol" → sees which nearby
pharmacy has it in stock → books an appointment with Dr. Benjelloun at
Hôpital Mohammed V → Dr. Benjelloun (doctor) sees her folder, adds a
consultation note → Fatima sees the update.

This flow must always work. Any PR that breaks it is rejected.

## Tech stack

- Next.js 15 (app router, TypeScript, Server Components + Server Actions)
- Tailwind + shadcn/ui — do not introduce another component library
- SQLite via Drizzle ORM + better-sqlite3 (dev) / libSQL (prod via Turso)
- Auth.js v5 (NextAuth) with Credentials provider + bcrypt
- Leaflet + OpenStreetMap for maps (no Google Maps, no API key)
- Deployed to Vercel; DB is local file in dev, Turso in prod

## Geographic scope

- **City: Tangier** (Tanger, طنجة)
- Center: lat `35.7673`, lng `-5.7998` — use as geolocation fallback
- Bounding box: approx `35.70–35.82 N`, `-5.92 to -5.68 W`
- Timezone: Africa/Casablanca (UTC+1, no DST since 2018)
- UI locale: French primary, Arabic secondary

## Core entities and roles

Users have one of three roles: `patient`, `doctor`, `pharmacist`.

- **Patients** — manage their folder, search medicines, book appointments
- **Doctors** — belong to exactly one `hospital_id`, handle appointments,
  update medical records
- **Pharmacists** — belong to exactly one `pharmacy_id`, manage stock

Additional entities:
- **Hospitals** — public or private facilities (CHU Mohammed VI, Hôpital
  Mohammed V, Hôpital Privé de Tanger, Hôpital Duc de Tovar, etc.)
- **Pharmacies** — retail pharmacies across Tangier with optional "de garde"
- **Medicines** — national reference from data.gov.ma

Routes are scoped by role:

- `/patient/*` — mobile-first
- `/doctor/*` — desktop-first dashboard
- `/pharmacy/*` — desktop-first dashboard

`middleware.ts` reads the session, checks the role, and redirects accordingly.
Cross-role access is blocked.

## Database access rules

1. All data access goes through Drizzle in `lib/db/`. No raw SQL in components.
2. **Authorization is enforced in server actions, not by the database.**
   Every mutation/query starts with `requireRole()` from `lib/auth/guards.ts`.
   Never trust the client. See the `authorization` skill.
3. Mutations only happen in Server Actions (`app/<role>/<feature>/actions.ts`).
   Client components never write directly.
4. Schema lives in `lib/db/schema.ts`. Migrations in `drizzle/migrations/`.
   Regenerate after every schema change: `npm run db:generate`.

## Conventions

- File names: `kebab-case.tsx` for components, `camelCase.ts` for utilities
- Components: named exports, colocate types in the same file
- Styling: Tailwind only, no CSS modules
- Forms: React Hook Form + Zod schemas in `lib/schemas/`
- Dates: `date-fns` + `date-fns-tz`, never Moment. Store UTC, display local
- UI text: French primary, Arabic secondary where space allows. Strings in
  `lib/i18n/fr.ts` and `lib/i18n/ar.ts` — hardcoded, no i18n framework
- Toast notifications on every successful mutation (Sonner via shadcn)
- Never fetch in `useEffect` — use Server Components

## Directory map

- `app/` — Next.js routes
- `components/ui/` — shadcn primitives (don't modify)
- `components/locatomed/` — our composed components
- `lib/db/` — Drizzle client, schema, queries
- `lib/auth/` — Auth.js config + authorization guards
- `lib/schemas/` — Zod validation
- `drizzle/migrations/` — generated SQL
- `scripts/` — seed + one-off utilities
- `data/locatomed.db` — local SQLite file (gitignored)
- `data/pharmacies-tanger.json` — cached OSM pharmacy export
- `data/hospitals-tanger.json` — curated Tangier hospital list

## Hackathon constraints (important)

- Scope is locked. New features require explicit approval.
- No auth providers beyond email/password. No SMS, no OAuth.
- No payments, no OCR, no file uploads. Placeholders are fine.
- Deploy to Vercel (frontend) + Turso (DB) by hour 36.
- Every mutation needs a toast + a loading state. No exceptions.

## Don't do

- Don't skip `requireRole()` in server actions — it's the only auth layer
- Don't query Drizzle directly from Client Components
- Don't use localStorage for auth — Auth.js handles sessions via cookies
- Don't scrape real patient data — use seed scripts only
- Don't touch `components/ui/` (shadcn auto-generated)
- Don't write tests during the hackathon unless asked
- Don't add dependencies without checking with the team first
- Don't hardcode Casablanca coordinates anywhere — we're in Tangier

## Running the project

```bash
npm install
npm run db:generate   # after schema changes, creates migration
npm run db:migrate    # applies migrations to local SQLite
npm run db:seed       # wipes + seeds demo data
npm run dev           # localhost:3000
```

## When in doubt

Read the relevant skill in `.claude/skills/` before asking. If a workflow
is repeated twice, promote it to a skill.
