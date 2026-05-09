import { CalendarCheck2, CheckCircle2, Clock, Heart, XCircle } from "lucide-react";
import { getServerTranslator } from "@/lib/i18n/server";
import { BorderGlow } from "@/components/ui/border-glow";

type Props = {
  favoritesCount: number;
  reservationsCount: number;
  upcomingCount: number;
  completedCount: number;
  canceledCount: number;
};

type StatItem = {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  iconBg: string;
  valueColor: string;
};

export async function PatientSummaryCards({
  favoritesCount,
  reservationsCount,
  upcomingCount,
  completedCount,
  canceledCount,
}: Props) {
  const { t } = await getServerTranslator();

  const stats: StatItem[] = [
    {
      label: t("patient.dashboard.favoritesLabel"),
      value: favoritesCount,
      icon: Heart,
      iconColor: "text-rose-500",
      iconBg: "bg-rose-50",
      valueColor: "text-rose-600",
    },
    {
      label: t("patient.dashboard.reservationsLabel"),
      value: reservationsCount,
      icon: CalendarCheck2,
      iconColor: "text-slate-500",
      iconBg: "bg-slate-100",
      valueColor: "text-slate-800",
    },
    {
      label: t("patient.dashboard.upcomingLabel"),
      value: upcomingCount,
      icon: Clock,
      iconColor: "text-teal-600",
      iconBg: "bg-teal-50",
      valueColor: "text-teal-700",
    },
    {
      label: t("patient.dashboard.completedLabel"),
      value: completedCount,
      icon: CheckCircle2,
      iconColor: "text-teal-600",
      iconBg: "bg-teal-50",
      valueColor: "text-teal-700",
    },
    {
      label: t("patient.dashboard.canceledLabel"),
      value: canceledCount,
      icon: XCircle,
      iconColor: "text-amber-500",
      iconBg: "bg-amber-50",
      valueColor: "text-amber-700",
    },
  ];

  return (
    <div>
      <p className="mb-3 px-1 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
        {t("patient.dashboard.summary")}
      </p>
      <div className="grid grid-cols-2 gap-3">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <BorderGlow
              key={stat.label}
              backgroundColor="white"
              borderRadius={12}
              colors={['#00a99d', '#2dd4bf', '#38bdf8']}
              edgeSensitivity={20}
              animated={false}
            >
              <div
                className="flex h-full items-center gap-3 px-4 py-4"
              >
                <div className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${stat.iconBg}`}>
                  <Icon className={`size-4 ${stat.iconColor}`} />
                </div>
                <div>
                  <p className={`text-xl font-bold leading-none ${stat.valueColor}`}>
                    {stat.value}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">{stat.label}</p>
                </div>
              </div>
            </BorderGlow>
          );
        })}
      </div>
    </div>
  );
}
