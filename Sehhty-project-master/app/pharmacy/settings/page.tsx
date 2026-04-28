import { requireRole } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { users, pharmacies } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import PharmacyNav from "@/components/locatomed/pharmacy-nav";
import { PharmacySettingsUI } from "./settings-ui";

function isMissingColumnError(error: unknown, columnName: string) {
  if (!(error instanceof Error)) return false;

  const message = error.message.toLowerCase();
  return message.includes("no such column") && message.includes(`\"${columnName.toLowerCase()}\"`);
}

async function getPharmacyByIdCompat(pharmacyId: string) {
  try {
    return await db.query.pharmacies.findFirst({
      where: eq(pharmacies.id, pharmacyId),
    });
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

export default async function PharmacySettingsPage() {
  const session = await requireRole("pharmacist");

  const user = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
    columns: { fullName: true, email: true, pharmacyId: true },
  });

  const pharmacy = user?.pharmacyId
    ? await getPharmacyByIdCompat(user.pharmacyId)
    : null;

  return (
    <>
      <PharmacyNav userName={session.user.name ?? ""} active="settings" />
      <div className="min-h-screen md:pl-72">
        <div className="mx-auto w-full max-w-6xl p-4 sm:p-6">
          {pharmacy && user ? (
            <PharmacySettingsUI
              pharmacy={{
                name: pharmacy.name,
                address: pharmacy.address ?? null,
                city: pharmacy.city,
                neighborhood: pharmacy.neighborhood ?? null,
                openingHours: pharmacy.openingHours ?? null,
                isOnDuty: pharmacy.isOnDuty,
              }}
              admin={{ fullName: user.fullName, email: user.email }}
            />
          ) : (
            <div className="rounded-2xl border bg-background p-6 text-muted-foreground">
              Pharmacie introuvable.
            </div>
          )}
        </div>
      </div>
    </>
  );
}
