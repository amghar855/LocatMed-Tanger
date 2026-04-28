import { BookingForm } from "@/features/patient/components/booking/booking-form";
import { getBookingOptions } from "@/features/patient/services/booking";
import { requireRole } from "@/lib/auth/guards";
import { PatientShellServer } from "@/features/patient/components/layout/patient-shell-server";
import { getServerTranslator } from "@/lib/i18n/server";

export default async function PatientBookingPage({
  searchParams,
}: {
  searchParams?: Promise<{ hospitalId?: string }>;
}) {
  const { t } = await getServerTranslator();
  await requireRole("patient");
  const params = (await searchParams) ?? {};
  const options = await getBookingOptions();

  const initialHospitalId = params.hospitalId?.trim() ?? "";
  const validHospital = options.hospitals.find((h) => h.id === initialHospitalId);

  return (
    <PatientShellServer>
      {/* Page header */}
      <div className="px-1">
        <h1 className="text-2xl font-bold text-slate-900">{t("patient.booking.title")}</h1>
        <p className="mt-1 text-sm text-slate-500">
          {validHospital
            ? `${t("patient.booking.selectedHospitalPrefix")} ${validHospital.name}`
            : t("patient.booking.description")}
        </p>
      </div>

      <div className="mx-auto max-w-2xl">
        <BookingForm
          hospitals={options.hospitals}
          doctors={options.doctors}
          specialties={options.specialties}
          initialHospitalId={validHospital ? initialHospitalId : ""}
        />
      </div>
    </PatientShellServer>
  );
}
