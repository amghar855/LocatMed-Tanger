import { requireRole } from "@/lib/auth/guards";
import { MedicalFolderFilters } from "@/features/patient/components/medical-folder/medical-folder-filters";
import { MedicalFolderCategories } from "@/features/patient/components/medical-folder/medical-folder-categories";
import {
  listMedicalFolderDoctors,
  listMedicalFolderRecords,
} from "@/features/patient/services/medical-folder";
import { PatientShellServer } from "@/features/patient/components/layout/patient-shell-server";
import { FolderHeart } from "lucide-react";
import { getServerTranslator } from "@/lib/i18n/server";

type SearchParams = {
  doctorId?: string;
  from?: string;
  to?: string;
};

function parseDate(value: string | undefined, endOfDay = false) {
  if (!value) return undefined;
  const date = new Date(`${value}T${endOfDay ? "23:59:59" : "00:00:00"}`);
  if (Number.isNaN(date.getTime())) return undefined;
  return date;
}

export default async function PatientFolderPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const { t } = await getServerTranslator();
  const session = await requireRole("patient");
  const params = (await searchParams) ?? {};

  const doctorId = params.doctorId?.trim() ?? "";
  const from = parseDate(params.from, false);
  const to = parseDate(params.to, true);

  const [doctors, records] = await Promise.all([
    listMedicalFolderDoctors(session.user.id),
    listMedicalFolderRecords(session.user.id, {
      doctorId: doctorId || undefined,
      from,
      to,
    }),
  ]);

  return (
    <PatientShellServer>
      {/* ── Hero header ── */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-teal-600 via-teal-500 to-cyan-400 px-6 py-8 text-white shadow-lg">
        <div className="pointer-events-none absolute -right-8 -top-8 size-40 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -bottom-6 right-20 size-24 rounded-full bg-white/10" />

        <div className="flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-white/15">
            <FolderHeart className="size-5 text-white" />
          </div>
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-widest text-teal-200">
              {t("patient.dashboard.space")}
            </p>
            <h1 className="text-2xl font-bold">{t("patient.folder.title")}</h1>
          </div>
        </div>

        <p className="mt-3 max-w-sm text-sm text-teal-100/90">
          {t("patient.folder.description")}
        </p>

        <div className="mt-4 flex flex-wrap gap-3 text-sm font-medium">
          <div className="flex items-center gap-2 rounded-full bg-white/15 px-3.5 py-1.5 backdrop-blur-sm">
            <span className="size-2 rounded-full bg-white/60" />
            {records.length}{" "}
            {records.length === 1
              ? t("patient.folder.consultationOne")
              : t("patient.folder.consultationMany")}
          </div>
          <div className="flex items-center gap-2 rounded-full bg-white/15 px-3.5 py-1.5 backdrop-blur-sm">
            <span className="size-2 rounded-full bg-white/60" />
            {doctors.length} {doctors.length === 1 ? t("patient.folder.doctorOne") : t("patient.folder.doctorMany")}
          </div>
        </div>
      </section>

      {/* ── Filters ── */}
      <MedicalFolderFilters
        doctors={doctors}
        selectedDoctorId={doctorId}
        selectedFrom={params.from ?? ""}
        selectedTo={params.to ?? ""}
      />

      {/* ── Records ── */}
      <MedicalFolderCategories records={records} />
    </PatientShellServer>
  );
}
