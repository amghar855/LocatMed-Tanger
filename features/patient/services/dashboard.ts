import { and, eq, gte } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  appointments,
  hospitals,
  patientFavoriteHospitals,
  users,
} from "@/lib/db/schema";
import { PatientDashboardData } from "@/features/patient/types/dashboard";

function mapAppointmentStatus(status: "scheduled" | "completed" | "cancelled") {
  if (status === "completed") return "completed" as const;
  if (status === "cancelled") return "canceled" as const;
  return "upcoming" as const;
}

export async function getPatientDashboardData(
  patientId: string
): Promise<PatientDashboardData> {
  const now = new Date();

  const [upcomingRow, allAppointments, favoriteRows] = await Promise.all([
    db
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
      .where(
        and(
          eq(appointments.patientId, patientId),
          eq(appointments.status, "scheduled"),
          gte(appointments.datetime, now)
        )
      )
      .orderBy(appointments.datetime)
      .limit(1),
    db
      .select({ status: appointments.status })
      .from(appointments)
      .where(eq(appointments.patientId, patientId)),
    db
      .select({ id: patientFavoriteHospitals.id })
      .from(patientFavoriteHospitals)
      .where(eq(patientFavoriteHospitals.patientId, patientId)),
  ]);

  const upcomingCount = allAppointments.filter((a) => a.status === "scheduled").length;
  const completedCount = allAppointments.filter((a) => a.status === "completed").length;
  const canceledCount = allAppointments.filter((a) => a.status === "cancelled").length;

  return {
    upcomingReservation: upcomingRow[0]
      ? {
          id: upcomingRow[0].id,
          hospitalName: upcomingRow[0].hospitalName,
          doctorName: upcomingRow[0].doctorName,
          specialty: upcomingRow[0].specialty ?? "Médecine générale",
          datetime: upcomingRow[0].datetime,
          status: mapAppointmentStatus(upcomingRow[0].status),
        }
      : null,
    favoritesCount: favoriteRows.length,
    reservationsCount: allAppointments.length,
    upcomingCount,
    completedCount,
    canceledCount,
  };
}
