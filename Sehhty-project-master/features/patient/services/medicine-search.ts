import { and, desc, eq, inArray, or, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { medicines, notificationRequests, pharmacies, pharmacyStock, users } from "@/lib/db/schema";
import type {
  MedicinePharmacyAvailability,
  MedicineSearchItem,
  MedicineSearchResponse,
  StockStatus,
} from "@/features/patient/types/medicine-search";

function isMissingTableError(error: unknown, tableName: string) {
  if (!(error instanceof Error)) return false;

  const message = error.message.toLowerCase();
  return message.includes("no such table") && message.includes(tableName.toLowerCase());
}

function getStockStatus(quantity: number): StockStatus {
  if (quantity <= 0) return "out_of_stock";
  if (quantity <= 5) return "low_stock";
  return "in_stock";
}

function rankStock(status: StockStatus) {
  if (status === "in_stock") return 3;
  if (status === "low_stock") return 2;
  return 1;
}

export async function searchMedicinesWithAvailability(query: string): Promise<MedicineSearchResponse> {
  const normalized = query.trim();
  const like = `%${normalized}%`;

  const rows = await db
    .select({
      medicineId: medicines.id,
      medicineName: medicines.name,
      activeIngredient: medicines.activeIngredient,
      dosageForm: medicines.dosageForm,
      ppm: medicines.ppm,
      pharmacyId: pharmacies.id,
      pharmacyName: pharmacies.name,
      neighborhood: pharmacies.neighborhood,
      address: pharmacies.address,
      lat: pharmacies.lat,
      lng: pharmacies.lng,
      isOnDuty: pharmacies.isOnDuty,
      quantity: pharmacyStock.quantity,
      price: pharmacyStock.price,
    })
    .from(medicines)
    .leftJoin(pharmacyStock, eq(pharmacyStock.medicineId, medicines.id))
    .leftJoin(pharmacies, eq(pharmacyStock.pharmacyId, pharmacies.id))
    .where(
      and(
        sql`(
          lower(${medicines.name}) LIKE lower(${like})
          OR lower(${medicines.activeIngredient}) LIKE lower(${like})
        )`
      )
    )
    .orderBy(medicines.name, desc(pharmacyStock.quantity));

  const byMedicine = new Map<string, MedicineSearchItem>();

  for (const row of rows) {
    if (!byMedicine.has(row.medicineId)) {
      byMedicine.set(row.medicineId, {
        medicineId: row.medicineId,
        medicineName: row.medicineName,
        activeIngredient: row.activeIngredient,
        dosageForm: row.dosageForm,
        ppm: row.ppm,
        pharmacies: [],
      });
    }

    if (
      !row.pharmacyId ||
      !row.pharmacyName ||
      row.quantity === null ||
      row.price === null ||
      row.lat === null ||
      row.lng === null ||
      row.isOnDuty === null
    ) {
      continue;
    }

    const item = byMedicine.get(row.medicineId)!;
    const availability: MedicinePharmacyAvailability = {
      pharmacyId: row.pharmacyId,
      pharmacyName: row.pharmacyName,
      neighborhood: row.neighborhood,
      address: row.address,
      lat: row.lat,
      lng: row.lng,
      quantity: row.quantity,
      stockStatus: getStockStatus(row.quantity),
      isOnDuty: row.isOnDuty,
      price: row.price,
    };

    item.pharmacies.push(availability);
  }

  const items = Array.from(byMedicine.values()).map((item) => ({
    ...item,
    pharmacies: item.pharmacies.sort((a, b) => {
      const byStatus = rankStock(b.stockStatus) - rankStock(a.stockStatus);
      if (byStatus !== 0) return byStatus;
      if (a.isOnDuty !== b.isOnDuty) return a.isOnDuty ? -1 : 1;
      return b.quantity - a.quantity;
    }),
  }));

  return {
    query: normalized,
    items,
  };
}

export async function createBroadcastNotificationRequestsForMedicine(input: {
  medicineId: string;
  patientUserId: string;
  fallbackEmail?: string | null;
}) {
  const patient = await db.query.users.findFirst({
    where: eq(users.id, input.patientUserId),
    columns: {
      email: true,
      phone: true,
    },
  });

  const email = (patient?.email ?? input.fallbackEmail ?? "").trim() || null;
  const phoneNumber = (patient?.phone ?? "").trim() || null;

  if (!email && !phoneNumber) {
    return { error: "Ajoutez un email ou un telephone dans votre profil pour etre notifie" };
  }

  const allPharmacies = await db.select({ id: pharmacies.id }).from(pharmacies);
  if (allPharmacies.length === 0) {
    return { error: "Aucune pharmacie disponible pour le moment" };
  }

  const pharmacyIds = allPharmacies.map((pharmacy) => pharmacy.id);
  const contactFilter = email && phoneNumber
    ? or(eq(notificationRequests.email, email), eq(notificationRequests.phoneNumber, phoneNumber))
    : email
      ? eq(notificationRequests.email, email)
      : eq(notificationRequests.phoneNumber, phoneNumber!);

  let existingPending: Array<{ pharmacyId: string }> = [];
  try {
    existingPending = await db
      .select({ pharmacyId: notificationRequests.pharmacyId })
      .from(notificationRequests)
      .where(
        and(
          eq(notificationRequests.medicineId, input.medicineId),
          eq(notificationRequests.status, "pending"),
          inArray(notificationRequests.pharmacyId, pharmacyIds),
          contactFilter
        )
      );
  } catch (error) {
    if (!isMissingTableError(error, "notification_requests")) {
      throw error;
    }
    return { error: "Service de notification indisponible sur cette base locale" };
  }

  const existingByPharmacy = new Set(existingPending.map((row) => row.pharmacyId));
  const now = new Date();
  const requestsToInsert = allPharmacies
    .filter((pharmacy) => !existingByPharmacy.has(pharmacy.id))
    .map((pharmacy) => ({
      pharmacyId: pharmacy.id,
      medicineId: input.medicineId,
      email,
      phoneNumber,
      status: "pending" as const,
      createdAt: now,
    }));

  if (requestsToInsert.length > 0) {
    try {
      await db.insert(notificationRequests).values(requestsToInsert);
    } catch (error) {
      if (!isMissingTableError(error, "notification_requests")) {
        throw error;
      }
      return { error: "Service de notification indisponible sur cette base locale" };
    }
  }

  return {
    success: true as const,
    createdCount: requestsToInsert.length,
    alreadyPendingCount: existingByPharmacy.size,
    pharmacyCount: allPharmacies.length,
  };
}
