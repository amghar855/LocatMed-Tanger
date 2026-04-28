import { requireRole } from "@/lib/auth/guards";
import { OrdonnanceScanClient } from "@/features/patient/components/ordonnance-scan/ordonnance-scan-client";
import { PatientPageHeader } from "@/features/patient/components/layout/patient-page-header";
import { PatientShellServer } from "@/features/patient/components/layout/patient-shell-server";
import { getServerTranslator } from "@/lib/i18n/server";

export default async function PatientOrdonnanceScanPage() {
  const { t } = await getServerTranslator();
  await requireRole("patient");

  return (
    <PatientShellServer>
      <PatientPageHeader
        title={t("patient.ordonnance.title")}
        description={t("patient.ordonnance.description")}
      />
      <OrdonnanceScanClient />
    </PatientShellServer>
  );
}
