# Patient Medical Folder Slice

author: adnan

date: 2026-04-18

domain: patient

title: Patient Read-Only Medical Folder with Filters

---

## Summary
Implemented the next patient slice by adding a full read-only medical folder view so patients can see consultation history, diagnoses, notes, and prescriptions from existing records.

## Files Created
- app/patient/folder/page.tsx
- features/patient/types/medical-folder.ts
- features/patient/services/medical-folder.ts
- features/patient/components/medical-folder/medical-folder-filters.tsx
- features/patient/components/medical-folder/medical-folder-timeline.tsx
- docs/changes/adnan_2026-04-18_patient-medical-folder-slice.md

## Files Modified
- features/patient/components/dashboard/quick-actions.tsx

## Shared Files Touched
- None

## What Was Added
- New patient route `/patient/folder` protected by `requireRole("patient")`.
- Medical folder data service that:
  - scopes records to the authenticated patient ID
  - supports optional doctor filter
  - supports optional date-range filters
  - joins doctor and appointment/hospital data
  - resolves prescription medicine IDs to medicine names
- Filter UI (doctor, from, to) using GET query params.
- Timeline UI grouped by month/year with sticky group headers.
- Read-only record cards showing:
  - localized date
  - doctor and specialty
  - hospital name
  - diagnosis
  - consultation notes
  - prescription list with medicine name + dosage + duration
- Empty state with CTA back to booking flow.
- Dashboard quick-action shortcut to open the folder.

## What Was NOT Changed
- No DB schema changes.
- No migrations.
- No doctor/hospital-admin/pharmacy domain files touched.
- No existing auth contracts changed.

## Known Issues
- Notes are displayed as plain text with preserved line breaks (no markdown rendering in this slice).

## How to Test
1. Login as patient (fatima@locatomed.ma / demo123).
2. Open `/patient/folder`.
3. Verify timeline displays seeded records with doctor, hospital, diagnosis, notes, and prescriptions.
4. Apply doctor filter and confirm results narrow correctly.
5. Apply date range and confirm records are filtered.
6. Clear filters and confirm full history returns.
