# Patient Ordonnance Scan Slice

author: adnan

date: 2026-04-18

domain: patient

title: Patient Ordonnance Scan (AI Placeholder) Implementation

---

## Summary
Implemented Slice 5 for patient ordonnance scanning with an integration-friendly AI placeholder architecture.

- Added a patient page for ordonnance upload.
- Added server action with patient role guard and upload validation.
- Added placeholder extraction service that detects medicine candidates from file context.
- Added DB matching against medicines table with structured result cards.

## Files Created
- app/patient/ordonnance-scan/page.tsx
- app/patient/ordonnance-scan/actions.ts
- features/patient/components/ordonnance-scan/ordonnance-scan-client.tsx
- features/patient/services/ordonnance-scan.ts
- features/patient/schemas/ordonnance-scan.ts
- features/patient/types/ordonnance-scan.ts

## Files Modified
- None

## Shared Files Touched
- None

## What Was Added
- Upload UI with supported file formats (PDF/PNG/JPG/WEBP).
- Loading state and toast feedback for scan action.
- Validation rules (file presence, mime type, size <= 5MB).
- Placeholder extraction pipeline designed to be swapped by real OCR/AI implementation later.
- Structured output per detected medicine:
  - matched medicine in DB
  - active ingredient
  - dosage form
  - ppm price
  - confidence score
  - unmatched list

## Known Issues
- Extraction is currently placeholder logic based on file metadata and deterministic heuristics.
- Pharmacy availability by extracted medicines is not included in this slice (planned for next slice).

## How to Test
1. Login as patient and open /patient/ordonnance-scan
2. Upload a PDF or image file (<= 5MB)
3. Click "Scanner l'ordonnance"
4. Verify toast and structured detection cards appear
5. Verify unmatched medicines list appears when no DB match is found
