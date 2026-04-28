# Patient Ordonnance Distance Slice

author: adnan

date: 2026-04-18

domain: patient

title: Distance-Aware Ordonnance Availability Sorting

---

## Summary
Implemented the next patient slice by upgrading ordonnance pharmacy availability with geolocation fallback, distance display, and smarter ranking (stock status -> de garde -> distance).

## Files Created
- docs/changes/adnan_2026-04-18_patient-ordonnance-distance-slice.md

## Files Modified
- features/patient/types/ordonnance-scan.ts
- features/patient/services/ordonnance-scan.ts
- features/patient/components/ordonnance-scan/ordonnance-scan-client.tsx

## Shared Files Touched
- None

## What Was Added
- Availability model now includes pharmacy coordinates and `isOnDuty`.
- Service query now returns `lat`, `lng`, and `isOnDuty` from pharmacies.
- Client now computes Haversine distance from user location (fallback Tangier center).
- Availability cards now show distance in km.
- Availability ranking now prioritizes:
  - stock status (in stock > low stock > out of stock)
  - de garde pharmacies
  - nearest distance
- De garde label rendered on availability cards.

## What Was NOT Changed
- No DB schema change.
- No migrations.
- No role/auth contract changes.
- No non-patient domain files touched.

## Known Issues
- Geolocation can be denied by browser permissions; fallback remains Tangier center.

## How to Test
1. Login as patient and open `/patient/ordonnance-scan`.
2. Upload a valid ordonnance file and run scan.
3. Verify each matched medicine shows pharmacy rows with distance values.
4. Verify de garde pharmacies are surfaced earlier when stock status is equal.
5. Deny geolocation permission and verify results still render with fallback distance sorting.
