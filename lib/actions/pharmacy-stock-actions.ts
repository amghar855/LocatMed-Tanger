"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users, pharmacies, pharmacyStock, medicines, notificationRequests } from "@/lib/db/schema";
import { eq, and, lte, notInArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { calcStatus } from "@/lib/stock-utils";

// ─── Shared: resolve pharmacyId for the calling pharmacist ───────────────────

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

function isMissingColumnError(error: unknown, columnName: string) {
  if (!(error instanceof Error)) return false;

  const message = error.message.toLowerCase();
  return message.includes("no such column") && message.includes(`\"${columnName.toLowerCase()}\"`);
}

function isMissingTableError(error: unknown, tableName: string) {
  if (!(error instanceof Error)) return false;

  const message = error.message.toLowerCase();
  return message.includes("no such table") && message.includes(tableName.toLowerCase());
}

function isLegacyPharmacyStockColumnError(error: unknown) {
  return (
    isMissingColumnError(error, "min_threshold") ||
    isMissingColumnError(error, "expiry_date")
  );
}

async function getStockSummaryRowsCompat(pharmacyId: string) {
  try {
    return await db
      .select({
        quantity: pharmacyStock.quantity,
        minThreshold: pharmacyStock.minThreshold,
      })
      .from(pharmacyStock)
      .where(eq(pharmacyStock.pharmacyId, pharmacyId));
  } catch (error) {
    if (!isMissingColumnError(error, "min_threshold")) {
      throw error;
    }

    const legacyRows = await db
      .select({
        quantity: pharmacyStock.quantity,
      })
      .from(pharmacyStock)
      .where(eq(pharmacyStock.pharmacyId, pharmacyId));

    return legacyRows.map((r) => ({ ...r, minThreshold: 5 }));
  }
}

async function getPharmacyStockRowsCompat(pharmacyId: string) {
  try {
    return await db
      .select({
        stockId: pharmacyStock.id,
        quantity: pharmacyStock.quantity,
        price: pharmacyStock.price,
        minThreshold: pharmacyStock.minThreshold,
        expiryDate: pharmacyStock.expiryDate,
        updatedAt: pharmacyStock.updatedAt,
        medicineId: medicines.id,
        medicineName: medicines.name,
        activeIngredient: medicines.activeIngredient,
        dosageForm: medicines.dosageForm,
        ppm: medicines.ppm,
      })
      .from(pharmacyStock)
      .innerJoin(medicines, eq(pharmacyStock.medicineId, medicines.id))
      .where(eq(pharmacyStock.pharmacyId, pharmacyId));
  } catch (error) {
    if (!isLegacyPharmacyStockColumnError(error)) {
      throw error;
    }

    const legacyRows = await db
      .select({
        stockId: pharmacyStock.id,
        quantity: pharmacyStock.quantity,
        price: pharmacyStock.price,
        updatedAt: pharmacyStock.updatedAt,
        medicineId: medicines.id,
        medicineName: medicines.name,
        activeIngredient: medicines.activeIngredient,
        dosageForm: medicines.dosageForm,
        ppm: medicines.ppm,
      })
      .from(pharmacyStock)
      .innerJoin(medicines, eq(pharmacyStock.medicineId, medicines.id))
      .where(eq(pharmacyStock.pharmacyId, pharmacyId));

    return legacyRows.map((r) => ({
      ...r,
      minThreshold: 5,
      expiryDate: null,
    }));
  }
}

async function getLowStockRowsCompat(pharmacyId: string, limit: number) {
  try {
    return await db
      .select({
        stockId: pharmacyStock.id,
        quantity: pharmacyStock.quantity,
        minThreshold: pharmacyStock.minThreshold,
        medicineName: medicines.name,
      })
      .from(pharmacyStock)
      .innerJoin(medicines, eq(pharmacyStock.medicineId, medicines.id))
      .where(
        and(
          eq(pharmacyStock.pharmacyId, pharmacyId),
          lte(pharmacyStock.quantity, pharmacyStock.minThreshold),
        ),
      )
      .limit(limit);
  } catch (error) {
    if (!isMissingColumnError(error, "min_threshold")) {
      throw error;
    }

    const legacyRows = await db
      .select({
        stockId: pharmacyStock.id,
        quantity: pharmacyStock.quantity,
        medicineName: medicines.name,
      })
      .from(pharmacyStock)
      .innerJoin(medicines, eq(pharmacyStock.medicineId, medicines.id))
      .where(eq(pharmacyStock.pharmacyId, pharmacyId));

    return legacyRows
      .map((r) => ({ ...r, minThreshold: 5 }))
      .filter((r) => r.quantity <= r.minThreshold)
      .slice(0, limit);
  }
}

async function getPharmacyByIdCompat(pharmacyId: string) {
  try {
    return await db.query.pharmacies.findFirst({ where: eq(pharmacies.id, pharmacyId) });
  } catch (error) {
    if (!isMissingColumnError(error, "city")) {
      throw error;
    }

    const [legacyPharmacy] = await db
      .select({
        id: pharmacies.id,
        name: pharmacies.name,
        lat: pharmacies.lat,
        lng: pharmacies.lng,
        address: pharmacies.address,
        neighborhood: pharmacies.neighborhood,
        isOnDuty: pharmacies.isOnDuty,
        openingHours: pharmacies.openingHours,
      })
      .from(pharmacies)
      .where(eq(pharmacies.id, pharmacyId))
      .limit(1);

    if (!legacyPharmacy) {
      return null;
    }

    return {
      ...legacyPharmacy,
      city: "Tanger",
    };
  }
}

async function getPendingReservationsCompat(pharmacyId: string) {
  if (!db.query.reservations?.findMany) {
    return [] as Array<{ id: number }>;
  }

  try {
    return await db.query.reservations.findMany({
      where: (r, { eq: eqFn, and: andFn }) =>
        andFn(eqFn(r.pharmacyId, pharmacyId), eqFn(r.status, "pending")),
      columns: { id: true },
    });
  } catch (error) {
    if (isMissingTableError(error, "reservations")) {
      return [];
    }
    throw error;
  }
}

// ─── 1. Dashboard statistics ──────────────────────────────────────────────────

export async function getPharmacyStats() {
  const pharmacyId = await getPharmacistPharmacyId();

  const [pharmacy, allStock, reservationRows] = await Promise.all([
    getPharmacyByIdCompat(pharmacyId),
    getStockSummaryRowsCompat(pharmacyId),
    getPendingReservationsCompat(pharmacyId),
  ]);

  const totalMedicines = allStock.length;
  const outOfStock = allStock.filter((s) => s.quantity <= 0).length;
  const lowStock = allStock.filter(
    (s) => s.quantity > 0 && s.quantity <= s.minThreshold,
  ).length;

  return {
    pharmacy,
    totalMedicines,
    outOfStock,
    lowStock,
    pendingReservations: reservationRows.length,
  };
}

// ─── 2. Full stock list ───────────────────────────────────────────────────────

export async function getPharmacyStock() {
  const pharmacyId = await getPharmacistPharmacyId();

  const rows = await getPharmacyStockRowsCompat(pharmacyId);

  return rows
    .map((r) => ({ ...r, status: calcStatus(r.quantity, r.minThreshold) }))
    .sort((a, b) => {
      const order = { out_of_stock: 0, low_stock: 1, available: 2 };
      return order[a.status] - order[b.status];
    });
}

// ─── 3. Low-stock alerts ──────────────────────────────────────────────────────

export async function getLowStockItems(limit = 5) {
  const pharmacyId = await getPharmacistPharmacyId();

  const rows = await getLowStockRowsCompat(pharmacyId, limit);

  return rows.map((r) => ({ ...r, status: calcStatus(r.quantity, r.minThreshold) }));
}

// ─── 4. Incoming patient broadcast requests (waitlist) ──────────────────────

export async function getIncomingBroadcastRequests(limit = 5) {
  const pharmacyId = await getPharmacistPharmacyId();

  try {
    const rows = await db
      .select({
        id: notificationRequests.id,
        medicineId: medicines.id,
        medicineName: medicines.name,
        email: notificationRequests.email,
        phoneNumber: notificationRequests.phoneNumber,
        status: notificationRequests.status,
        createdAt: notificationRequests.createdAt,
      })
      .from(notificationRequests)
      .innerJoin(medicines, eq(notificationRequests.medicineId, medicines.id))
      .where(
        and(
          eq(notificationRequests.pharmacyId, pharmacyId),
          eq(notificationRequests.status, "pending"),
        ),
      )
      .orderBy(notificationRequests.createdAt)
      .limit(limit);

    return rows.reverse();
  } catch (error) {
    if (isMissingTableError(error, "notification_requests")) {
      return [];
    }
    throw error;
  }
}

// ─── 4. Update stock quantity ─────────────────────────────────────────────────

export async function updateStockQuantity(stockId: number, newQuantity: number) {
  const pharmacyId = await getPharmacistPharmacyId();

  const existing = await db.query.pharmacyStock.findFirst({
    where: and(eq(pharmacyStock.id, stockId), eq(pharmacyStock.pharmacyId, pharmacyId)),
  });
  if (!existing) return { error: "Entrée de stock introuvable" };

  const wasZero = existing.quantity <= 0;
  const nowPositive = newQuantity > 0;

  await db
    .update(pharmacyStock)
    .set({ quantity: newQuantity, updatedAt: new Date() })
    .where(eq(pharmacyStock.id, stockId));

  // Notify waitlist if stock went from 0 → available
  if (wasZero && nowPositive) {
    await notifyWaitlist(existing.pharmacyId, existing.medicineId);
  }

  revalidatePath("/pharmacy/stock");
  revalidatePath("/search");
  return { success: true };
}

// ─── 5. Update stock details (price, threshold, expiry) ───────────────────────

export async function updateStockDetails(
  stockId: number,
  data: { price?: number; minThreshold?: number; expiryDate?: Date | null },
) {
  const pharmacyId = await getPharmacistPharmacyId();

  const existing = await db.query.pharmacyStock.findFirst({
    where: and(eq(pharmacyStock.id, stockId), eq(pharmacyStock.pharmacyId, pharmacyId)),
  });
  if (!existing) return { error: "Entrée de stock introuvable" };

  try {
    await db
      .update(pharmacyStock)
      .set({
        ...(data.price !== undefined ? { price: data.price } : {}),
        ...(data.minThreshold !== undefined ? { minThreshold: data.minThreshold } : {}),
        ...(data.expiryDate !== undefined ? { expiryDate: data.expiryDate } : {}),
        updatedAt: new Date(),
      })
      .where(eq(pharmacyStock.id, stockId));
  } catch (error) {
    if (!isLegacyPharmacyStockColumnError(error)) {
      throw error;
    }

    await db
      .update(pharmacyStock)
      .set({
        ...(data.price !== undefined ? { price: data.price } : {}),
        updatedAt: new Date(),
      })
      .where(eq(pharmacyStock.id, stockId));
  }

  revalidatePath("/pharmacy/stock");
  return { success: true };
}

// ─── 6. Notify waitlist (internal) ───────────────────────────────────────────

async function notifyWaitlist(pharmacyId: string, medicineId: string) {
  let pending;
  try {
    pending = await db.query.notificationRequests.findMany({
      where: (nr, { eq: eqFn, and: andFn }) =>
        andFn(
          eqFn(nr.pharmacyId, pharmacyId),
          eqFn(nr.medicineId, medicineId),
          eqFn(nr.status, "pending"),
        ),
    });
  } catch (error) {
    if (isMissingTableError(error, "notification_requests")) {
      return 0;
    }
    throw error;
  }

  for (const req of pending) {
    // TODO: send real email/SMS in production
    console.log(
      `[Notification] Médicament disponible → ${req.email ?? req.phoneNumber}`,
    );
    await db
      .update(notificationRequests)
      .set({ status: "sent" })
      .where(eq(notificationRequests.id, req.id));
  }

  return pending.length;
}

// ─── 7. Medicines not yet in this pharmacy's stock ───────────────────────────

export async function getMedicinesNotInStock() {
  const pharmacyId = await getPharmacistPharmacyId();

  // IDs the pharmacy already carries
  const existing = await db
    .select({ medicineId: pharmacyStock.medicineId })
    .from(pharmacyStock)
    .where(eq(pharmacyStock.pharmacyId, pharmacyId));

  const existingIds = existing.map((r) => r.medicineId);

  // All medicines minus those already stocked
  const available =
    existingIds.length > 0
      ? await db
          .select({
            id: medicines.id,
            name: medicines.name,
            activeIngredient: medicines.activeIngredient,
            dosageForm: medicines.dosageForm,
            ppm: medicines.ppm,
          })
          .from(medicines)
          .where(notInArray(medicines.id, existingIds))
          .orderBy(medicines.name)
      : await db
          .select({
            id: medicines.id,
            name: medicines.name,
            activeIngredient: medicines.activeIngredient,
            dosageForm: medicines.dosageForm,
            ppm: medicines.ppm,
          })
          .from(medicines)
          .orderBy(medicines.name);

  return available;
}

// ─── 8. Add a new medicine entry to this pharmacy's stock ────────────────────

export async function addStockItem(data: {
  medicineId: string;
  quantity: number;
  price: number;
  minThreshold: number;
}) {
  const pharmacyId = await getPharmacistPharmacyId();

  // Guard: already stocked?
  const duplicate = await db.query.pharmacyStock.findFirst({
    where: and(
      eq(pharmacyStock.pharmacyId, pharmacyId),
      eq(pharmacyStock.medicineId, data.medicineId),
    ),
  });
  if (duplicate) {
    return { error: "Ce médicament est déjà dans votre stock." };
  }

  try {
    await db.insert(pharmacyStock).values({
      pharmacyId,
      medicineId: data.medicineId,
      quantity: data.quantity,
      price: data.price,
      minThreshold: data.minThreshold,
      updatedAt: new Date(),
    });
  } catch (error) {
    if (!isMissingColumnError(error, "min_threshold")) {
      throw error;
    }

    await db.insert(pharmacyStock).values({
      pharmacyId,
      medicineId: data.medicineId,
      quantity: data.quantity,
      price: data.price,
      updatedAt: new Date(),
    });
  }

  if (data.quantity > 0) {
    await notifyWaitlist(pharmacyId, data.medicineId);
  }

  revalidatePath("/pharmacy/stock");
  revalidatePath("/search");
  return { success: true };
}

// ─── 9. Pharmacy settings ─────────────────────────────────────────────────────

export async function toggleGardeStatus(isOnDuty: boolean) {
  const pharmacyId = await getPharmacistPharmacyId();

  await db
    .update(pharmacies)
    .set({ isOnDuty })
    .where(eq(pharmacies.id, pharmacyId));

  revalidatePath("/pharmacy/settings");
  revalidatePath("/search");
  return { success: true };
}
