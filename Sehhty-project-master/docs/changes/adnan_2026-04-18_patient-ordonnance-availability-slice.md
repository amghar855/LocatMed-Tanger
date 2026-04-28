# Patient Ordonnance Availability Slice

author: adnan

date: 2026-04-18

domain: patient

title: Pharmacy Availability for Extracted Ordonnance Medicines

---

## Summary
Implemented Slice 6 by extending ordonnance scan results with pharmacy availability for each detected medicine.

## Files Created
- docs/changes/adnan_2026-04-18_patient-ordonnance-availability-slice.md

## Files Modified
- features/patient/types/ordonnance-scan.ts
- features/patient/services/ordonnance-scan.ts
- features/patient/components/ordonnance-scan/ordonnance-scan-client.tsx

## Shared Files Touched
- None

## What Was Added
- New typed availability model per extracted medicine:
  - pharmacy name
  - address
  - neighborhood
  - medicine name
  - quantity
  - stock status (in stock / low stock / out of stock)
  - price
- Service now joins `pharmacy_stock` and `pharmacies` for each matched medicine.
- Availability is sorted by quantity descending.
- Scan result UI now shows pharmacy availability cards under each matched medicine.

## Known Issues
- Availability section currently shows first 6 pharmacies per medicine for compact mobile rendering.
- Geolocation/distance sorting is not included in this slice.

## How to Test
1. Login as patient and open /patient/ordonnance-scan
2. Upload a supported ordonnance file
3. Run scan
4. For matched medicines, verify pharmacy availability cards display:
   - pharmacy name
   - address
   - neighborhood
   - medicine name
   - stock status
   - quantity
   - price
