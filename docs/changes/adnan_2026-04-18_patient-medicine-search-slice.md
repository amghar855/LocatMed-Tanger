# Patient Medicine Search Slice

author: adnan

date: 2026-04-18

domain: patient

title: Medicine Search with Pharmacy Availability Map (Slice 8)

---

## Summary
Implemented a new patient medicine-search slice focused on the hero demo scenario: search medicines and view available pharmacies in Tangier with stock status, distance, duty badge, and map interaction.

## Files Created
- app/patient/medicine-search/page.tsx
- app/patient/medicine-search/actions.ts
- features/patient/components/medicine-search/medicine-search-client.tsx
- features/patient/components/medicine-search/pharmacy-map.tsx
- features/patient/services/medicine-search.ts
- features/patient/schemas/medicine-search.ts
- features/patient/types/medicine-search.ts
- docs/changes/adnan_2026-04-18_patient-medicine-search-slice.md

## Files Modified
- features/patient/components/dashboard/quick-actions.tsx
- app/globals.css

## Shared Files Touched
- app/globals.css
Reason: added Leaflet CSS import required by react-leaflet map rendering.

## What Was Added
- New patient-only route `/patient/medicine-search`.
- Guarded server action `searchMedicinesAction` with `requireRole("patient")` and Zod validation.
- DB service using one join-based query over medicines, stock, and pharmacies.
- Grouped medicine results with detailed pharmacy availability rows.
- Debounced search input (300ms) and suggested quick queries.
- Haversine distance calculation from user geolocation with Tangier fallback.
- Stock status badges (in stock, low stock, out of stock).
- "De garde" badge support from pharmacy data.
- Interactive map/list behavior:
  - clicking list row highlights map location
  - clicking map marker highlights selection

## What Was NOT Changed
- No schema or migration changes.
- No doctor, hospital-admin, or pharmacy domain files were modified.
- No auth contract changes.

## Known Issues
- Search is deterministic and does not include typo correction beyond case-insensitive matching.
- If geolocation is denied, distance uses Tangier center fallback.

## How to Test
1. Login as patient.
2. Open `/patient/medicine-search`.
3. Search for examples: `paracetamol`, `doliprane`, `augmentin`.
4. Verify medicine cards show DCI/form/PPM and pharmacy rows with:
   - stock badge
   - distance
   - quantity
   - price
   - de garde badge when available
5. Click a pharmacy row and confirm map centers/highlights.
6. Click a map marker and confirm selection updates.
