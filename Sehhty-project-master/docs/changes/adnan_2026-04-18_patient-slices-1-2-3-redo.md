# Patient Slices 1-2-3 Redo

author: adnan

date: 2026-04-18

domain: patient

title: Re-implementation of Patient Dashboard, Discover, and Booking/Reservations

---

## Summary
Re-implemented patient phases 1, 2, and 3 with real database-backed behavior instead of placeholders.

- Slice 1 (dashboard) now loads live data for upcoming reservation and reservation/favorites counters.
- Slice 2 (discover) now loads real hospitals/pharmacies from DB with hospital filtering by specialty and type.
- Slice 3 (booking/reservations) now supports real booking creation, status grouping, and cancellation for upcoming appointments.

## Files Created
- app/patient/booking/actions.ts
- features/patient/components/booking/cancel-reservation-button.tsx
- features/patient/constants/tangier.ts

## Files Modified
- app/patient/dashboard/page.tsx
- app/patient/discover/page.tsx
- app/patient/booking/page.tsx
- app/patient/reservations/page.tsx
- features/patient/components/dashboard/upcoming-reservation-card.tsx
- features/patient/components/dashboard/summary-cards.tsx
- features/patient/components/discover/filter-bar.tsx
- features/patient/components/discover/list.tsx
- features/patient/components/discover/map.tsx
- features/patient/components/booking/booking-form.tsx
- features/patient/components/booking/reservation-list.tsx
- features/patient/services/dashboard.ts
- features/patient/services/discover/index.ts
- features/patient/services/booking/index.ts
- features/patient/types/dashboard.ts
- features/patient/types/discover/index.ts
- features/patient/types/booking/index.ts
- features/patient/schemas/booking/index.ts

## Shared Files Touched
- None in this redo (shared files were not changed for these three slices).

## What Was Added
- Dashboard:
  - Upcoming reservation card now shows live hospital/doctor/specialty/datetime.
  - Summary cards now show favorites, total reservations, upcoming, completed, canceled.
- Discover:
  - Server-rendered patient-only discover page.
  - View switch between hospitals and pharmacies.
  - Hospital filter bar (specialty + type) with URL-based filtering.
  - Real cards from DB and coordinate-based map panel with Tangier center fallback.
- Booking/Reservations:
  - Real booking options (hospitals, specialties, doctors) from DB.
  - Client booking form with dynamic doctor filtering by selected hospital and specialty.
  - Conflict-safe reservation creation with validation and role checks.
  - Reservations page grouped by status: upcoming, completed, canceled.
  - Cancel button for upcoming reservations with toast feedback.

## Known Issues
- Discover map panel currently displays coordinate points and selection details; full interactive Leaflet map integration is not yet included in this redo.
- Existing legacy placeholder files under features/patient/hooks and features/patient/actions from earlier slices remain in repo but are not used by the updated pages.

## How to Test
1. Start app and login as patient:
   - email: fatima@locatomed.ma
   - password: demo123
2. Slice 1 dashboard:
   - Open /patient/dashboard
   - Verify upcoming appointment card and summary counters are populated.
3. Slice 2 discover:
   - Open /patient/discover
   - Toggle hospitals/pharmacies.
   - Apply hospital specialty/type filters and verify list updates.
4. Slice 3 booking:
   - Open /patient/booking
   - Select hospital + specialty + doctor + date/time and submit.
   - Verify success toast and redirect to /patient/reservations.
5. Reservations:
   - Confirm new item appears in upcoming.
   - Click Annuler on an upcoming item and verify it moves to canceled.
