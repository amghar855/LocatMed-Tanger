# Patient Favorites Slice

author: adnan

date: 2026-04-18

domain: patient

title: Patient Favorite Hospitals Implementation

---

## Summary
Implemented Slice 4 for patient favorites with persistent database support. Patients can add/remove hospitals from favorites, view favorites on a dedicated page, and preview favorites on the dashboard.

## Files Created
- app/patient/favorites/page.tsx
- app/patient/favorites/actions.ts
- features/patient/types/favorites.ts
- features/patient/schemas/favorites.ts
- features/patient/services/favorites.ts
- features/patient/components/favorites/favorite-toggle-form.tsx
- features/patient/components/favorites/favorite-hospital-picker.tsx
- features/patient/components/favorites/favorites-list.tsx
- features/patient/components/dashboard/favorites-preview.tsx

## Files Modified
- app/patient/dashboard/page.tsx
- features/patient/components/dashboard/quick-actions.tsx
- scripts/seed.ts
- lib/db/schema.ts

## Shared Files Touched
- lib/db/schema.ts
- scripts/seed.ts

## What Was Added
- New table: patient_favorite_hospitals with unique patient-hospital pair constraint
- Server actions for add/remove favorites with patient role protection
- Favorites data service with patient-scoped queries
- Favorites page with hospital picker and saved favorites list
- Dashboard favorites preview section
- Quick action link to favorites page
- Seeded demo favorites for Fatima

## Known Issues
- Discover cards are still placeholder-based from previous slice; favorite toggles are currently exposed in the dedicated favorites page.

## How to Test
1. Run database migration commands:
   - npm run db:generate
   - npm run db:migrate
2. Seed demo data:
   - npm run db:seed
3. Login as patient:
   - email: fatima@locatomed.ma
   - password: demo123
4. Visit /patient/favorites and add/remove hospitals
5. Visit /patient/dashboard and verify favorites preview updates
