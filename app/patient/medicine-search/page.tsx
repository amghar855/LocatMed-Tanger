import { requireRole } from "@/lib/auth/guards";
import { MedicineSearchClient } from "@/features/patient/components/medicine-search/medicine-search-client";
import { PatientWebNav } from "@/features/patient/components/layout/patient-web-nav";
import { getServerTranslator } from "@/lib/i18n/server";

export default async function PatientMedicineSearchPage() {
  const { t } = await getServerTranslator();
  await requireRole("patient");

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-4 md:px-6 lg:px-8">
      <PatientWebNav className="mb-6 hidden lg:flex" />
      <div className="mx-auto max-w-5xl space-y-4">
        <section>
          <h1 className="text-2xl font-bold">{t("patient.medicineSearch.title")}</h1>
          <p className="text-sm text-gray-600 mt-1">
            {t("patient.medicineSearch.description")}
          </p>
        </section>

        <MedicineSearchClient />
      </div>
    </main>
  );
}
