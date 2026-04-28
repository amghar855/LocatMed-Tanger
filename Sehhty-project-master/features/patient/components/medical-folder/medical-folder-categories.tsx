import Link from "next/link";
import type { MedicalFolderRecord } from "@/features/patient/types/medical-folder";
import {
  CalendarDays,
  Pill,
  Stethoscope,
  Building2,
  FileText,
  Heart,
  Baby,
  Brain,
  Eye,
  Bone,
  Sun,
  Activity,
  FlaskConical,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { getServerTranslator } from "@/lib/i18n/server";

type Props = {
  records: MedicalFolderRecord[];
};

type Palette = {
  border: string;
  headerBg: string;
  headerBorder: string;
  dot: string;
  dotRing: string;
  badge: string;
  badgeText: string;
  pillDot: string;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  accentText: string;
  noteBg: string;
  rxBg: string;
};

const SPECIALTY_PALETTE: Record<string, Palette> = {
  "Cardiologie": {
    border: "border-rose-200", headerBg: "bg-gradient-to-r from-rose-50 to-rose-50/40",
    headerBorder: "border-b border-rose-100", dot: "bg-rose-500", dotRing: "ring-rose-200",
    badge: "bg-rose-100", badgeText: "text-rose-700", pillDot: "bg-rose-500",
    icon: Heart, iconBg: "bg-rose-100", iconColor: "text-rose-600",
    accentText: "text-rose-700", noteBg: "bg-rose-50/50", rxBg: "bg-rose-50",
  },
  "Médecine générale": {
    border: "border-teal-200", headerBg: "bg-gradient-to-r from-teal-50 to-teal-50/40",
    headerBorder: "border-b border-teal-100", dot: "bg-teal-500", dotRing: "ring-teal-200",
    badge: "bg-teal-100", badgeText: "text-teal-700", pillDot: "bg-teal-500",
    icon: Activity, iconBg: "bg-teal-100", iconColor: "text-teal-600",
    accentText: "text-teal-700", noteBg: "bg-teal-50/50", rxBg: "bg-teal-50",
  },
  "Pédiatrie": {
    border: "border-teal-200", headerBg: "bg-gradient-to-r from-teal-50 to-teal-50/40",
    headerBorder: "border-b border-teal-100", dot: "bg-teal-500", dotRing: "ring-teal-200",
    badge: "bg-teal-100", badgeText: "text-teal-700", pillDot: "bg-teal-500",
    icon: Baby, iconBg: "bg-teal-100", iconColor: "text-teal-600",
    accentText: "text-teal-700", noteBg: "bg-teal-50/50", rxBg: "bg-teal-50",
  },
  "Gynécologie": {
    border: "border-teal-200", headerBg: "bg-gradient-to-r from-teal-50 to-teal-50/40",
    headerBorder: "border-b border-teal-100", dot: "bg-teal-500", dotRing: "ring-teal-200",
    badge: "bg-teal-100", badgeText: "text-teal-700", pillDot: "bg-teal-500",
    icon: FlaskConical, iconBg: "bg-teal-100", iconColor: "text-teal-600",
    accentText: "text-teal-700", noteBg: "bg-teal-50/50", rxBg: "bg-teal-50",
  },
  "Dermatologie": {
    border: "border-amber-200", headerBg: "bg-gradient-to-r from-amber-50 to-amber-50/40",
    headerBorder: "border-b border-amber-100", dot: "bg-amber-500", dotRing: "ring-amber-200",
    badge: "bg-amber-100", badgeText: "text-amber-700", pillDot: "bg-amber-500",
    icon: Sun, iconBg: "bg-amber-100", iconColor: "text-amber-600",
    accentText: "text-amber-700", noteBg: "bg-amber-50/50", rxBg: "bg-amber-50",
  },
  "Ophtalmologie": {
    border: "border-cyan-200", headerBg: "bg-gradient-to-r from-cyan-50 to-cyan-50/40",
    headerBorder: "border-b border-cyan-100", dot: "bg-cyan-500", dotRing: "ring-cyan-200",
    badge: "bg-cyan-100", badgeText: "text-cyan-700", pillDot: "bg-cyan-500",
    icon: Eye, iconBg: "bg-cyan-100", iconColor: "text-cyan-600",
    accentText: "text-cyan-700", noteBg: "bg-cyan-50/50", rxBg: "bg-cyan-50",
  },
  "Orthopédie": {
    border: "border-orange-200", headerBg: "bg-gradient-to-r from-orange-50 to-orange-50/40",
    headerBorder: "border-b border-orange-100", dot: "bg-orange-500", dotRing: "ring-orange-200",
    badge: "bg-orange-100", badgeText: "text-orange-700", pillDot: "bg-orange-500",
    icon: Bone, iconBg: "bg-orange-100", iconColor: "text-orange-600",
    accentText: "text-orange-700", noteBg: "bg-orange-50/50", rxBg: "bg-orange-50",
  },
  "Neurologie": {
    border: "border-teal-200", headerBg: "bg-gradient-to-r from-teal-50 to-teal-50/40",
    headerBorder: "border-b border-teal-100", dot: "bg-teal-500", dotRing: "ring-teal-200",
    badge: "bg-teal-100", badgeText: "text-teal-700", pillDot: "bg-teal-500",
    icon: Brain, iconBg: "bg-teal-100", iconColor: "text-teal-600",
    accentText: "text-teal-700", noteBg: "bg-teal-50/50", rxBg: "bg-teal-50",
  },
  "Autres": {
    border: "border-slate-200", headerBg: "bg-gradient-to-r from-slate-50 to-slate-50/40",
    headerBorder: "border-b border-slate-100", dot: "bg-slate-400", dotRing: "ring-slate-200",
    badge: "bg-slate-100", badgeText: "text-slate-600", pillDot: "bg-slate-400",
    icon: Stethoscope, iconBg: "bg-slate-100", iconColor: "text-slate-500",
    accentText: "text-slate-600", noteBg: "bg-slate-50", rxBg: "bg-slate-50",
  },
};

function getPalette(specialty: string): Palette {
  return SPECIALTY_PALETTE[specialty] ?? SPECIALTY_PALETTE["Autres"];
}

function dateLabel(date: Date) {
  return new Intl.DateTimeFormat("fr-MA", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

function groupByCategory(records: MedicalFolderRecord[]) {
  const map = new Map<string, MedicalFolderRecord[]>();
  for (const record of records) {
    const category = record.doctorSpecialty?.trim() || "Médecine générale";
    if (!map.has(category)) map.set(category, []);
    map.get(category)!.push(record);
  }
  return map;
}

export async function MedicalFolderCategories({ records }: Props) {
  const { t } = await getServerTranslator();

  if (records.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-3xl bg-slate-50 py-20 text-center">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-slate-100">
          <FileText className="size-7 text-slate-300" />
        </div>
        <div>
          <p className="text-base font-semibold text-slate-700">{t("patient.folder.emptyTitle")}</p>
          <p className="mt-1 text-sm text-slate-400">{t("patient.folder.emptyDescription")}</p>
        </div>
        <Link
          href="/patient/booking"
          className="mt-1 inline-flex items-center gap-2 rounded-full bg-teal-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-teal-700"
        >
          {t("patient.folder.book")} →
        </Link>
      </div>
    );
  }

  const categories = groupByCategory(records);

  return (
    <div className="space-y-10">
      {/* ── Specialty overview strip ── */}
      <div className="flex flex-wrap gap-2">
        {Array.from(categories.entries()).map(([cat, recs]) => {
          const pal = getPalette(cat);
          const Icon = pal.icon;
          return (
            <div
              key={cat}
              className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${pal.badge} ${pal.badgeText} ${pal.border}`}
            >
              <Icon className={`size-3.5 ${pal.iconColor}`} />
              {cat}
              <span className="opacity-60">·</span>
              {recs.length}
            </div>
          );
        })}
      </div>

      {/* ── Specialty sections ── */}
      {Array.from(categories.entries()).map(([category, categoryRecords]) => {
        const pal = getPalette(category);
        const Icon = pal.icon;
        return (
          <section key={category}>
            {/* Section header */}
            <div className="mb-5 flex items-center gap-3">
              <div className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${pal.iconBg}`}>
                <Icon className={`size-4 ${pal.iconColor}`} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h2 className={`text-base font-bold ${pal.accentText}`}>{category}</h2>
                  <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${pal.badge} ${pal.badgeText}`}>
                    {categoryRecords.length}{" "}
                    {categoryRecords.length > 1 ? t("patient.folder.consultationMany") : t("patient.folder.consultationOne")}
                  </span>
                </div>
              </div>
              {/* horizontal line */}
              <div className={`h-px flex-1 rounded-full ${pal.badge}`} />
            </div>

            {/* Timeline */}
            <div className="relative space-y-4 pl-7">
              {/* vertical connector */}
              <div className={`absolute left-[9px] top-3 bottom-3 w-px ${pal.dot} opacity-20`} />

              {categoryRecords.map((record, idx) => (
                <div key={record.id} className="relative">
                  {/* timeline dot */}
                  <span
                    className={`absolute -left-[22px] top-4 flex size-3 items-center justify-center rounded-full ring-2 ring-white ${pal.dot}`}
                  >
                    {idx === 0 && (
                      <span className={`size-1.5 animate-pulse rounded-full bg-white/80`} />
                    )}
                  </span>

                  {/* ── Consultation card ── */}
                  <div className={`overflow-hidden rounded-2xl border-2 ${pal.border} bg-white shadow-sm transition-shadow hover:shadow-md`}>

                    {/* Card header band */}
                    <div className={`${pal.headerBg} ${pal.headerBorder} px-5 py-4`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          {/* Date pill */}
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${pal.badge} ${pal.accentText}`}>
                            <CalendarDays className="size-3" />
                            {dateLabel(record.date)}
                          </span>

                          {/* Diagnosis */}
                          <h3 className="mt-2 text-[15px] font-bold leading-snug text-slate-900">
                            {record.diagnosis}
                          </h3>

                          {/* Doctor + Hospital */}
                          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
                            <span className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
                              <Stethoscope className={`size-3.5 ${pal.iconColor}`} />
                              {record.doctorName}
                            </span>
                            {record.hospitalName && (
                              <span className="flex items-center gap-1.5 text-xs text-slate-500">
                                <Building2 className="size-3.5 text-slate-400" />
                                {record.hospitalName}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Large specialty icon (decorative) */}
                        <div className={`hidden shrink-0 items-center justify-center rounded-xl p-2.5 sm:flex ${pal.iconBg}`}>
                          <Icon className={`size-5 ${pal.iconColor} opacity-70`} />
                        </div>
                      </div>
                    </div>

                    {/* Notes section */}
                    {record.notes && (
                      <div className={`px-5 py-4 ${pal.noteBg}`}>
                        <p className="mb-1.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                          <FileText className="size-3" />
                          {t("patient.folder.observations")}
                        </p>
                        <p className="whitespace-pre-line text-sm leading-relaxed text-slate-700">
                          {record.notes}
                        </p>
                      </div>
                    )}

                    {/* Prescription section */}
                    {record.prescription.length > 0 && (
                      <div className={`border-t ${pal.border} px-5 py-4 ${pal.rxBg}`}>
                        <p className="mb-3 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                          <Pill className="size-3" />
                          {t("patient.folder.prescription")}
                        </p>
                        <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                          {record.prescription.map((item) => (
                            <li
                              key={`${record.id}-${item.medicineId}`}
                              className="flex items-start gap-3 rounded-xl bg-white/80 px-3 py-2.5 shadow-sm ring-1 ring-slate-100"
                            >
                              <div className={`mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-lg ${pal.iconBg}`}>
                                <Pill className={`size-3 ${pal.iconColor}`} />
                              </div>
                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-slate-800">
                                  {item.medicineName}
                                </p>
                                <p className="text-xs text-slate-500">{item.dosage}</p>
                                {item.duration && (
                                  <span className={`mt-0.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${pal.badge} ${pal.accentText}`}>
                                    {item.duration}
                                  </span>
                                )}
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
