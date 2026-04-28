import { requireRole } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { PatientShellServer } from "@/features/patient/components/layout/patient-shell-server";
import { ProfileForm } from "@/features/patient/components/profile/profile-form";
import { LanguageSwitcher } from "@/components/locatomed/language-switcher";
import { Mail, Phone, ShieldCheck } from "lucide-react";
import { getServerTranslator } from "@/lib/i18n/server";

export default async function PatientProfilePage() {
  const { t } = await getServerTranslator();
  const session = await requireRole("patient");

  const patient = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
  });

  if (!patient) return null;

  function getInitials(name: string) {
    return name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((n) => n[0].toUpperCase())
      .join("");
  }

  return (
    <PatientShellServer>
      <section className="flex justify-end">
        <LanguageSwitcher />
      </section>

      {/* Avatar + identity */}
      <section className="flex flex-col items-center gap-4 rounded-3xl bg-gradient-to-br from-teal-600 via-teal-500 to-teal-400 px-6 py-10 text-white shadow-lg">
        <div className="flex size-20 items-center justify-center rounded-2xl bg-white/20 text-3xl font-bold shadow-inner backdrop-blur-sm">
          {getInitials(patient.fullName)}
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight">{patient.fullName}</h1>
          <p className="mt-1 text-sm text-teal-100/80">{t("patient.profile.spaceTangier")}</p>
        </div>
      </section>

      {/* Info cards */}
      <section className="grid gap-3 sm:grid-cols-2">
        <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white px-4 py-3.5 shadow-sm">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-slate-100">
            <Mail className="size-4 text-slate-500" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{t("patient.profile.email")}</p>
            <p className="truncate text-sm font-medium text-slate-900">{patient.email}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white px-4 py-3.5 shadow-sm">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-slate-100">
            <Phone className="size-4 text-slate-500" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{t("patient.profile.phone")}</p>
            <p className="truncate text-sm font-medium text-slate-900">
              {patient.phone ?? <span className="text-slate-400 italic">{t("patient.profile.notProvided")}</span>}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white px-4 py-3.5 shadow-sm sm:col-span-2">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-teal-50">
            <ShieldCheck className="size-4 text-teal-600" />
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{t("patient.profile.role")}</p>
            <p className="text-sm font-medium text-slate-900">{t("patient.profile.rolePatient")}</p>
          </div>
        </div>
      </section>

      {/* Edit form */}
      <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-base font-semibold text-slate-900">{t("patient.profile.editInfo")}</h2>
        <ProfileForm fullName={patient.fullName} phone={patient.phone ?? null} />
      </section>
    </PatientShellServer>
  );
}
