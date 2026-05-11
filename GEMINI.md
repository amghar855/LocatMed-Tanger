# LOCATOMED Project Instructions

LOCATOMED is a lightweight digital health platform connecting patients, pharmacies, hospitals, and healthcare providers in Tangier, Morocco.

## Project Overview

- **Mission:** Connect patients to nearby medicines and medical appointments.
- **Geographic Scope:** Tangier, Morocco (Fallback coordinates: `35.7673, -5.7998`).
- **Target Audience:** Patients, Doctors, Pharmacists, and Hospital Administrators.
- **Main Technologies:**
    - **Frontend:** Next.js 15 (App Router, Turbopack), Tailwind CSS 4, shadcn/ui, Lucide Icons.
    - **Backend:** Next.js Server Actions, Auth.js v5 (Credentials Provider).
    - **Database:** Drizzle ORM with MySQL.
    - **Maps:** Leaflet + OpenStreetMap (No Google Maps).
    - **Mobile:** Capacitor (targeting Android).
- **Architecture:** Role-based routing and access control. Server-side data fetching with Server Components.

## Roles & Routing

Routes are scoped by role and strictly enforced via middleware and guards:
- `/patient/*` — Mobile-first dashboard and features.
- `/doctor/*` — Desktop-first dashboard for medical management.
- `/pharmacy/*` — Desktop-first dashboard for stock management.
- `/hospital-admin/*` — Hospital management.

## Building and Running

### Development
```powershell
npm install
npm run dev
```

### Database Management
```powershell
# Generate migrations based on schema.ts
npm run db:generate

# Apply migrations to the database
npm run db:migrate

# Seed the database with demo data
npm run db:seed

# Open Drizzle Studio to browse data
npm run db:studio
```

### Mobile (Capacitor)
```powershell
# Build the project
npm run build

# Sync with Android project
npm run cap:sync

# Run on Android (ensure emulator/device is connected)
npm run cap:run:android
```

## Development Conventions

### Security & Authorization
- **CRITICAL:** Every Server Action or role-specific page MUST start with `requireRole(role)`.
- **Guards:** Use `lib/auth/guards.ts` for session and role verification.
- **Session:** Managed via Auth.js cookies; do not use `localStorage` for auth.

### UI/UX Standards
- **Palette:**
    - Primary: `#2E5077`
    - Secondary: `#4DA1A9`
    - Accent: `#79D7BE`
    - Background: `#F6F4F0`
- **Components:** Use only `shadcn/ui` primitives. No custom CSS modules.
- **Responsiveness:** Mobile-first design. Use vertical stacking on mobile. Replace tables with cards on small screens.
- **Feedback:** Every mutation must include a loading state and a toast notification (Sonner).

### Data & Logic
- **ORM:** Use Drizzle ORM in `lib/db/`. No raw SQL in components.
- **Mutations:** Only perform mutations in Server Actions (`actions.ts` files).
- **Validation:** Use Zod schemas in `lib/schemas/` for all forms and API inputs.
- **I18n:** French (primary), Arabic (secondary). Use strings from `lib/i18n/`.
- **Dates:** Store as UTC, display as local using `date-fns` and `Africa/Casablanca` timezone.

### Documentation
- For every major feature or page, create/update a markdown file in `/docs/`.
- Maintain `CLAUDE.md` and `GEMINI.md` as the primary sources of project configuration.

## Directory Structure

- `app/`: Next.js routes and layouts.
- `components/locatomed/`: Composed project-specific components.
- `components/ui/`: shadcn/ui primitives.
- `lib/db/`: Database client and schema definitions.
- `lib/auth/`: Auth.js configuration and guards.
- `lib/schemas/`: Zod validation schemas.
- `lib/i18n/`: Localization strings (FR/AR).
- `data/`: JSON/CSV source data for seeding.
- `docs/`: Feature documentation and bug fix logs.
- `android/`: Capacitor Android project files.
