import { sqliteTable, text, integer, real, uniqueIndex } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";

// ─── Hospitals ───────────────────────────────────────────────────────────────

export const hospitals = sqliteTable("hospitals", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type", { enum: ["public", "private", "chu"] }).notNull(),
  lat: real("lat").notNull(),
  lng: real("lng").notNull(),
  address: text("address").notNull(),
  city: text("city").notNull(),
  phone: text("phone"),
  specialties: text("specialties", { mode: "json" }).$type<string[]>(),
});

// ─── Pharmacies ──────────────────────────────────────────────────────────────

export const pharmacies = sqliteTable("pharmacies", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  lat: real("lat").notNull(),
  lng: real("lng").notNull(),
  address: text("address"),
  city: text("city").notNull(),
  neighborhood: text("neighborhood"),
  isOnDuty: integer("is_on_duty", { mode: "boolean" }).default(false).notNull(),
  openingHours: text("opening_hours"),
});

// ─── Users ───────────────────────────────────────────────────────────────────

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role", { enum: ["patient", "hospital_admin", "doctor", "pharmacist"] }).notNull(),
  fullName: text("full_name").notNull(),
  phone: text("phone"),
  // doctor / hospital_admin-specific
  specialty: text("specialty"),
  hospitalId: text("hospital_id").references(() => hospitals.id),
  // pharmacist-specific
  pharmacyId: text("pharmacy_id").references(() => pharmacies.id),
  // set when a hospital_admin creates a doctor account
  createdBy: text("created_by").references((): ReturnType<typeof text> => users.id),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
});

// ─── Medicines ───────────────────────────────────────────────────────────────

export const medicines = sqliteTable("medicines", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  activeIngredient: text("active_ingredient").notNull(),
  dosageForm: text("dosage_form"),
  ppm: real("ppm"),
  isGeneric: integer("is_generic", { mode: "boolean" }).default(false),
});

// ─── Pharmacy Stock ──────────────────────────────────────────────────────────

export const pharmacyStock = sqliteTable("pharmacy_stock", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  pharmacyId: text("pharmacy_id")
    .notNull()
    .references(() => pharmacies.id),
  medicineId: text("medicine_id")
    .notNull()
    .references(() => medicines.id),
  quantity: integer("quantity").notNull().default(0),
  price: real("price").notNull(),
  minThreshold: integer("min_threshold").notNull().default(5),
  expiryDate: integer("expiry_date", { mode: "timestamp_ms" }),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
});

// ─── Reservations ─────────────────────────────────────────────────────────────

export const reservations = sqliteTable("reservations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  pharmacyId: text("pharmacy_id")
    .notNull()
    .references(() => pharmacies.id),
  medicineId: text("medicine_id")
    .notNull()
    .references(() => medicines.id),
  userId: text("user_id").references(() => users.id),
  citizenName: text("citizen_name").notNull(),
  citizenPhone: text("citizen_phone").notNull(),
  status: text("status", {
    enum: ["pending", "confirmed", "collected", "cancelled"],
  })
    .notNull()
    .default("pending"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
});

// ─── Notification Requests ────────────────────────────────────────────────────

export const notificationRequests = sqliteTable("notification_requests", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  pharmacyId: text("pharmacy_id")
    .notNull()
    .references(() => pharmacies.id),
  medicineId: text("medicine_id")
    .notNull()
    .references(() => medicines.id),
  email: text("email"),
  phoneNumber: text("phone_number"),
  status: text("status", { enum: ["pending", "sent"] }).notNull().default("pending"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
});

// ─── Appointments ─────────────────────────────────────────────────────────────

export const appointments = sqliteTable("appointments", {
  id: text("id").primaryKey(),
  patientId: text("patient_id")
    .notNull()
    .references(() => users.id),
  doctorId: text("doctor_id")
    .notNull()
    .references(() => users.id),
  hospitalId: text("hospital_id")
    .notNull()
    .references(() => hospitals.id),
  datetime: integer("datetime", { mode: "timestamp_ms" }).notNull(),
  status: text("status", {
    enum: ["scheduled", "completed", "cancelled"],
  })
    .notNull()
    .default("scheduled"),
  reason: text("reason"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
});

// ─── Patient Favorite Hospitals ───────────────────────────────────────────────

export const patientFavoriteHospitals = sqliteTable(
  "patient_favorite_hospitals",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    patientId: text("patient_id")
      .notNull()
      .references(() => users.id),
    hospitalId: text("hospital_id")
      .notNull()
      .references(() => hospitals.id),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => ({
    patientHospitalUnique: uniqueIndex("favorites_patient_hospital_unique").on(
      table.patientId,
      table.hospitalId
    ),
  })
);

// ─── Medical Records ──────────────────────────────────────────────────────────

export const medicalRecords = sqliteTable("medical_records", {
  id: text("id").primaryKey(),
  patientId: text("patient_id")
    .notNull()
    .references(() => users.id),
  doctorId: text("doctor_id")
    .notNull()
    .references(() => users.id),
  appointmentId: text("appointment_id").references(() => appointments.id),
  date: integer("date", { mode: "timestamp_ms" }).notNull(),
  diagnosis: text("diagnosis").notNull(),
  notes: text("notes").notNull(),
  prescription: text("prescription", { mode: "json" }).$type<
    Array<{ medicineId: string; dosage: string; duration: string }>
  >(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
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
