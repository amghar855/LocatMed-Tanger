import { format } from "date-fns";
import type { DashboardUpcomingReservation } from "@/features/patient/types/dashboard";
import { CalendarClock, MapPin, Stethoscope, User, ChevronRight } from "lucide-react";
import Link from "next/link";
import { getServerTranslator } from "@/lib/i18n/server";

type Props = {
  reservation: DashboardUpcomingReservation | null;
};

export async function UpcomingReservationCard({ reservation }: Props) {
  const { t } = await getServerTranslator();

  return (
    <div>
      <p className="mb-3 px-1 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
        {t("patient.dashboard.nextAppointment")}
      </p>

      {!reservation ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl bg-slate-50 py-10 text-center">
          <CalendarClock className="size-8 text-slate-300" />
          <p className="text-sm text-slate-500">{t("patient.dashboard.noUpcoming")}</p>
          <Link
            href="/patient/booking"
            className="mt-1 text-xs font-medium text-teal-600 hover:underline"
          >
            {t("patient.dashboard.bookAppointment")} →
          </Link>
        </div>
      ) : (
        <Link
          href="/patient/reservations"
          className="group flex items-center gap-4 rounded-2xl bg-gradient-to-r from-slate-50 to-white p-5 ring-1 ring-slate-100 transition-all hover:ring-teal-200"
        >
          {/* Date badge */}
          <div className="flex shrink-0 flex-col items-center justify-center rounded-2xl bg-teal-600 px-4 py-3 text-white shadow-md">
            <p className="text-2xl font-bold leading-none">
              {format(reservation.datetime, "dd")}
            </p>
            <p className="mt-0.5 text-[11px] font-medium uppercase tracking-wide opacity-80">
              {format(reservation.datetime, "MMM")}
            </p>
          </div>

          {/* Details */}
          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-900">
              <MapPin className="size-3.5 shrink-0 text-teal-600" />
              <span className="truncate">{reservation.hospitalName}</span>
            </div>
            <div className="flex items-center gap-1.5 text-sm text-slate-500">
              <User className="size-3.5 shrink-0" />
              <span className="truncate">{reservation.doctorName}</span>
            </div>
            <div className="flex items-center gap-1.5 text-sm text-slate-500">
              <Stethoscope className="size-3.5 shrink-0" />
              <span className="truncate">{reservation.specialty}</span>
            </div>
            <p className="pt-1 text-xs font-medium text-teal-600">
              {format(reservation.datetime, "dd/MM/yyyy")} {t("patient.dashboard.at")}{" "}
              {format(reservation.datetime, "HH:mm")}
            </p>
          </div>

          <ChevronRight className="size-4 shrink-0 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-teal-500" />
        </Link>
      )}
    </div>
  );
}
