import { and, eq, gt, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { hospitals, medicines, pharmacies, pharmacyStock } from "@/lib/db/schema";
import { HospitalDiscover, PharmacyDiscover } from "@/features/patient/types/discover";

type HospitalFilters = {
  specialty?: string;
  type?: "public" | "private" | "chu";
};

export async function getHospitalsForDiscover(
  filters: HospitalFilters = {}
): Promise<HospitalDiscover[]> {
  const whereClause = and(
    filters.type ? eq(hospitals.type, filters.type) : undefined,
    filters.specialty
      ? sql`EXISTS (
          SELECT 1
          FROM json_each(${hospitals.specialties})
          WHERE lower(json_each.value) = lower(${filters.specialty})
        )`
      : undefined
  );

  return db
    .select({
      id: hospitals.id,
      name: hospitals.name,
      type: hospitals.type,
      specialties: hospitals.specialties,
      lat: hospitals.lat,
      lng: hospitals.lng,
      address: hospitals.address,
      phone: hospitals.phone,
    })
    .from(hospitals)
    .where(whereClause)
    .orderBy(hospitals.name);
}

export async function getPharmaciesForDiscover(filters: { medicineQuery?: string } = {}): Promise<PharmacyDiscover[]> {
  const query = filters.medicineQuery?.trim() ?? "";
  const like = `%${query}%`;

  const pharmacyRows = await db
    .select({
      id: pharmacies.id,
      name: pharmacies.name,
      lat: pharmacies.lat,
      lng: pharmacies.lng,
      address: pharmacies.address,
      isOnDuty: pharmacies.isOnDuty,
      neighborhood: pharmacies.neighborhood,
      openingHours: pharmacies.openingHours,
    })
    .from(pharmacies)
    .orderBy(pharmacies.name);

  const availabilityRows = await db
    .select({
      pharmacyId: pharmacies.id,
      medicineName: medicines.name,
      activeIngredient: medicines.activeIngredient,
    })
    .from(pharmacyStock)
    .innerJoin(pharmacies, eq(pharmacyStock.pharmacyId, pharmacies.id))
    .innerJoin(medicines, eq(pharmacyStock.medicineId, medicines.id))
    .where(
      and(
        gt(pharmacyStock.quantity, 0),
        query
          ? sql`(
              lower(${medicines.name}) LIKE lower(${like})
              OR lower(${medicines.activeIngredient}) LIKE lower(${like})
            )`
          : undefined
      )
    )
    .orderBy(medicines.name);

  const byPharmacy = new Map<
    string,
    {
      medicineNames: Set<string>;
      ingredients: Set<string>;
    }
  >();

  for (const row of availabilityRows) {
    if (!byPharmacy.has(row.pharmacyId)) {
      byPharmacy.set(row.pharmacyId, {
        medicineNames: new Set<string>(),
        ingredients: new Set<string>(),
      });
    }

    const bucket = byPharmacy.get(row.pharmacyId)!;
    bucket.medicineNames.add(row.medicineName);
    bucket.ingredients.add(row.activeIngredient);
  }

  return pharmacyRows
    .map((pharmacy) => {
      const availability = byPharmacy.get(pharmacy.id);
      return {
        ...pharmacy,
        availableMedicines: availability ? Array.from(availability.medicineNames).sort() : [],
        availableIngredients: availability ? Array.from(availability.ingredients).sort() : [],
      };
    });
}

/**
 * All distinct medicine names that have at least one unit in stock across any pharmacy.
 * Used for the discover search autocomplete — independent of any pharmacy/medicine filter
 * so it always returns the full catalogue regardless of what the user previously searched.
 */
export async function getDiscoverMedicineNames(): Promise<string[]> {
  const rows = await db
    .selectDistinct({ name: medicines.name })
    .from(medicines)
    .innerJoin(pharmacyStock, eq(pharmacyStock.medicineId, medicines.id))
    .where(gt(pharmacyStock.quantity, 0))
    .orderBy(medicines.name);

  return rows.map((r) => r.name);
}

export async function getHospitalSpecialties() {
  const rows = await db.select({ specialties: hospitals.specialties }).from(hospitals);
  const all = new Set<string>();

  for (const row of rows) {
    for (const specialty of row.specialties ?? []) {
      all.add(specialty);
    }
  }

  return Array.from(all).sort((a, b) => a.localeCompare(b));
}
