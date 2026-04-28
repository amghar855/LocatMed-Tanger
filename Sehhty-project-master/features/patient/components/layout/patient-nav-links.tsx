"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarCheck2,
  Compass,
  FolderHeart,
  LayoutDashboard,
  MessageCircleHeart,
  ScanLine,
  Stethoscope,
  Star,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { useI18n } from "@/components/locatomed/i18n-provider";

type Props = {
  onNavigate?: () => void;
  className?: string;
};

type NavItem = {
  href: string;
  labelKey: string;
  icon: React.ComponentType<{ className?: string }>;
};

const PATIENT_NAV_ITEMS: NavItem[] = [
  { href: "/patient/dashboard", labelKey: "patient.nav.home", icon: LayoutDashboard },
  { href: "/patient/discover", labelKey: "patient.nav.discover", icon: Compass },
  { href: "/patient/booking", labelKey: "patient.nav.booking", icon: Stethoscope },
  { href: "/patient/reservations", labelKey: "patient.nav.reservations", icon: CalendarCheck2 },
  { href: "/patient/folder", labelKey: "patient.nav.folder", icon: FolderHeart },
  { href: "/patient/favorites", labelKey: "patient.nav.favorites", icon: Star },
  { href: "/patient/ordonnance-scan", labelKey: "patient.nav.ordonnance", icon: ScanLine },
  { href: "/patient/chatbot", labelKey: "patient.nav.chatbot", icon: MessageCircleHeart },
];

function isNavActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function PatientNavLinks({ onNavigate, className }: Props) {
  const pathname = usePathname();
  const { t } = useI18n();

  return (
    <ul className={cn("space-y-0.5", className)}>
      {PATIENT_NAV_ITEMS.map((item) => {
        const active = isNavActive(pathname, item.href);
        const Icon = item.icon;

        return (
          <li key={item.href}>
            <Link
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                active
                  ? "bg-teal-50 text-teal-800"
                  : "border border-transparent text-slate-600 hover:border-teal-200 hover:bg-teal-50/40 hover:text-slate-900"
              )}
              aria-current={active ? "page" : undefined}
            >
              <span
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-lg transition-all duration-200",
                  active
                    ? "bg-teal-600 text-white"
                    : "bg-slate-100 text-slate-500 group-hover:bg-teal-100 group-hover:text-teal-700"
                )}
              >
                <Icon className="size-3.5" />
              </span>
              <span>{t(item.labelKey)}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
