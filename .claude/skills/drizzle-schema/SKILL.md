---
name: drizzle-schema
description: Modifies the Drizzle SQLite schema and generates migrations safely for LOCATOMED. USE THIS SKILL whenever the user mentions schema, tables, columns, migrations, foreign keys, indexes, or any database structure changes.
---

# Drizzle schema changes

## Workflow
1. Edit `lib/db/schema.ts`
2. Run `npm run db:generate` — creates a new file in `drizzle/migrations/`
3. Review the generated SQL — don't trust it blindly
4. Run `npm run db:migrate` — applies it
5. Types are inferred automatically from schema (no codegen step)

## SQLite gotchas
- No `ALTER COLUMN TYPE` — column changes recreate the table
- Foreign keys require `PRAGMA foreign_keys = ON` (enable in DB client)
- Use `text()` with `enum` option for role columns — SQLite has no enum type
- Dates: store as integer (unix ms) with `integer({ mode: "timestamp_ms" })`
- JSON: `text({ mode: "json" }).$type<MyShape>()` for prescription_json etc.
- UUIDs: use `text()` with `crypto.randomUUID()` default at insert time

## Core entity reference

```typescript
import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role", { enum: ["patient", "doctor", "pharmacist"] }).notNull(),
  fullName: text("full_name").notNull(),
  phone: text("phone"),
  // doctor-specific
  specialty: text("specialty"),
  hospitalId: text("hospital_id").references(() => hospitals.id),
  // pharmacist-specific
  pharmacyId: text("pharmacy_id").references(() => pharmacies.id),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
});

export const hospitals = sqliteTable("hospitals", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type", { enum: ["public", "private", "chu"] }).notNull(),
  lat: real("lat").notNull(),
  lng: real("lng").notNull(),
  address: text("address").notNull(),
  phone: text("phone"),
  specialties: text("specialties", { mode: "json" }).$type<string[]>(),
});

export const pharmacies = sqliteTable("pharmacies", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  lat: real("lat").notNull(),
  lng: real("lng").notNull(),
  address: text("address"),
  neighborhood: text("neighborhood"),          // Medina, Malabata, Branes, etc.
  isOnDuty: integer("is_on_duty", { mode: "boolean" }).default(false).notNull(),
  openingHours: text("opening_hours"),
});

export const medicines = sqliteTable("medicines", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  activeIngredient: text("active_ingredient").notNull(),
  dosageForm: text("dosage_form"),               // comprimé, sirop, pommade, etc.
  ppm: real("ppm"),                               // Prix Public Maroc (MAD)
  isGeneric: integer("is_generic", { mode: "boolean" }).default(false),
});

export const pharmacyStock = sqliteTable("pharmacy_stock", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  pharmacyId: text("pharmacy_id").notNull().references(() => pharmacies.id),
  medicineId: text("medicine_id").notNull().references(() => medicines.id),
  quantity: integer("quantity").notNull().default(0),
  price: real("price").notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
});

export const appointments = sqliteTable("appointments", {
  id: text("id").primaryKey(),
  patientId: text("patient_id").notNull().references(() => users.id),
  doctorId: text("doctor_id").notNull().references(() => users.id),
  hospitalId: text("hospital_id").notNull().references(() => hospitals.id),
  datetime: integer("datetime", { mode: "timestamp_ms" }).notNull(),
  status: text("status", { enum: ["scheduled", "completed", "cancelled"] })
    .notNull().default("scheduled"),
  reason: text("reason"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
});

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

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Hospital = typeof hospitals.$inferSelect;
export type Pharmacy = typeof pharmacies.$inferSelect;
```

## drizzle.config.ts

```typescript
import type { Config } from "drizzle-kit";

export default {
  schema: "./lib/db/schema.ts",
  out: "./drizzle/migrations",
  dialect: "sqlite",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "file:./data/locatomed.db",
  },
} satisfies Config;
```

## Pitfalls
- Don't hand-edit generated migrations unless you know what you're doing
- Don't forget `.references(() => otherTable.id)` for foreign keys
- Don't use numeric autoIncrement for entity IDs — use UUIDs for anything
  that might be shared (users, hospitals, pharmacies, medicines).
  Autoincrement is fine for pure join tables like `pharmacy_stock`
- Enable WAL mode for better concurrent reads: `PRAGMA journal_mode = WAL`
- For Turso production, use `@libsql/client` instead of `better-sqlite3`
- Every doctor user must have a `hospital_id` set — validate in signup
- Every pharmacist user must have a `pharmacy_id` set
