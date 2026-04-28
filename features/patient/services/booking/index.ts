import { randomUUID } from "crypto";
import { and, eq, ne } from "drizzle-orm";
import { db } from "@/lib/db";
import { appointments, hospitals, users } from "@/lib/db/schema";
import type {
  BookingDoctorOption,
  BookingHospitalOption,
  BookingOptionsData,
  Reservation,
} from "@/features/patient/types/booking";

function mapAppointmentStatus(status: "scheduled" | "completed" | "cancelled") {
  if (status === "completed") return "completed" as const;
  if (status === "cancelled") return "canceled" as const;
  return "upcoming" as const;
}

export async function getBookingOptions(): Promise<BookingOptionsData> {
  const [hospitalRows, doctorRows] = await Promise.all([
    db
      .select({ id: hospitals.id, name: hospitals.name, type: hospitals.type })
      .from(hospitals)
      .orderBy(hospitals.name),
    db
      .select({
        id: users.id,
        fullName: users.fullName,
        specialty: users.specialty,
        hospitalId: users.hospitalId,
        hospitalName: hospitals.name,
      })
      .from(users)
      .innerJoin(hospitals, eq(users.hospitalId, hospitals.id))
      .where(eq(users.role, "doctor"))
      .orderBy(users.fullName),
  ]);

  const doctors: BookingDoctorOption[] = doctorRows
    .filter((row) => row.hospitalId && row.specialty)
    .map((row) => ({
      id: row.id,
      fullName: row.fullName,
      specialty: row.specialty ?? "Médecine générale",
      hospitalId: row.hospitalId!,
      hospitalName: row.hospitalName,
    }));

  const specialties = Array.from(new Set(doctors.map((d) => d.specialty))).sort((a, b) =>
    a.localeCompare(b)
  );

  return {
    hospitals: hospitalRows as BookingHospitalOption[],
    doctors,
    specialties,
  };
}

export async function getReservations(patientId: string): Promise<Reservation[]> {
  const rows = await db
    .select({
      id: appointments.id,
      datetime: appointments.datetime,
      status: appointments.status,
      hospitalName: hospitals.name,
      doctorName: users.fullName,
      specialty: users.specialty,
    })
    .from(appointments)
    .innerJoin(hospitals, eq(appointments.hospitalId, hospitals.id))
    .innerJoin(users, eq(appointments.doctorId, users.id))
    .where(eq(appointments.patientId, patientId))
    .orderBy(appointments.datetime);

  return rows.map((row) => ({
    id: row.id,
    hospitalName: row.hospitalName,
    doctorName: row.doctorName,
    specialty: row.specialty ?? "Médecine générale",
    datetime: row.datetime,
    status: mapAppointmentStatus(row.status),
  }));
}

export async function createReservation(
  patientId: string,
  data: {
    hospitalId: string;
    specialty: string;
    doctorId: string;
    date: string;
    time: string;
    reason?: string;
  }
): Promise<{ ok: boolean; error?: string }> {
  const doctor = await db.query.users.findFirst({
    where: and(eq(users.id, data.doctorId), eq(users.role, "doctor")),
    columns: {
      id: true,
      hospitalId: true,
      specialty: true,
    },
  });

  if (!doctor?.hospitalId) {
    return { ok: false, error: "Médecin introuvable" };
  }

  if (doctor.hospitalId !== data.hospitalId || doctor.specialty !== data.specialty) {
    return { ok: false, error: "Le médecin choisi ne correspond pas aux filtres" };
  }

  const datetime = new Date(`${data.date}T${data.time}:00`);
  if (Number.isNaN(datetime.getTime())) {
    return { ok: false, error: "Date ou heure invalide" };
  }

  if (datetime.getTime() < Date.now() + 60 * 60 * 1000) {
    return { ok: false, error: "Choisissez un créneau au moins 1h à l'avance" };
  }

  const conflict = await db.query.appointments.findFirst({
    where: and(
      eq(appointments.doctorId, data.doctorId),
      eq(appointments.datetime, datetime),
      ne(appointments.status, "cancelled")
    ),
    columns: { id: true },
  });

  if (conflict) {
    return { ok: false, error: "Ce créneau vient d'être réservé" };
  }

  await db.insert(appointments).values({
    id: randomUUID(),
    patientId,
    doctorId: data.doctorId,
    hospitalId: data.hospitalId,
    datetime,
    status: "scheduled",
    reason: data.reason ?? null,
    createdAt: new Date(),
  });

  return { ok: true };
}

export async function cancelReservation(patientId: string, reservationId: string) {
  await db
    .update(appointments)
    .set({ status: "cancelled" })
    .where(
      and(
        eq(appointments.id, reservationId),
        eq(appointments.patientId, patientId),
        eq(appointments.status, "scheduled")
      )
    );

  return { ok: true };
}
