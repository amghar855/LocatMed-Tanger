"use server";

import { db } from "@/lib/db";
import { medicines, pharmacyStock, pharmacies, reservations, notificationRequests } from "@/lib/db/schema";
import { eq, and, gt, like, or, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { calcStatus, type StockStatus } from "@/lib/stock-utils";

export type { StockStatus } from "@/lib/stock-utils";

function isMissingTableError(error: unknown, tableName: string) {
  if (!(error instanceof Error)) return false;

  const message = error.message.toLowerCase();
  return message.includes("no such table") && message.includes(tableName.toLowerCase());
}

// ─── 1. Medicine autocomplete ─────────────────────────────────────────────────

export async function searchMedicines(query: string) {
  if (query.trim().length < 2) return [];

  const term = `%${query.trim()}%`;
  return db
    .select({
      id: medicines.id,
      name: medicines.name,
      activeIngredient: medicines.activeIngredient,
      dosageForm: medicines.dosageForm,
      ppm: medicines.ppm,
      isGeneric: medicines.isGeneric,
    })
    .from(medicines)
    .where(or(like(medicines.name, term), like(medicines.activeIngredient, term)))
    .limit(10);
}

// ─── 2. Pharmacies that stock a medicine ─────────────────────────────────────

export type PharmacyWithStock = {
  pharmacyId: string;
  pharmacyName: string;
  address: string | null;
  city: string;
  neighborhood: string | null;
  lat: number;
  lng: number;
  isOnDuty: boolean;
  openingHours: string | null;
  quantity: number;
  price: number;
  minThreshold: number;
  stockId: number;
  status: StockStatus;
};

export async function findPharmaciesWithStock(medicineId: string): Promise<PharmacyWithStock[]> {
  let rows: Array<{
    stockId: number;
    pharmacyId: string;
    pharmacyName: string;
    address: string | null;
    city: string;
    neighborhood: string | null;
    lat: number;
    lng: number;
    isOnDuty: boolean;
    openingHours: string | null;
    quantity: number;
    price: number;
    minThreshold: number;
  }>;

  try {
    rows = await db
      .select({
        stockId: pharmacyStock.id,
        pharmacyId: pharmacies.id,
        pharmacyName: pharmacies.name,
        address: pharmacies.address,
        city: sql<string>`'Tanger'`,
        neighborhood: pharmacies.neighborhood,
        lat: pharmacies.lat,
        lng: pharmacies.lng,
        isOnDuty: pharmacies.isOnDuty,
        openingHours: pharmacies.openingHours,
        quantity: pharmacyStock.quantity,
        price: pharmacyStock.price,
        minThreshold: pharmacyStock.minThreshold,
      })
      .from(pharmacyStock)
      .innerJoin(pharmacies, eq(pharmacyStock.pharmacyId, pharmacies.id))
      .where(eq(pharmacyStock.medicineId, medicineId))
      .orderBy(pharmacies.isOnDuty, pharmacyStock.quantity);
  } catch (error) {
    const isMinThresholdMissing =
      error instanceof Error &&
      error.message.toLowerCase().includes("no such column") &&
      error.message.toLowerCase().includes("min_threshold");

    if (!isMinThresholdMissing) {
      throw error;
    }

    const legacyRows = await db
      .select({
        stockId: pharmacyStock.id,
        pharmacyId: pharmacies.id,
        pharmacyName: pharmacies.name,
        address: pharmacies.address,
        city: sql<string>`'Tanger'`,
        neighborhood: pharmacies.neighborhood,
        lat: pharmacies.lat,
        lng: pharmacies.lng,
        isOnDuty: pharmacies.isOnDuty,
        openingHours: pharmacies.openingHours,
        quantity: pharmacyStock.quantity,
        price: pharmacyStock.price,
      })
      .from(pharmacyStock)
      .innerJoin(pharmacies, eq(pharmacyStock.pharmacyId, pharmacies.id))
      .where(eq(pharmacyStock.medicineId, medicineId))
      .orderBy(pharmacies.isOnDuty, pharmacyStock.quantity);

    rows = legacyRows.map((row) => ({
      ...row,
      minThreshold: 5,
    }));
  }

  return rows
    .map((r) => ({
      ...r,
      status: calcStatus(r.quantity, r.minThreshold),
    }))
    .sort((a, b) => {
      // On-duty first, then by quantity descending
      if (a.isOnDuty !== b.isOnDuty) return a.isOnDuty ? -1 : 1;
      return b.quantity - a.quantity;
    });
}

// ─── 3. Create citizen reservation ────────────────────────────────────────────

export async function createReservation(data: {
  pharmacyId: string;
  medicineId: string;
  citizenName: string;
  citizenPhone: string;
  userId?: string;
}) {
  if (!data.citizenName.trim() || !data.citizenPhone.trim()) {
    return { error: "Nom et téléphone requis" };
  }

  const now = new Date();
  try {
    await db.insert(reservations).values({
      pharmacyId: data.pharmacyId,
      medicineId: data.medicineId,
      userId: data.userId ?? null,
      citizenName: data.citizenName.trim(),
      citizenPhone: data.citizenPhone.trim(),
      status: "pending",
      createdAt: now,
      updatedAt: now,
    });
  } catch (error) {
    if (isMissingTableError(error, "reservations")) {
      return { error: "Service de réservation indisponible sur cette base locale." };
    }
    throw error;
  }

  revalidatePath("/pharmacy/reservations");
  return { success: true };
}

// ─── 4. Create notification request (waitlist) ───────────────────────────────

export async function createNotificationRequest(data: {
  pharmacyId: string;
  medicineId: string;
  email?: string;
  phoneNumber?: string;
}) {
  if (!data.email?.trim() && !data.phoneNumber?.trim()) {
    return { error: "Email ou numéro de téléphone requis" };
  }

  try {
    await db.insert(notificationRequests).values({
      pharmacyId: data.pharmacyId,
      medicineId: data.medicineId,
      email: data.email?.trim() || null,
      phoneNumber: data.phoneNumber?.trim() || null,
      status: "pending",
      createdAt: new Date(),
    });
  } catch (error) {
    if (isMissingTableError(error, "notification_requests")) {
      return { error: "Service de notification indisponible sur cette base locale." };
    }
    throw error;
  }

  return { success: true };
}
