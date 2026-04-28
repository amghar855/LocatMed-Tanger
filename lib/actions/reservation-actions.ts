"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users, reservations, medicines } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

function isMissingTableError(error: unknown, tableName: string) {
  if (!(error instanceof Error)) return false;

  const message = error.message.toLowerCase();
  return message.includes("no such table") && message.includes(tableName.toLowerCase());
}

// ─── Shared: resolve pharmacyId ───────────────────────────────────────────────

async function getPharmacistPharmacyId(): Promise<string> {
  const session = await auth();
  if (!session?.user) throw new Error("Non authentifié");

  const user = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
    columns: { role: true, pharmacyId: true },
  });

  if (!user || user.role !== "pharmacist") throw new Error("Accès refusé");
  if (!user.pharmacyId) throw new Error("Compte non lié à une pharmacie");

  return user.pharmacyId;
}

// ─── 1. Get reservations ──────────────────────────────────────────────────────

export type ReservationStatus = "pending" | "confirmed" | "collected" | "cancelled";

export async function getReservations(statusFilter?: ReservationStatus) {
  const pharmacyId = await getPharmacistPharmacyId();

  try {
    const rows = await db
      .select({
        id: reservations.id,
        citizenName: reservations.citizenName,
        citizenPhone: reservations.citizenPhone,
        status: reservations.status,
        createdAt: reservations.createdAt,
        updatedAt: reservations.updatedAt,
        medicineId: medicines.id,
        medicineName: medicines.name,
      })
      .from(reservations)
      .innerJoin(medicines, eq(reservations.medicineId, medicines.id))
      .where(
        statusFilter
          ? and(eq(reservations.pharmacyId, pharmacyId), eq(reservations.status, statusFilter))
          : eq(reservations.pharmacyId, pharmacyId),
      )
      .orderBy(reservations.createdAt);

    return rows.reverse(); // newest first
  } catch (error) {
    if (isMissingTableError(error, "reservations")) {
      return [];
    }
    throw error;
  }
}

// ─── 2. Update reservation status ────────────────────────────────────────────

export async function updateReservationStatus(
  reservationId: number,
  status: ReservationStatus,
) {
  const pharmacyId = await getPharmacistPharmacyId();

  try {
    const res = await db.query.reservations.findFirst({
      where: and(eq(reservations.id, reservationId), eq(reservations.pharmacyId, pharmacyId)),
    });
    if (!res) return { error: "Réservation introuvable" };

    await db
      .update(reservations)
      .set({ status, updatedAt: new Date() })
      .where(eq(reservations.id, reservationId));

    revalidatePath("/pharmacy/reservations");
    return { success: true };
  } catch (error) {
    if (isMissingTableError(error, "reservations")) {
      return { error: "La table des réservations est indisponible." };
    }
    throw error;
  }
}

// ─── 3. Delete reservation ────────────────────────────────────────────────────

export async function deleteReservation(reservationId: number) {
  const pharmacyId = await getPharmacistPharmacyId();

  try {
    const res = await db.query.reservations.findFirst({
      where: and(eq(reservations.id, reservationId), eq(reservations.pharmacyId, pharmacyId)),
    });
    if (!res) return { error: "Réservation introuvable" };

    await db.delete(reservations).where(eq(reservations.id, reservationId));

    revalidatePath("/pharmacy/reservations");
    return { success: true };
  } catch (error) {
    if (isMissingTableError(error, "reservations")) {
      return { error: "La table des réservations est indisponible." };
    }
    throw error;
  }
}
