---
name: medical-folder
description: Builds or modifies the patient medical folder — both the patient's read-only view and the doctor's add-entry flow. USE THIS SKILL whenever the user mentions medical records, folder, history, consultation notes, patient file, or dossier médical.
---

# Medical folder (Dossier médical)

## Two viewing modes

### Patient view (`/patient/folder`)
Read-only timeline grouped by year → month. Each entry shows:
- Date (localized, e.g. "15 mars 2025")
- Doctor name + specialty
- **Hospital name** where the consultation took place (via the linked
  appointment's `hospital_id`)
- Diagnosis (short, bolded)
- Notes (markdown rendered)
- Prescription list (if any) with medicine names

Filter: by doctor (dropdown) or by date range (two date pickers).

### Doctor view (`/doctor/patient/[id]`)
Same timeline, but at the top: a "Start consultation" button linked to the
next scheduled appointment with this patient. Button opens the add-entry form.

## Doctor add-entry flow

Button click → modal or page with:
- Diagnosis (required, short text, min 3 chars)
- Notes (required, textarea, markdown supported, min 10 chars)
- Prescription (optional, multi-select of medicines from the `medicines` table)
- Submit → inserts into `medical_records`, marks appointment as `completed`
- Toast "Consultation enregistrée"
- Redirect back to doctor dashboard

## Data shape

```typescript
export const medicalRecords = sqliteTable("medical_records", {
  id: text("id").primaryKey(),
  patientId: text("patient_id").notNull().references(() => users.id),
  doctorId: text("doctor_id").notNull().references(() => users.id),
  appointmentId: text("appointment_id").references(() => appointments.id),
  date: integer("date", { mode: "timestamp_ms" }).notNull(),
  diagnosis: text("diagnosis").notNull(),
  notes: text("notes").notNull(),
  prescription: text("prescription", { mode: "json" })
    .$type<Array<{ medicineId: string; dosage: string; duration: string }>>(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
});
```

## Authorization (critical — see `authorization` skill)

### Patient reads own records only
```typescript
await requireRole("patient");
// WHERE patient_id = session.user.id
```

### Doctor reads records of patients they have (or had) an appointment with
```typescript
await requireRole("doctor");
// Subquery: patient must have an appointment with this doctor
const hasAppointment = await db.select({ id: appointments.id })
  .from(appointments)
  .where(and(
    eq(appointments.doctorId, session.user.id),
    eq(appointments.patientId, patientId),
  )).limit(1);
if (hasAppointment.length === 0) throw new Error("Forbidden");
```

### Doctor inserts record — must reference an appointment they own
```typescript
await requireRole("doctor");
const appt = await getAppointment(appointmentId);
if (!appt || appt.doctorId !== session.user.id) throw new Error("Forbidden");
// Now insert the record with doctorId = session.user.id
```

## UI polish
- Empty state: "Aucun dossier pour l'instant. Réservez un rendez-vous →"
- Loading skeleton for the timeline
- Markdown rendering with `react-markdown`, sanitized
- Prescription list renders as bullet list with medicine name + dosage
- Date grouping headers are sticky on scroll

## Pitfalls
- `requireRole` + scoped query is the ONLY thing stopping cross-patient
  access — test with two different patient accounts
- Realistic seed data matters here more than anywhere else for the demo
- Don't expose doctor's private notes to patient — for MVP, patient sees
  the same `notes` field. A separate `private_notes` is future scope.
- Markdown notes need sanitization — never trust stored HTML
- Storing prescription as JSON is fine for MVP; don't build a separate
  `prescription_items` table unless you need complex queries
