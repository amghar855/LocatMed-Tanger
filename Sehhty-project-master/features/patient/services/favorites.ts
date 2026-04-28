import { and, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { hospitals, patientFavoriteHospitals } from "@/lib/db/schema";
import type { FavoriteHospitalItem } from "@/features/patient/types/favorites";

export async function listFavoriteHospitalsByPatient(
  patientId: string
): Promise<FavoriteHospitalItem[]> {
  const rows = await db
    .select({
      id: patientFavoriteHospitals.id,
      hospitalId: patientFavoriteHospitals.hospitalId,
      hospitalName: hospitals.name,
      hospitalType: hospitals.type,
      address: hospitals.address,
      specialties: hospitals.specialties,
      createdAt: patientFavoriteHospitals.createdAt,
    })
    .from(patientFavoriteHospitals)
    .innerJoin(hospitals, eq(patientFavoriteHospitals.hospitalId, hospitals.id))
    .where(eq(patientFavoriteHospitals.patientId, patientId))
    .orderBy(desc(patientFavoriteHospitals.createdAt));

  return rows;
}

export async function addFavoriteHospitalByPatient(
  patientId: string,
  hospitalId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const existing = await db.query.patientFavoriteHospitals.findFirst({
    where: and(
      eq(patientFavoriteHospitals.patientId, patientId),
      eq(patientFavoriteHospitals.hospitalId, hospitalId)
    ),
  });

  if (existing) {
    return { ok: false, error: "Cet hôpital est déjà dans vos favoris" };
  }

  await db.insert(patientFavoriteHospitals).values({
    patientId,
    hospitalId,
    createdAt: new Date(),
  });

  return { ok: true };
}

export async function removeFavoriteHospitalByPatient(
  patientId: string,
  hospitalId: string
): Promise<{ ok: true }> {
  await db
    .delete(patientFavoriteHospitals)
    .where(
      and(
        eq(patientFavoriteHospitals.patientId, patientId),
        eq(patientFavoriteHospitals.hospitalId, hospitalId)
      )
    );

  return { ok: true };
}

export async function listHospitalsForFavoritePicker() {
  return db
    .select({
      id: hospitals.id,
      name: hospitals.name,
      type: hospitals.type,
      address: hospitals.address,
    })
    .from(hospitals)
    .orderBy(hospitals.name);
}
