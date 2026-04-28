import {
  mysqlTable,
  varchar,
  int,
  double,
  boolean,
  timestamp,
  text,
  json,
  mysqlEnum,
  uniqueIndex,
} from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";

// ─── Hospitals ───────────────────────────────────────────────────────────────

export const hospitals = mysqlTable("hospitals", {
  id: varchar("id", { length: 191 }).primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  type: mysqlEnum("type", ["public", "private", "chu"]).notNull(),
  lat: double("lat").notNull(),
  lng: double("lng").notNull(),
  address: text("address").notNull(),
  city: varchar("city", { length: 100 }).notNull(),
  phone: varchar("phone", { length: 50 }),
  specialties: json("specialties").$type<string[]>(),
});

// ─── Pharmacies ──────────────────────────────────────────────────────────────

export const pharmacies = mysqlTable("pharmacies", {
  id: varchar("id", { length: 191 }).primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  lat: double("lat").notNull(),
  lng: double("lng").notNull(),
  address: text("address"),
  city: varchar("city", { length: 100 }).notNull(),
  neighborhood: varchar("neighborhood", { length: 100 }),
  isOnDuty: boolean("is_on_duty").default(false).notNull(),
  openingHours: varchar("opening_hours", { length: 50 }),
});

// ─── Users ───────────────────────────────────────────────────────────────────

export const users = mysqlTable("users", {
  id: varchar("id", { length: 191 }).primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  role: mysqlEnum("role", ["patient", "hospital_admin", "doctor", "pharmacist"]).notNull(),
  fullName: varchar("full_name", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 50 }),
  // doctor / hospital_admin-specific
  specialty: varchar("specialty", { length: 255 }),
  hospitalId: varchar("hospital_id", { length: 191 }).references(() => hospitals.id),
  // pharmacist-specific
  pharmacyId: varchar("pharmacy_id", { length: 191 }).references(() => pharmacies.id),
  // set when a hospital_admin creates a doctor account
  createdBy: varchar("created_by", { length: 191 }).references((): ReturnType<typeof varchar> => users.id),
  createdAt: timestamp("created_at", { mode: "date", fsp: 3 }).notNull(),
});

// ─── Medicines ───────────────────────────────────────────────────────────────

export const medicines = mysqlTable("medicines", {
  id: varchar("id", { length: 191 }).primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  activeIngredient: varchar("active_ingredient", { length: 255 }).notNull(),
  dosageForm: varchar("dosage_form", { length: 255 }),
  ppm: double("ppm"),
  isGeneric: boolean("is_generic").default(false),
});

// ─── Pharmacy Stock ──────────────────────────────────────────────────────────

export const pharmacyStock = mysqlTable("pharmacy_stock", {
  id: int("id").autoincrement().primaryKey(),
  pharmacyId: varchar("pharmacy_id", { length: 191 })
    .notNull()
    .references(() => pharmacies.id),
  medicineId: varchar("medicine_id", { length: 191 })
    .notNull()
    .references(() => medicines.id),
  quantity: int("quantity").notNull().default(0),
  price: double("price").notNull(),
  minThreshold: int("min_threshold").notNull().default(5),
  expiryDate: timestamp("expiry_date", { mode: "date", fsp: 3 }),
  updatedAt: timestamp("updated_at", { mode: "date", fsp: 3 }).notNull(),
});

// ─── Reservations ─────────────────────────────────────────────────────────────

export const reservations = mysqlTable("reservations", {
  id: int("id").autoincrement().primaryKey(),
  pharmacyId: varchar("pharmacy_id", { length: 191 })
    .notNull()
    .references(() => pharmacies.id),
  medicineId: varchar("medicine_id", { length: 191 })
    .notNull()
    .references(() => medicines.id),
  userId: varchar("user_id", { length: 191 }).references(() => users.id),
  citizenName: varchar("citizen_name", { length: 255 }).notNull(),
  citizenPhone: varchar("citizen_phone", { length: 50 }).notNull(),
  status: mysqlEnum("status", ["pending", "confirmed", "collected", "cancelled"])
    .notNull()
    .default("pending"),
  createdAt: timestamp("created_at", { mode: "date", fsp: 3 }).notNull(),
  updatedAt: timestamp("updated_at", { mode: "date", fsp: 3 }).notNull(),
});

// ─── Notification Requests ────────────────────────────────────────────────────

export const notificationRequests = mysqlTable("notification_requests", {
  id: int("id").autoincrement().primaryKey(),
  pharmacyId: varchar("pharmacy_id", { length: 191 })
    .notNull()
    .references(() => pharmacies.id),
  medicineId: varchar("medicine_id", { length: 191 })
    .notNull()
    .references(() => medicines.id),
  email: varchar("email", { length: 255 }),
  phoneNumber: varchar("phone_number", { length: 50 }),
  status: mysqlEnum("status", ["pending", "sent"]).notNull().default("pending"),
  createdAt: timestamp("created_at", { mode: "date", fsp: 3 }).notNull(),
});

// ─── Appointments ─────────────────────────────────────────────────────────────

export const appointments = mysqlTable("appointments", {
  id: varchar("id", { length: 191 }).primaryKey(),
  patientId: varchar("patient_id", { length: 191 })
    .notNull()
    .references(() => users.id),
  doctorId: varchar("doctor_id", { length: 191 })
    .notNull()
    .references(() => users.id),
  hospitalId: varchar("hospital_id", { length: 191 })
    .notNull()
    .references(() => hospitals.id),
  datetime: timestamp("datetime", { mode: "date", fsp: 3 }).notNull(),
  status: mysqlEnum("status", ["scheduled", "completed", "cancelled"])
    .notNull()
    .default("scheduled"),
  reason: text("reason"),
  createdAt: timestamp("created_at", { mode: "date", fsp: 3 }).notNull(),
});

// ─── Patient Favorite Hospitals ───────────────────────────────────────────────

export const patientFavoriteHospitals = mysqlTable(
  "patient_favorite_hospitals",
  {
    id: int("id").autoincrement().primaryKey(),
    patientId: varchar("patient_id", { length: 191 })
      .notNull()
      .references(() => users.id),
    hospitalId: varchar("hospital_id", { length: 191 })
      .notNull()
      .references(() => hospitals.id),
    createdAt: timestamp("created_at", { mode: "date", fsp: 3 }).notNull(),
  },
  (table) => ({
    patientHospitalUnique: uniqueIndex("favorites_patient_hospital_unique").on(
      table.patientId,
      table.hospitalId
    ),
  })
);

// ─── Medical Records ──────────────────────────────────────────────────────────

export const medicalRecords = mysqlTable("medical_records", {
  id: varchar("id", { length: 191 }).primaryKey(),
  patientId: varchar("patient_id", { length: 191 })
    .notNull()
    .references(() => users.id),
  doctorId: varchar("doctor_id", { length: 191 })
    .notNull()
    .references(() => users.id),
  appointmentId: varchar("appointment_id", { length: 191 }).references(() => appointments.id),
  date: timestamp("date", { mode: "date", fsp: 3 }).notNull(),
  diagnosis: text("diagnosis").notNull(),
  notes: text("notes").notNull(),
  prescription: json("prescription").$type<
    Array<{ medicineId: string; dosage: string; duration: string }>
  >(),
  createdAt: timestamp("created_at", { mode: "date", fsp: 3 }).notNull(),
});

// ─── Relations ────────────────────────────────────────────────────────────────

export const hospitalsRelations = relations(hospitals, ({ many }) => ({
  doctors: many(users),
  appointments: many(appointments),
  favoritedByPatients: many(patientFavoriteHospitals),
}));

export const pharmaciesRelations = relations(pharmacies, ({ many }) => ({
  staff: many(users),
  stock: many(pharmacyStock),
  reservations: many(reservations),
  notificationRequests: many(notificationRequests),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  hospital: one(hospitals, {
    fields: [users.hospitalId],
    references: [hospitals.id],
  }),
  pharmacy: one(pharmacies, {
    fields: [users.pharmacyId],
    references: [pharmacies.id],
  }),
  // doctor → the hospital_admin who created them
  creator: one(users, {
    fields: [users.createdBy],
    references: [users.id],
    relationName: "createdDoctors",
  }),
  // hospital_admin → doctors they created
  createdDoctors: many(users, { relationName: "createdDoctors" }),
  appointmentsAsPatient: many(appointments, { relationName: "patientAppointments" }),
  appointmentsAsDoctor: many(appointments, { relationName: "doctorAppointments" }),
  medicalRecordsAsPatient: many(medicalRecords, { relationName: "patientRecords" }),
  medicalRecordsAsDoctor: many(medicalRecords, { relationName: "doctorRecords" }),
  favoriteHospitals: many(patientFavoriteHospitals),
}));

export const medicinesRelations = relations(medicines, ({ many }) => ({
  stock: many(pharmacyStock),
  reservations: many(reservations),
  notificationRequests: many(notificationRequests),
}));

export const reservationsRelations = relations(reservations, ({ one }) => ({
  pharmacy: one(pharmacies, {
    fields: [reservations.pharmacyId],
    references: [pharmacies.id],
  }),
  medicine: one(medicines, {
    fields: [reservations.medicineId],
    references: [medicines.id],
  }),
  user: one(users, {
    fields: [reservations.userId],
    references: [users.id],
  }),
}));

export const notificationRequestsRelations = relations(notificationRequests, ({ one }) => ({
  pharmacy: one(pharmacies, {
    fields: [notificationRequests.pharmacyId],
    references: [pharmacies.id],
  }),
  medicine: one(medicines, {
    fields: [notificationRequests.medicineId],
    references: [medicines.id],
  }),
}));

export const pharmacyStockRelations = relations(pharmacyStock, ({ one }) => ({
  pharmacy: one(pharmacies, {
    fields: [pharmacyStock.pharmacyId],
    references: [pharmacies.id],
  }),
  medicine: one(medicines, {
    fields: [pharmacyStock.medicineId],
    references: [medicines.id],
  }),
}));

export const appointmentsRelations = relations(appointments, ({ one, many }) => ({
  patient: one(users, {
    fields: [appointments.patientId],
    references: [users.id],
    relationName: "patientAppointments",
  }),
  doctor: one(users, {
    fields: [appointments.doctorId],
    references: [users.id],
    relationName: "doctorAppointments",
  }),
  hospital: one(hospitals, {
    fields: [appointments.hospitalId],
    references: [hospitals.id],
  }),
  medicalRecord: many(medicalRecords),
}));

export const patientFavoriteHospitalsRelations = relations(
  patientFavoriteHospitals,
  ({ one }) => ({
    patient: one(users, {
      fields: [patientFavoriteHospitals.patientId],
      references: [users.id],
    }),
    hospital: one(hospitals, {
      fields: [patientFavoriteHospitals.hospitalId],
      references: [hospitals.id],
    }),
  })
);

export const medicalRecordsRelations = relations(medicalRecords, ({ one }) => ({
  patient: one(users, {
    fields: [medicalRecords.patientId],
    references: [users.id],
    relationName: "patientRecords",
  }),
  doctor: one(users, {
    fields: [medicalRecords.doctorId],
    references: [users.id],
    relationName: "doctorRecords",
  }),
  appointment: one(appointments, {
    fields: [medicalRecords.appointmentId],
    references: [appointments.id],
  }),
}));

// ─── Inferred types ───────────────────────────────────────────────────────────

export type Role = "patient" | "hospital_admin" | "doctor" | "pharmacist";
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Hospital = typeof hospitals.$inferSelect;
export type NewHospital = typeof hospitals.$inferInsert;
export type Pharmacy = typeof pharmacies.$inferSelect;
export type NewPharmacy = typeof pharmacies.$inferInsert;
export type Medicine = typeof medicines.$inferSelect;
export type NewMedicine = typeof medicines.$inferInsert;
export type PharmacyStock = typeof pharmacyStock.$inferSelect;
export type NewPharmacyStock = typeof pharmacyStock.$inferInsert;
export type Appointment = typeof appointments.$inferSelect;
export type NewAppointment = typeof appointments.$inferInsert;
export type PatientFavoriteHospital = typeof patientFavoriteHospitals.$inferSelect;
export type NewPatientFavoriteHospital = typeof patientFavoriteHospitals.$inferInsert;
export type MedicalRecord = typeof medicalRecords.$inferSelect;
export type NewMedicalRecord = typeof medicalRecords.$inferInsert;
export type Reservation = typeof reservations.$inferSelect;
export type NewReservation = typeof reservations.$inferInsert;
export type NotificationRequest = typeof notificationRequests.$inferSelect;
export type NewNotificationRequest = typeof notificationRequests.$inferInsert;
