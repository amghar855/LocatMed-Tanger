"use server";

import { requireRole } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import {
  users,
  appointments,
  medicalRecords,
  medicines,
} from "@/lib/db/schema";
import { eq, and, gte, lt, lte, like, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// ─── Types ────────────────────────────────────────────────────────────────────

type AppointmentWithPatient = {
  id: string;
  datetime: Date;
  status: string;
  reason: string | null;
  patient: {
    id: string;
    fullName: string;
    email: string;
  };
};

type MedicalRecordWithDetails = {
  id: string;
  diagnosis: string;
  notes: string;
  createdAt: Date;
  doctor: {
    fullName: string;
  };
  prescriptions: Array<{
    medicineId: string;
    medicineName: string;
    dosage: string;
    duration: string;
  }>;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function todayBounds() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

// ─── 1. Doctor stats ──────────────────────────────────────────────────────────

export async function getDoctorStats() {
  const session = await requireRole("doctor");
  const doctorId = session.user.id;

  const { start: todayStart, end: todayEnd } = todayBounds();

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const allAppointments = await db.query.appointments.findMany({
    where: eq(appointments.doctorId, doctorId),
  });

  const todayAppointments = allAppointments.filter((a) => {
    const d = new Date(a.datetime);
    return d >= todayStart && d <= todayEnd;
  });

  const weekPatients = allAppointments.filter((a) => {
    const d = new Date(a.datetime);
    return d >= sevenDaysAgo;
  });

  // Pending: completed appointments that have no linked medical record
  const completedAppointments = allAppointments.filter(
    (a) => a.status === "completed"
  );

  const allRecords = await db.query.medicalRecords.findMany({
    where: eq(medicalRecords.doctorId, doctorId),
    columns: { appointmentId: true },
  });

  const linkedAppointmentIds = new Set(
    allRecords
      .map((r) => r.appointmentId)
      .filter((id): id is string => id !== null)
  );

  const pendingRecords = completedAppointments.filter(
    (a) => !linkedAppointmentIds.has(a.id)
  ).length;

  return {
    todayAppointments: todayAppointments.length,
    weekPatients: weekPatients.length,
    pendingRecords,
  };
}

// ─── 2. Upcoming appointments ─────────────────────────────────────────────────

export async function getUpcomingAppointments(
  limit = 5
): Promise<AppointmentWithPatient[]> {
  const session = await requireRole("doctor");
  const doctorId = session.user.id;

  const now = new Date();

  const rows = await db.query.appointments.findMany({
    where: and(
      eq(appointments.doctorId, doctorId),
      eq(appointments.status, "scheduled"),
      gte(appointments.datetime, now)
    ),
    with: { patient: true },
    orderBy: (a, { asc }) => asc(a.datetime),
    limit,
  });

  return rows.map((r) => ({
    id: r.id,
    datetime: new Date(r.datetime),
    status: r.status,
    reason: r.reason,
    patient: {
      id: r.patient.id,
      fullName: r.patient.fullName,
      email: r.patient.email,
    },
  }));
}

// ─── 3. All appointments (with optional status filter) ────────────────────────

export async function getAllAppointments(
  statusFilter?: string
): Promise<AppointmentWithPatient[]> {
  const session = await requireRole("doctor");
  const doctorId = session.user.id;

  const whereClause =
    statusFilter && statusFilter !== "all"
      ? and(
          eq(appointments.doctorId, doctorId),
          eq(
            appointments.status,
            statusFilter as "scheduled" | "completed" | "cancelled"
          )
        )
      : eq(appointments.doctorId, doctorId);

  const rows = await db.query.appointments.findMany({
    where: whereClause,
    with: { patient: true },
    orderBy: (a, { desc }) => desc(a.datetime),
  });

  return rows.map((r) => ({
    id: r.id,
    datetime: new Date(r.datetime),
    status: r.status,
    reason: r.reason,
    patient: {
      id: r.patient.id,
      fullName: r.patient.fullName,
      email: r.patient.email,
    },
  }));
}

// ─── 4. Appointment by ID ─────────────────────────────────────────────────────

export async function getAppointmentById(appointmentId: string) {
  const session = await requireRole("doctor");
  const doctorId = session.user.id;

  const row = await db.query.appointments.findFirst({
    where: and(
      eq(appointments.id, appointmentId),
      eq(appointments.doctorId, doctorId)
    ),
    with: { patient: true },
  });

  if (!row) {
    throw new Error("Rendez-vous introuvable");
  }

  return {
    id: row.id,
    datetime: new Date(row.datetime),
    status: row.status,
    reason: row.reason,
    patient: {
      id: row.patient.id,
      fullName: row.patient.fullName,
      email: row.patient.email,
    },
  };
}

// ─── 5. Update appointment status ────────────────────────────────────────────

export async function updateAppointmentStatus(
  appointmentId: string,
  status: "scheduled" | "completed" | "cancelled"
) {
  const session = await requireRole("doctor");
  const doctorId = session.user.id;

  await db
    .update(appointments)
    .set({ status })
    .where(
      and(
        eq(appointments.id, appointmentId),
        eq(appointments.doctorId, doctorId)
      )
    );

  revalidatePath("/doctor/appointments");
  revalidatePath(`/doctor/appointments/${appointmentId}`);

  return { success: true };
}

// ─── 6. Search patients ───────────────────────────────────────────────────────

export async function searchPatients(query: string) {
  await requireRole("doctor");

  if (query.trim().length < 2) return [];

  const term = `%${query.trim()}%`;

  const rows = await db.query.users.findMany({
    where: and(
      eq(users.role, "patient"),
      or(like(users.fullName, term), like(users.email, term))
    ),
    columns: { id: true, fullName: true, email: true },
    limit: 10,
  });

  return rows;
}

// ─── 7. Get patient by ID ─────────────────────────────────────────────────────

export async function getPatientById(patientId: string) {
  await requireRole("doctor");

  const patient = await db.query.users.findFirst({
    where: and(eq(users.id, patientId), eq(users.role, "patient")),
    columns: { id: true, fullName: true, email: true },
  });

  if (!patient) throw new Error("Patient introuvable");

  return patient;
}

// ─── 8. Get patient medical records ──────────────────────────────────────────

export async function getPatientMedicalRecords(
  patientId: string
): Promise<MedicalRecordWithDetails[]> {
  await requireRole("doctor");

  const records = await db.query.medicalRecords.findMany({
    where: eq(medicalRecords.patientId, patientId),
    with: { doctor: { columns: { fullName: true } } },
    orderBy: (r, { desc }) => desc(r.createdAt),
  });

  // Collect all medicine IDs referenced in prescriptions
  const medicineIds = new Set<string>();
  for (const r of records) {
    for (const p of r.prescription ?? []) {
      medicineIds.add(p.medicineId);
    }
  }

  // Batch-fetch medicine names
  const medicineMap = new Map<string, string>();
  if (medicineIds.size > 0) {
    const meds = await db.query.medicines.findMany({
      columns: { id: true, name: true },
    });
    for (const m of meds) {
      medicineMap.set(m.id, m.name);
    }
  }

  return records.map((r) => ({
    id: r.id,
    diagnosis: r.diagnosis,
    notes: r.notes,
    createdAt: new Date(r.createdAt),
    doctor: { fullName: r.doctor.fullName },
    prescriptions: (r.prescription ?? []).map((p) => ({
      medicineId: p.medicineId,
      medicineName: medicineMap.get(p.medicineId) ?? p.medicineId,
      dosage: p.dosage,
      duration: p.duration,
    })),
  }));
}

// ─── 9. Create medical record ─────────────────────────────────────────────────

export async function createMedicalRecord(data: {
  patientId: string;
  appointmentId?: string;
  diagnosis: string;
  notes?: string;
  prescriptions: Array<{
    medicineId: string;
    dosage: string;
    duration: string;
    instructions?: string;
  }>;
}) {
  const session = await requireRole("doctor");
  const doctorId = session.user.id;

  const { randomUUID } = await import("crypto");
  const recordId = randomUUID();

  await db.insert(medicalRecords).values({
    id: recordId,
    patientId: data.patientId,
    doctorId,
    appointmentId: data.appointmentId ?? null,
    date: new Date(),
    diagnosis: data.diagnosis,
    notes: data.notes ?? "",
    prescription: data.prescriptions.map((p) => ({
      medicineId: p.medicineId,
      dosage: p.dosage,
      duration: p.duration,
    })),
    createdAt: new Date(),
  });

  if (data.appointmentId) {
    await db
      .update(appointments)
      .set({ status: "completed" })
      .where(
        and(
          eq(appointments.id, data.appointmentId),
          eq(appointments.doctorId, doctorId)
        )
      );
  }

  revalidatePath(`/doctor/patients/${data.patientId}`);
  if (data.appointmentId) {
    revalidatePath(`/doctor/appointments/${data.appointmentId}`);
    revalidatePath("/doctor/appointments");
  }
  revalidatePath("/doctor");

  return { success: true, recordId };
}

// ─── 10. Search medicines ─────────────────────────────────────────────────────

export async function searchMedicines(query: string) {
  await requireRole("doctor");

  if (query.trim().length < 2) return [];

  const term = `%${query.trim()}%`;

  const rows = await db.query.medicines.findMany({
    where: like(medicines.name, term),
    columns: { id: true, name: true, activeIngredient: true, dosageForm: true },
    limit: 10,
  });

  return rows;
}
