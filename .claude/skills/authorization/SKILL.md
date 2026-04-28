---
name: authorization
description: Enforces role-based authorization in LOCATOMED's server actions and queries. USE THIS SKILL any time a server action is written or modified, any time the user mentions permissions, roles, access control, who-can-do-what, or security, and any time data is scoped to a specific user. CRITICAL — this is the ONLY authorization layer (no RLS with SQLite).
---

# Authorization in LOCATOMED (SQLite edition)

## The golden rule
The database does NOT enforce access control. Every server action that reads
or writes user-scoped data MUST:
1. Call `requireRole()` at the top
2. Scope every query to the authenticated user's allowed rows

Miss either step and you have a security hole.

## The guards (in `lib/auth/guards.ts`)

```typescript
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export type Role = "patient" | "doctor" | "pharmacist";

export async function requireSession() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return session;
}

export async function requireRole(role: Role | Role[]) {
  const session = await requireSession();
  const allowed = Array.isArray(role) ? role : [role];
  if (!allowed.includes(session.user.role as Role)) {
    throw new Error("Forbidden");
  }
  return session;
}
```

## Standard patterns

### Patient reading own records
```typescript
"use server";
export async function getMyRecords() {
  const session = await requireRole("patient");
  return db.select().from(medicalRecords)
    .where(eq(medicalRecords.patientId, session.user.id));
}
```

### Doctor reading a specific patient's records (must have appointment)
```typescript
"use server";
export async function getPatientRecords(patientId: string) {
  const session = await requireRole("doctor");

  const hasAppointment = await db.select({ id: appointments.id })
    .from(appointments)
    .where(and(
      eq(appointments.doctorId, session.user.id),
      eq(appointments.patientId, patientId),
    ))
    .limit(1);

  if (hasAppointment.length === 0) throw new Error("Forbidden");

  return db.select().from(medicalRecords)
    .where(eq(medicalRecords.patientId, patientId));
}
```

### Pharmacist editing own pharmacy's stock
```typescript
"use server";
export async function updateStock(stockId: number, quantity: number) {
  const session = await requireRole("pharmacist");
  const profile = await db.select().from(users)
    .where(eq(users.id, session.user.id)).limit(1);
  const pharmacyId = profile[0]?.pharmacyId;
  if (!pharmacyId) throw new Error("Forbidden");

  return db.update(pharmacyStock)
    .set({ quantity, updatedAt: new Date() })
    .where(and(
      eq(pharmacyStock.id, stockId),
      eq(pharmacyStock.pharmacyId, pharmacyId),  // critical scope
    ));
}
```

## Review checklist for every server action
- [ ] First line is `requireSession()` or `requireRole(...)`
- [ ] Every query is scoped to the authenticated user's allowed rows
- [ ] IDs from the client are validated, never trusted
- [ ] Zod-validated input before any DB call
- [ ] Returns only what the caller is allowed to see

## Pitfalls
- Don't rely on UI hiding buttons — server actions are reachable directly
- Don't use session data in the WHERE clause without `requireRole` first
- Don't forget to scope UPDATE/DELETE by ownership, not just ID
- Don't log full session objects — they contain tokens
