# Patient Discover Map Slice

author: adnan

date: 2026-04-18

domain: patient

title: Interactive Discover Map and List Sync (Next Slice)

---

## Summary
Implemented the next patient slice by replacing the discover placeholder map with an interactive Leaflet map synchronized with the hospitals/pharmacies list.

## Files Created
- features/patient/components/discover/discover-map-leaflet.tsx
- features/patient/components/discover/discover-client.tsx
- docs/changes/adnan_2026-04-18_patient-discover-map-slice.md

## Files Modified
- app/patient/discover/page.tsx
- features/patient/components/discover/list.tsx

## Shared Files Touched
- None

## What Was Added
- Real Leaflet-based map for discover flow.
- Dynamic no-SSR map loading for browser-only rendering.
- Click marker -> select list row behavior.
- Click list row -> recenter map and highlight marker behavior.
- Selection strip showing currently selected point.
- Marker color conventions:
  - hospitals: blue
  - pharmacy de garde: green
  - pharmacy standard: gray

## What Was NOT Changed
- No database schema or migration changes.
- No server action changes required.
- No doctor/hospital-admin/pharmacy domain files were touched.

## Known Issues
- Discover route still uses tab-based URL filtering and does not persist selected marker in query params.

## How to Test
1. Login as patient and open `/patient/discover`.
2. Toggle between Hôpitaux and Pharmacies.
3. Click several list rows and verify map centers on each.
4. Click several map markers and verify matching list row highlight.
5. Verify pharmacy marker colors differ for de garde vs standard.
