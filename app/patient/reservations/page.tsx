import { requireRole } from "@/lib/auth/guards";
import { getReservations } from "@/features/patient/services/booking";
import { ReservationList } from "@/features/patient/components/booking/reservation-list";
import { PatientShellServer } from "@/features/patient/components/layout/patient-shell-server";
import { CalendarCheck2, CalendarClock, CheckCircle2, XCircle } from "lucide-react";
import { getServerTranslator } from "@/lib/i18n/server";

export default async function PatientReservationsPage() {
  const { t } = await getServerTranslator();
  const session = await requireRole("patient");
  const reservations = await getReservations(session.user.id);

  const upcoming = reservations.filter((r) => r.status === "upcoming").length;
  const completed = reservations.filter((r) => r.status === "completed").length;
  const canceled = reservations.filter((r) => r.status === "canceled").length;

  return (
    <PatientShellServer>
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-teal-600 via-teal-500 to-cyan-400 px-6 py-8 text-white shadow-lg">
        <div className="pointer-events-none absolute -right-8 -top-8 size-40 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -bottom-6 right-20 size-24 rounded-full bg-white/10" />

        <div className="flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-white/15">
            <CalendarCheck2 className="size-5 text-white" />
          </div>
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-widest text-teal-100">
              {t("patient.dashboard.space")}
            </p>
            <h1 className="text-2xl font-bold">{t("patient.reservations.title")}</h1>
          </div>
        </div>

        <p className="mt-3 max-w-sm text-sm text-teal-100/90">
          {t("patient.reservations.description")}
        </p>

        {/* Stats row */}
        <div className="mt-4 flex flex-wrap gap-3 text-sm font-medium">
          <div className="flex items-center gap-2 rounded-full bg-white/15 px-3.5 py-1.5 backdrop-blur-sm">
            <CalendarClock className="size-3.5" />
            {upcoming} {t("patient.reservations.upcomingShort")}
          </div>
          <div className="flex items-center gap-2 rounded-full bg-white/15 px-3.5 py-1.5 backdrop-blur-sm">
            <CheckCircle2 className="size-3.5" />
            {completed}{" "}
            {completed === 1
              ? t("patient.reservations.completedShort")
              : t("patient.reservations.completedShortPlural")}
          </div>
          <div className="flex items-center gap-2 rounded-full bg-white/15 px-3.5 py-1.5 backdrop-blur-sm">
            <XCircle className="size-3.5" />
            {canceled}{" "}
            {canceled === 1
              ? t("patient.reservations.canceledShort")
              : t("patient.reservations.canceledShortPlural")}
          </div>
        </div>
      </section>

      <ReservationList reservations={reservations} />
    </PatientShellServer>
  );
}
