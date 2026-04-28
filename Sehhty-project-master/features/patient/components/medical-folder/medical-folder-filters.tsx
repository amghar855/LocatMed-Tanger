import type { MedicalFolderDoctorOption } from "@/features/patient/types/medical-folder";
import { Filter, RotateCcw, User, CalendarDays, ChevronDown } from "lucide-react";
import { getServerTranslator } from "@/lib/i18n/server";

type Props = {
  doctors: MedicalFolderDoctorOption[];
  selectedDoctorId: string;
  selectedFrom: string;
  selectedTo: string;
};

export async function MedicalFolderFilters({
  doctors,
  selectedDoctorId,
  selectedFrom,
  selectedTo,
}: Props) {
  const { t } = await getServerTranslator();
  const hasFilters = selectedDoctorId || selectedFrom || selectedTo;

  return (
    <form method="get" className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-lg bg-slate-100">
            <Filter className="size-3.5 text-slate-500" />
          </div>
          <p className="text-sm font-semibold text-slate-700">{t("patient.folder.filtersTitle")}</p>
        </div>
        {hasFilters && (
          <a
            href="/patient/folder"
            className="flex items-center gap-1 rounded-full border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-500 transition-colors hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
          >
            <RotateCcw className="size-3" />
            {t("patient.folder.reset")}
          </a>
        )}
      </div>

      {/* Fields grid */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {/* Doctor */}
        <div className="space-y-1.5">
          <label htmlFor="filter-doctor" className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
            <User className="size-3.5" />
            {t("patient.folder.doctorLabel")}
          </label>
          <div className="relative">
            <select
              id="filter-doctor"
              name="doctorId"
              defaultValue={selectedDoctorId}
              className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-3 pr-9 text-sm text-slate-700 focus:border-teal-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-100"
            >
              <option value="">{t("patient.folder.allDoctors")}</option>
              {doctors.map((doctor) => (
                <option key={doctor.id} value={doctor.id}>
                  {doctor.fullName}
                  {doctor.specialty ? ` · ${doctor.specialty}` : ""}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
          </div>
        </div>

        {/* From date */}
        <div className="space-y-1.5">
          <label htmlFor="filter-from" className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
            <CalendarDays className="size-3.5" />
            {t("patient.folder.from")}
          </label>
          <input
            id="filter-from"
            name="from"
            type="date"
            defaultValue={selectedFrom}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-sm text-slate-700 focus:border-teal-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-100"
          />
        </div>

        {/* To date */}
        <div className="space-y-1.5">
          <label htmlFor="filter-to" className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
            <CalendarDays className="size-3.5" />
            {t("patient.folder.to")}
          </label>
          <input
            id="filter-to"
            name="to"
            type="date"
            defaultValue={selectedTo}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-sm text-slate-700 focus:border-teal-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-100"
          />
        </div>
      </div>

      {/* Actions row */}
      <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-4">
        <button
          type="submit"
          className="flex-1 rounded-xl bg-teal-600 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-teal-700 sm:flex-none sm:px-6"
        >
          {t("patient.folder.applyFilters")}
        </button>
        {hasFilters && (
          <a
            href="/patient/folder"
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50"
          >
            {t("patient.folder.clear")}
          </a>
        )}
        <p className="ml-auto hidden text-xs text-slate-400 sm:block">
          {hasFilters ? t("patient.folder.activeFilters") : t("patient.folder.allConsultations")}
        </p>
      </div>
    </form>
  );
}
