import Link from "next/link";
import {
  Compass,
  Heart,
  MessageCircleHeart,
  ScanLine,
  ArrowRight,
} from "lucide-react";
import { getServerTranslator } from "@/lib/i18n/server";

export async function PatientQuickActions() {
  const { t } = await getServerTranslator();

  const miniActions = [
    {
      href: "/patient/discover",
      label: t("patient.dashboard.hospitals"),
      icon: Compass,
      color: "text-teal-600",
      bg: "bg-teal-50",
      activeBg: "hover:bg-teal-100",
    },
    {
      href: "/patient/ordonnance-scan",
      label: t("patient.nav.ordonnance"),
      icon: ScanLine,
      color: "text-teal-600",
      bg: "bg-teal-50",
      activeBg: "hover:bg-teal-100",
    },
    {
      href: "/patient/chatbot",
      label: t("patient.nav.chatbot"),
      icon: MessageCircleHeart,
      color: "text-teal-600",
      bg: "bg-teal-50",
      activeBg: "hover:bg-teal-100",
    },
    {
      href: "/patient/favorites",
      label: t("patient.nav.favorites"),
      icon: Heart,
      color: "text-rose-500",
      bg: "bg-rose-50",
      activeBg: "hover:bg-rose-100",
    },
  ];

  return (
    <div className="space-y-6">
      {/* CTA banner */}
      <div className="flex items-center justify-between rounded-2xl bg-teal-50 px-5 py-5">
        <div>
          <p className="font-heading text-base font-semibold text-teal-900">
            {t("patient.dashboard.quickTitle")}
          </p>
          <p className="mt-0.5 text-sm text-teal-700/80">
            {t("patient.dashboard.quickDescription")}
          </p>
        </div>
        <Link
          href="/patient/booking"
          className="flex items-center gap-1.5 rounded-full bg-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-teal-700"
        >
          {t("patient.dashboard.reserve")}
          <ArrowRight className="size-3.5" />
        </Link>
      </div>

      {/* Quick action grid */}
      <div>
        <p className="mb-3 px-1 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
          {t("patient.dashboard.quickActions")}
        </p>
        <div className="grid grid-cols-4 gap-3">
          {miniActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.href}
                href={action.href}
                className={`group flex flex-col items-center gap-2.5 rounded-2xl px-2 py-4 text-center text-xs font-medium text-slate-600 transition-all ${action.activeBg}`}
              >
                <span
                  className={`flex size-11 items-center justify-center rounded-xl ${action.bg} transition-transform group-hover:scale-110`}
                >
                  <Icon className={`size-5 ${action.color}`} />
                </span>
                <span className="text-slate-700">{action.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
