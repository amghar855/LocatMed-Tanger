import { DiscoverClient } from "@/features/patient/components/discover/discover-client";
import { requireRole } from "@/lib/auth/guards";
import {
  getDiscoverMedicineNames,
  getHospitalsForDiscover,
  getPharmaciesForDiscover,
} from "@/features/patient/services/discover";
import { getServerTranslator } from "@/lib/i18n/server";

type SearchParams = {
  view?: string;
  type?: string;
  pharmacy?: string;
  radius?: string;
  q?: string;
};

export default async function PatientDiscoverPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const { t } = await getServerTranslator();
  const session = await requireRole("patient");
  const params = (await searchParams) ?? {};

  const view = params.view === "pharmacies" ? "pharmacies" : "hospitals";
  const type =
    params.type === "public" || params.type === "private" || params.type === "chu"
      ? params.type
      : "";
  const pharmacyFilter = params.pharmacy === "on-duty" ? "on-duty" : "all";

  const parsedRadius = Number(params.radius ?? "0");
  const radiusKm = Number.isFinite(parsedRadius) && parsedRadius > 0 && parsedRadius <= 50
    ? parsedRadius
    : 0;

  const query = params.q ?? "";

  const [hospitals, pharmacies, allMedicineNames] = await Promise.all([
    getHospitalsForDiscover({ type: type || undefined }),
    getPharmaciesForDiscover({
      medicineQuery: view === "pharmacies" ? query : undefined,
    }),
    getDiscoverMedicineNames(),
  ]);

  return (
    <DiscoverClient
      view={view}
      hospitals={hospitals}
      pharmacies={pharmacies}
      allMedicineNames={allMedicineNames}
      selectedType={type}
      pharmacyFilter={pharmacyFilter}
      radiusKm={radiusKm}
      query={query}
      patient={{
        name: session.user.name ?? t("patient.profile.rolePatient"),
        email: session.user.email ?? "",
      }}
    />
  );
}
