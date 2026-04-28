# Patient Chatbot Slice

author: adnan

date: 2026-04-18

domain: patient

title: Patient Assistant Chatbot (Slice 7)

---

## Summary
Implemented Slice 7 by adding a patient chatbot page with guarded server action, validated input, and contextual suggestions for booking, hospitals, pharmacies, and ordonnance flow.

## Files Created
- app/patient/chatbot/page.tsx
- app/patient/chatbot/actions.ts
- features/patient/components/chatbot/chatbot-client.tsx
- features/patient/services/chatbot.ts
- features/patient/schemas/chatbot.ts
- features/patient/types/chatbot.ts
- docs/changes/adnan_2026-04-18_patient-chatbot-slice.md

## Files Modified
- None

## Shared Files Touched
- None

## What Was Added
- New patient-only route `/patient/chatbot`.
- Server action `askPatientChatbotAction` with:
  - `requireRole("patient")`
  - Zod-backed question validation
  - safe error handling response
- Chatbot service with deterministic intent routing (`booking`, `pharmacy`, `discover`, `general`).
- Data-backed suggestions from existing Tangier hospitals/pharmacies/stock tables.
- Chat UI with message history, loading state, and actionable chips to patient pages.

## Known Issues
- This slice is rule-based (no LLM integration).
- Arabic understanding is limited to simple mixed-language input.
- Suggestion links are route-level shortcuts, not deep entity pages.

## How to Test
1. Login as patient and open `/patient/chatbot`.
2. Ask booking-related question (example: "Je veux reserver un rendez-vous cardio").
3. Ask pharmacy/medicine question (example: "Ou trouver doliprane ?").
4. Verify assistant responses include relevant suggestion chips.
5. Click chips and verify navigation to patient flows.
