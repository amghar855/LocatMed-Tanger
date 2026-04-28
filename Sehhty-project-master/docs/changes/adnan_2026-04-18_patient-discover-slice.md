# Patient Discover Slice

author: adnan

date: 2026-04-18

domain: patient

title: Patient Discover Hospitals/Pharmacies Implementation

---

## Summary
Initial implementation of the patient discover slice. Includes discover page, map placeholder, result cards, and filter bar for hospitals and pharmacies. All logic and UI are isolated to the patient domain.

## Files Created
- app/patient/discover/page.tsx
- features/patient/components/discover/map.tsx
- features/patient/components/discover/list.tsx
- features/patient/components/discover/filter-bar.tsx
- features/patient/types/discover/index.ts
- features/patient/hooks/discover/useDiscover.ts
- features/patient/services/discover/index.ts
- features/patient/schemas/discover/index.ts
- features/patient/actions/discover/getDiscoverData.ts

## Files Modified
- None

## Shared Files Touched
- None

## What Was Added
- Patient discover page and layout
- Map, result list, and filter bar components (placeholders)
- Types, Zod schema, service, and server action for discover data

## Known Issues
- Data and map are placeholders; real data and Leaflet integration to be implemented in future slices
- Filters are not yet functional

## How to Test
1. Visit /patient/discover in the app
2. You should see the discover layout, map placeholder, result list placeholder, and filter bar
3. All data is static/placeholder for now
