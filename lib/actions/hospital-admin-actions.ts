"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users, appointments, hospitals } from "@/lib/db/schema";
import { eq, and, count, gte, lt } from "drizzle-orm";

// ─── Shared: resolve the calling admin's hospitalId ───────────────────────────

async function getAdminHospitalId(): Promise<string> {
  const session = await auth();
  if (!session?.user) throw new Error("Non authentifié");

  const admin = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
    columns: { role: true, hospitalId: true },
  });

  if (!admin || admin.role !== "hospital_admin") {
    throw new Error("Accès refusé : rôle insuffisant");
  }
  if (!admin.hospitalId) {
    throw new Error("Ce compte administrateur n'est pas associé à un hôpital");
  }

  return admin.hospitalId;
}

function isMissingColumnError(error: unknown, columnName: string) {
  if (!(error instanceof Error)) return false;

  const message = error.message.toLowerCase();
  return message.includes("no such column") && message.includes(`"${columnName.toLowerCase()}"`);
}

export async function getHospitalByIdCompat(hospitalId: string) {
  try {
    return await db.query.hospitals.findFirst({
      where: eq(hospitals.id, hospitalId),
    });
  } catch (error) {
    if (!isMissingColumnError(error, "city")) {
      throw error;
    }

    const [legacyHospital] = await db
      .select({
        id: hospitals.id,
        name: hospitals.name,
        type: hospitals.type,
        lat: hospitals.lat,
        lng: hospitals.lng,
        address: hospitals.address,
        phone: hospitals.phone,
        specialties: hospitals.specialties,
      })
      .from(hospitals)
      .where(eq(hospitals.id, hospitalId))
      .limit(1);

    if (!legacyHospital) {
      return null;
    }

    return {
      ...legacyHospital,
      city: "Tanger",
    };
  }
}

// ─── 1. Dashboard stats ────────────────────────────────────────────────────────

export async function getHospitalStats() {
  const hospitalId = await getAdminHospitalId();

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const hospitalPromise = getHospitalByIdCompat(hospitalId);

  const [hospital, doctorRows, apptRows] = await Promise.all([
    hospitalPromise,

    db
      .select({ _: count() })
      .from(users)
      .where(and(eq(users.hospitalId, hospitalId), eq(users.role, "doctor"))),

    db
      .select({ _: count() })
      .from(appointments)
      .innerJoin(users, eq(appointments.doctorId, users.id))
      .where(
        and(
          eq(users.hospitalId, hospitalId),
          gte(appointments.datetime, todayStart),
          lt(appointments.datetime, todayEnd),
        ),
      ),
  ]);

  return {
    hospital: hospital ?? null,
    totalDoctors: doctorRows[0]?._ ?? 0,
    todayAppointments: apptRows[0]?._ ?? 0,
  };
}

// ─── 2. Recent doctors ─────────────────────────────────────────────────────────

export async function getRecentDoctors(limit = 5) {
  const hospitalId = await getAdminHospitalId();

  return db.query.users.findMany({
    where: and(eq(users.hospitalId, hospitalId), eq(users.role, "doctor")),
    columns: { id: true, fullName: true, email: true, specialty: true, createdAt: true },
    orderBy: (u, { desc }) => desc(u.createdAt),
    limit,
  });
}

// ─── 3. All doctors ────────────────────────────────────────────────────────────

export async function getAllDoctors() {
  const hospitalId = await getAdminHospitalId();

  return db.query.users.findMany({
    where: and(eq(users.hospitalId, hospitalId), eq(users.role, "doctor")),
    columns: { id: true, fullName: true, email: true, specialty: true, createdAt: true },
    orderBy: (u, { desc }) => desc(u.createdAt),
  });
}

// ─── 4. Doctor by ID (with ownership check) ───────────────────────────────────

export async function getDoctorById(doctorId: string) {
  const hospitalId = await getAdminHospitalId();

  const doctor = await db.query.users.findFirst({
    where: and(
      eq(users.id, doctorId),
      eq(users.role, "doctor"),
      eq(users.hospitalId, hospitalId),
    ),
    columns: {
      id: true,
      fullName: true,
      email: true,
      specialty: true,
      phone: true,
      createdAt: true,
    },
  });

  if (!doctor) {
    throw new Error("Médecin introuvable ou accès non autorisé");
  }

  const [apptCount] = await db
    .select({ total: count() })
    .from(appointments)
    .where(eq(appointments.doctorId, doctorId));

  return {
    doctor,
    stats: { totalAppointments: apptCount?.total ?? 0 },
  };
}
