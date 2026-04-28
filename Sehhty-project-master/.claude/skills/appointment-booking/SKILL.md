---
name: appointment-booking
description: Builds or modifies the appointment scheduling flow between patients and doctors at Tangier hospitals, including slot generation, conflict handling, hospital filtering, and confirmation. USE THIS SKILL whenever the user mentions appointments, booking, scheduling, availability, calendars, hospitals, or time slots.
---

# Appointment booking

## Browse flow

Patient sees doctors either:
1. **By hospital** — list hospitals → click one → see doctors practicing
   there → pick a doctor
2. **By specialty** — filter globally (Médecine générale, Pédiatrie,
   Cardiologie, etc.) → see doctors across hospitals → pick one

Each doctor page shows: photo placeholder, name, specialty, **hospital
name + address**, and the slot grid.

## Slot model
Slots are computed at query time, not stored. For each doctor:
- Hours: 09:00–17:00 **Africa/Casablanca** (Tangier local time), 30-min grid
- Next 14 days, weekdays only (Mon–Fri)
- Exclude slots matching existing `appointments` rows where `status != 'cancelled'`

## Booking flow

Click slot → confirmation dialog showing doctor name, hospital, date/time →
server action creates row → toast "Rendez-vous confirmé" → redirect to
patient dashboard.

## Schema note

Appointments have a `hospitalId` FK (denormalized from the doctor's
`hospitalId` at booking time). This way, if a doctor later changes
hospitals, historical appointments still show where they happened.

## Conflict safety

```typescript
// lib/db/queries/appointments.ts
export async function bookAppointment(input: {
  patientId: string;
  doctorId: string;
  hospitalId: string;
  datetime: Date;
  reason?: string;
}) {
  return db.transaction(async (tx) => {
    const conflict = await tx.select({ id: appointments.id })
      .from(appointments)
      .where(and(
        eq(appointments.doctorId, input.doctorId),
        eq(appointments.datetime, input.datetime),
        ne(appointments.status, "cancelled"),
      ))
      .limit(1);

    if (conflict.length > 0) throw new Error("SLOT_TAKEN");

    return tx.insert(appointments).values({
      id: randomUUID(),
      ...input,
      status: "scheduled",
      createdAt: new Date(),
    }).returning();
  });
}
```

Race condition falls back to a clear error toast: "Ce créneau vient d'être
réservé, veuillez en choisir un autre."

## Server action

```typescript
// app/patient/book/[doctorId]/actions.ts
"use server";
export async function book(input: { doctorId: string; datetimeIso: string; reason?: string }) {
  const session = await requireRole("patient");
  const parsed = BookInput.parse(input);
  const datetime = new Date(parsed.datetimeIso);

  // Fetch doctor's hospital to denormalize onto the appointment
  const [doctor] = await db.select({ hospitalId: users.hospitalId })
    .from(users)
    .where(and(eq(users.id, parsed.doctorId), eq(users.role, "doctor")));
  if (!doctor?.hospitalId) return { ok: false, error: "Médecin introuvable" };

  // Reject past or <1h-future slots
  if (datetime.getTime() < Date.now() + 60 * 60 * 1000) {
    return { ok: false, error: "Ce créneau est trop proche" };
  }

  try {
    const [appt] = await bookAppointment({
      patientId: session.user.id,
      doctorId: parsed.doctorId,
      hospitalId: doctor.hospitalId,
      datetime,
      reason: parsed.reason,
    });
    revalidatePath("/patient");
    return { ok: true, data: appt };
  } catch (e) {
    if ((e as Error).message === "SLOT_TAKEN") {
      return { ok: false, error: "Ce créneau vient d'être réservé" };
    }
    throw e;
  }
}
```

## UI grid

Render slots as a 7-day × 16-slot grid. Taken slots are greyed out and
non-clickable. Available slots are buttons. Tooltip on hover: "Réserver
ce créneau à {hospitalName}".

## Status model
`scheduled` → `completed` (when doctor submits a medical record)
`scheduled` → `cancelled` (by patient or doctor, not in MVP scope)

## Pitfalls
- **Timezones**: store UTC in DB, display in Africa/Casablanca. Morocco has
  been on permanent UTC+1 since 2018 (no DST). Use `date-fns-tz` for clarity.
- Doctor cancellations need to notify patient — toast on next login is fine
- Don't let patients book <1h in the future
- The slot grid is expensive to compute if you fetch all 14 days at once —
  memoize based on doctorId, recompute only when an appointment is added
- Don't forget to update `revalidatePath` after booking so the list refreshes
- Always denormalize `hospitalId` onto the appointment at booking time
