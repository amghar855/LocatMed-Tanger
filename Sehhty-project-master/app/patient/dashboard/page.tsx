import { PatientQuickActions } from "@/features/patient/components/dashboard/quick-actions";
import { UpcomingReservationCard } from "@/features/patient/components/dashboard/upcoming-reservation-card";
import { PatientSummaryCards } from "@/features/patient/components/dashboard/summary-cards";
import { FavoritesPreview } from "@/features/patient/components/dashboard/favorites-preview";
import { requireRole } from "@/lib/auth/guards";
import { listFavoriteHospitalsByPatient } from "@/features/patient/services/favorites";
import { getPatientDashboardData } from "@/features/patient/services/dashboard";
import { PatientShellServer } from "@/features/patient/components/layout/patient-shell-server";
import { getServerTranslator } from "@/lib/i18n/server";

export default async function PatientDashboardPage() {
  const { t } = await getServerTranslator();
  const session = await requireRole("patient");
  const [favorites, dashboardData] = await Promise.all([
    listFavoriteHospitalsByPatient(session.user.id),
    getPatientDashboardData(session.user.id),
  ]);

  return (
    <PatientShellServer>
      {/* ── Hero greeting ── */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-teal-600 via-teal-500 to-teal-400 px-6 py-8 text-white shadow-lg">
        {/* decorative blobs */}
        <div className="pointer-events-none absolute -right-8 -top-8 size-40 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -bottom-6 right-20 size-24 rounded-full bg-white/10" />

        <p className="text-[13px] font-medium uppercase tracking-widest text-teal-100/80">
          {t("patient.dashboard.space")}
        </p>
        <h1 className="mt-1 text-4xl font-bold tracking-tight">
          {t("patient.dashboard.greeting")} 👋
        </h1>
        <p className="mt-2 max-w-xs text-sm text-teal-50/90 leading-relaxed">
          {t("patient.dashboard.intro")}
        </p>

        {/* Stat pills */}
        <div className="mt-6 flex flex-wrap gap-3">
          <div className="flex items-center gap-2 rounded-full bg-white/15 px-3.5 py-1.5 text-sm font-medium backdrop-blur-sm">
            <span className="size-2 rounded-full bg-teal-300" />
            {dashboardData.upcomingCount} {t("patient.dashboard.upcomingSuffix")}
          </div>
          <div className="flex items-center gap-2 rounded-full bg-white/15 px-3.5 py-1.5 text-sm font-medium backdrop-blur-sm">
            <span className="size-2 rounded-full bg-teal-300" />
            {dashboardData.completedCount} {t("patient.dashboard.completedSuffix")}
          </div>
          <div className="flex items-center gap-2 rounded-full bg-white/15 px-3.5 py-1.5 text-sm font-medium backdrop-blur-sm">
            <span className="size-2 rounded-full bg-rose-300" />
            {dashboardData.favoritesCount} {t("patient.dashboard.favoritesSuffix")}
          </div>
        </div>
      </section>

      {/* ── Main grid ── */}
      <div className="grid grid-cols-1 gap-8 xl:grid-cols-12">
        <div className="space-y-8 xl:col-span-8">
          <PatientQuickActions />
          <UpcomingReservationCard reservation={dashboardData.upcomingReservation} />
        </div>

        <div className="space-y-8 xl:col-span-4">
          <PatientSummaryCards
            favoritesCount={dashboardData.favoritesCount}
            reservationsCount={dashboardData.reservationsCount}
            upcomingCount={dashboardData.upcomingCount}
            completedCount={dashboardData.completedCount}
            canceledCount={dashboardData.canceledCount}
          />
          <FavoritesPreview favorites={favorites} />
        </div>
      </div>
    </PatientShellServer>
  );
}
