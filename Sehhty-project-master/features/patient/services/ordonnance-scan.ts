import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { medicines, pharmacies, pharmacyStock } from "@/lib/db/schema";
import type {
  ExtractedMedicineResult,
  MedicinePharmacyAvailability,
  OrdonnanceScanResult,
} from "@/features/patient/types/ordonnance-scan";

function extractNamesFromFileName(fileName: string) {
  const normalized = fileName.toLowerCase();
  const candidates: string[] = [];

  if (normalized.includes("doli") || normalized.includes("paracet")) {
    candidates.push("DOLIPRANE", "PARACETAMOL");
  }
  if (normalized.includes("brufen") || normalized.includes("ibupro")) {
    candidates.push("BRUFEN", "IBUPROFENE");
  }
  if (normalized.includes("augmentin") || normalized.includes("amox")) {
    candidates.push("AUGMENTIN", "AMOXICILLINE");
  }

  if (candidates.length === 0) {
    candidates.push("DOLIPRANE", "BRUFEN");
  }

  return Array.from(new Set(candidates));
}

async function matchMedicine(inputName: string): Promise<ExtractedMedicineResult> {
  const like = `%${inputName}%`;

  const row = await db
    .select({
      id: medicines.id,
      name: medicines.name,
      activeIngredient: medicines.activeIngredient,
      dosageForm: medicines.dosageForm,
      ppm: medicines.ppm,
      stockCount: sql<number>`COUNT(${pharmacyStock.id})`,
    })
    .from(medicines)
    .leftJoin(pharmacyStock, eq(pharmacyStock.medicineId, medicines.id))
    .where(
      sql`lower(${medicines.name}) LIKE lower(${like}) OR lower(${medicines.activeIngredient}) LIKE lower(${like})`
    )
    .groupBy(
      medicines.id,
      medicines.name,
      medicines.activeIngredient,
      medicines.dosageForm,
      medicines.ppm
    )
    .orderBy(desc(sql`COUNT(${pharmacyStock.id})`))
    .limit(1);

  if (!row[0]) {
    return {
      inputName,
      matchedMedicineId: null,
      matchedMedicineName: null,
      activeIngredient: null,
      dosageForm: null,
      ppm: null,
      confidence: 0.35,
      availability: [],
    };
  }

  const availability = await getAvailabilityForMedicine(row[0].id, row[0].name);

  return {
    inputName,
    matchedMedicineId: row[0].id,
    matchedMedicineName: row[0].name,
    activeIngredient: row[0].activeIngredient,
    dosageForm: row[0].dosageForm,
    ppm: row[0].ppm,
    confidence: row[0].name.toLowerCase().includes(inputName.toLowerCase()) ? 0.9 : 0.7,
    availability,
  };
}

async function getAvailabilityForMedicine(
  medicineId: string,
  medicineName: string
): Promise<MedicinePharmacyAvailability[]> {
  const rows = await db
    .select({
      pharmacyId: pharmacies.id,
      pharmacyName: pharmacies.name,
      address: pharmacies.address,
      neighborhood: pharmacies.neighborhood,
      lat: pharmacies.lat,
      lng: pharmacies.lng,
      isOnDuty: pharmacies.isOnDuty,
      quantity: pharmacyStock.quantity,
      price: pharmacyStock.price,
    })
    .from(pharmacyStock)
    .innerJoin(pharmacies, eq(pharmacyStock.pharmacyId, pharmacies.id))
    .where(eq(pharmacyStock.medicineId, medicineId))
    .orderBy(desc(pharmacyStock.quantity));

  return rows.map((row) => ({
    pharmacyId: row.pharmacyId,
    pharmacyName: row.pharmacyName,
    address: row.address,
    neighborhood: row.neighborhood,
    lat: row.lat,
    lng: row.lng,
    isOnDuty: row.isOnDuty,
    medicineName,
    quantity: row.quantity,
    stockStatus:
      row.quantity <= 0 ? "out_of_stock" : row.quantity <= 5 ? "low_stock" : "in_stock",
    price: row.price,
  }));
}

export async function scanOrdonnanceWithPlaceholder(fileName: string): Promise<OrdonnanceScanResult> {
  const extractedNames = extractNamesFromFileName(fileName);
  const extractedMedicines = await Promise.all(extractedNames.map((name) => matchMedicine(name)));

  return {
    fileName,
    extractedMedicines,
    unmatchedInputs: extractedMedicines
      .filter((item) => !item.matchedMedicineId)
      .map((item) => item.inputName),
  };
}
