import { format } from "date-fns";
import { fr } from "date-fns/locale";
import type { Reservation } from "@/features/patient/types/booking";
import { CancelReservationButton } from "@/features/patient/components/booking/cancel-reservation-button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getServerTranslator } from "@/lib/i18n/server";
import {
  CalendarCheck2,
  MapPin,
  Stethoscope,
  User,
  Clock,
  CheckCircle2,
  XCircle,
  CalendarClock,
} from "lucide-react";

type Props = {
  reservations: Reservation[];
};

type StatusLabels = {
  upcoming: string;
  completed: string;
  canceled: string;
};

const STATUS_CONFIG = {
  upcoming: {
    label: "À venir",
    badge: "bg-teal-100 text-teal-700",
    border: "border-l-teal-400",
    headerBg: "bg-teal-50/60",
    icon: CalendarClock,
    iconColor: "text-teal-600",
    dotColor: "bg-teal-500",
    allowCancel: true,
  },
  completed: {
    label: "Terminée",
    badge: "bg-teal-100 text-teal-700",
    border: "border-l-teal-400",
    headerBg: "bg-teal-50/60",
    icon: CheckCircle2,
    iconColor: "text-teal-600",
    dotColor: "bg-teal-500",
    allowCancel: false,
  },
  canceled: {
    label: "Annulée",
    badge: "bg-rose-100 text-rose-700",
    border: "border-l-rose-400",
    headerBg: "bg-rose-50/60",
    icon: XCircle,
    iconColor: "text-rose-500",
    dotColor: "bg-rose-400",
    allowCancel: false,
  },
};

function ReservationCard({
  reservation,
  statusKey,
  statusLabels,
}: {
  reservation: Reservation;
  statusKey: keyof typeof STATUS_CONFIG;
  statusLabels: StatusLabels;
}) {
  const cfg = STATUS_CONFIG[statusKey] ?? STATUS_CONFIG.upcoming;
  const StatusIcon = cfg.icon;

  const dayLabel = format(reservation.datetime, "EEEE dd MMMM yyyy", { locale: fr });
  const timeLabel = format(reservation.datetime, "HH:mm");

  return (
    <article
      className={`overflow-hidden rounded-2xl border-2 border-l-4 border-slate-100 bg-white shadow-sm transition-shadow hover:shadow-md ${cfg.border}`}
    >
      {/* Header band */}
      <div className={`${cfg.headerBg} flex items-center justify-between gap-3 px-4 py-3`}>
        <div className="flex items-center gap-2 min-w-0">
          <MapPin className={`size-3.5 shrink-0 ${cfg.iconColor}`} />
          <p className="truncate font-bold text-sm text-slate-900">{reservation.hospitalName}</p>
        </div>
        <span className={`shrink-0 flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${cfg.badge}`}>
          <StatusIcon className="size-3" />
          {statusLabels[statusKey]}
        </span>
      </div>

      {/* Body */}
      <div className="px-4 py-3 space-y-2">
        <div className="flex items-center gap-2.5 text-sm text-slate-700">
          <User className="size-3.5 shrink-0 text-slate-400" />
          <span className="font-medium">{reservation.doctorName}</span>
        </div>
        <div className="flex items-center gap-2.5 text-sm text-slate-600">
          <Stethoscope className="size-3.5 shrink-0 text-slate-400" />
          <span>{reservation.specialty}</span>
        </div>

        {/* Date/time row */}
        <div className="mt-1 flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2.5">
          <CalendarCheck2 className={`size-4 shrink-0 ${cfg.iconColor}`} />
          <div>
            <p className="text-xs font-semibold text-slate-800 capitalize">{dayLabel}</p>
            <p className="flex items-center gap-1 text-xs text-slate-500">
              <Clock className="size-3" />
              {timeLabel}
            </p>
          </div>
        </div>
      </div>

      {/* Cancel action */}
      {cfg.allowCancel && (
        <div className="border-t border-slate-100 px-4 py-3">
          <CancelReservationButton reservationId={reservation.id} />
        </div>
      )}
    </article>
  );
}

function EmptyTab({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 py-14 text-center">
      <CalendarCheck2 className="size-7 text-slate-300" />
      <p className="text-sm font-medium text-slate-500">{label}</p>
    </div>
  );
}

export async function ReservationList({ reservations }: Props) {
  const { t } = await getServerTranslator();

  const statusLabels: StatusLabels = {
    upcoming: t("patient.reservations.statusUpcoming"),
    completed: t("patient.reservations.statusCompleted"),
    canceled: t("patient.reservations.statusCanceled"),
  };

  const upcoming = reservations.filter((r) => r.status === "upcoming");
  const completed = reservations.filter((r) => r.status === "completed");
  const canceled = reservations.filter((r) => r.status === "canceled");

  return (
    <Tabs defaultValue="upcoming" className="space-y-5">
      {/* Tab bar */}
      <TabsList variant="line" className="w-full justify-start gap-1 border-b-0 bg-slate-100/80 p-1 rounded-2xl">
        <TabsTrigger value="upcoming" className="flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold data-[state=active]:bg-white data-[state=active]:shadow-sm">
          <CalendarClock className="size-3.5" />
          {t("patient.reservations.tabUpcoming")}
          {upcoming.length > 0 && (
            <span className="rounded-full bg-teal-100 px-1.5 py-0.5 text-[10px] font-bold text-teal-700">
              {upcoming.length}
            </span>
          )}
        </TabsTrigger>
        <TabsTrigger value="completed" className="flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold data-[state=active]:bg-white data-[state=active]:shadow-sm">
          <CheckCircle2 className="size-3.5" />
          {t("patient.reservations.tabCompleted")}
          {completed.length > 0 && (
            <span className="rounded-full bg-teal-100 px-1.5 py-0.5 text-[10px] font-bold text-teal-700">
              {completed.length}
            </span>
          )}
        </TabsTrigger>
        <TabsTrigger value="canceled" className="flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold data-[state=active]:bg-white data-[state=active]:shadow-sm">
          <XCircle className="size-3.5" />
          {t("patient.reservations.tabCanceled")}
          {canceled.length > 0 && (
            <span className="rounded-full bg-rose-100 px-1.5 py-0.5 text-[10px] font-bold text-rose-700">
              {canceled.length}
            </span>
          )}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="upcoming">
        {upcoming.length === 0 ? (
          <EmptyTab label={t("patient.reservations.emptyUpcoming")} />
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {upcoming.map((r) => <ReservationCard key={r.id} reservation={r} statusKey="upcoming" statusLabels={statusLabels} />)}
          </div>
        )}
      </TabsContent>

      <TabsContent value="completed">
        {completed.length === 0 ? (
          <EmptyTab label={t("patient.reservations.emptyCompleted")} />
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {completed.map((r) => <ReservationCard key={r.id} reservation={r} statusKey="completed" statusLabels={statusLabels} />)}
          </div>
        )}
      </TabsContent>

      <TabsContent value="canceled">
        {canceled.length === 0 ? (
          <EmptyTab label={t("patient.reservations.emptyCanceled")} />
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {canceled.map((r) => <ReservationCard key={r.id} reservation={r} statusKey="canceled" statusLabels={statusLabels} />)}
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}
