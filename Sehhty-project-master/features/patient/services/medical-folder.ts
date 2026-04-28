import { and, desc, eq, gte, inArray, lte, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { appointments, hospitals, medicalRecords, medicines, users } from "@/lib/db/schema";
import type {
  MedicalFolderDoctorOption,
  MedicalFolderFilters,
  MedicalFolderRecord,
} from "@/features/patient/types/medical-folder";

type PrescriptionValue = Array<{
  medicineId: string;
  dosage: string;
  duration: string;
}>;

export async function listMedicalFolderDoctors(patientId: string): Promise<MedicalFolderDoctorOption[]> {
  const rows = await db
    .select({
      id: users.id,
      fullName: users.fullName,
      specialty: users.specialty,
    })
    .from(medicalRecords)
    .innerJoin(users, eq(medicalRecords.doctorId, users.id))
    .where(eq(medicalRecords.patientId, patientId))
    .groupBy(users.id, users.fullName, users.specialty)
    .orderBy(users.fullName);

  return rows;
}

export async function listMedicalFolderRecords(
  patientId: string,
  filters: MedicalFolderFilters = {}
): Promise<MedicalFolderRecord[]> {
  const whereClause = and(
    eq(medicalRecords.patientId, patientId),
    filters.doctorId ? eq(medicalRecords.doctorId, filters.doctorId) : undefined,
    filters.from ? gte(medicalRecords.date, filters.from) : undefined,
    filters.to ? lte(medicalRecords.date, filters.to) : undefined
  );

  const rows = await db
    .select({
      id: medicalRecords.id,
      date: medicalRecords.date,
      diagnosis: medicalRecords.diagnosis,
      notes: medicalRecords.notes,
      prescription: medicalRecords.prescription,
      doctorId: users.id,
      doctorName: users.fullName,
      doctorSpecialty: users.specialty,
      hospitalName: hospitals.name,
    })
    .from(medicalRecords)
    .innerJoin(users, eq(medicalRecords.doctorId, users.id))
    .leftJoin(appointments, eq(medicalRecords.appointmentId, appointments.id))
    .leftJoin(hospitals, eq(appointments.hospitalId, hospitals.id))
    .where(whereClause)
    .orderBy(desc(medicalRecords.date));

  const medicineIds = Array.from(
    new Set(
      rows
        .flatMap((row) => (row.prescription ?? []) as PrescriptionValue)
        .map((item) => item.medicineId)
        .filter(Boolean)
    )
  );

  const medicineNameMap = new Map<string, string>();
  if (medicineIds.length > 0) {
    const medicineRows = await db
      .select({ id: medicines.id, name: medicines.name })
      .from(medicines)
      .where(inArray(medicines.id, medicineIds));

    for (const medicine of medicineRows) {
      medicineNameMap.set(medicine.id, medicine.name);
    }
  }

  return rows.map((row) => ({
    id: row.id,
    date: row.date,
    diagnosis: row.diagnosis,
    notes: row.notes,
    doctorId: row.doctorId,
    doctorName: row.doctorName,
    doctorSpecialty: row.doctorSpecialty,
    hospitalName: row.hospitalName,
    prescription: ((row.prescription ?? []) as PrescriptionValue).map((item) => ({
      medicineId: item.medicineId,
      medicineName: medicineNameMap.get(item.medicineId) ?? item.medicineId,
      dosage: item.dosage,
      duration: item.duration,
    })),
  }));
}
