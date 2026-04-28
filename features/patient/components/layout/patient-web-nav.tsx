import Link from "next/link";
import { getServerTranslator } from "@/lib/i18n/server";

type Props = {
  className?: string;
};

const NAV_ITEMS = [
  { href: "/patient/dashboard", labelKey: "patient.nav.home" },
  { href: "/patient/booking", labelKey: "patient.dashboard.reserve" },
  { href: "/patient/reservations", labelKey: "patient.nav.reservations" },
  { href: "/patient/discover", labelKey: "patient.nav.discover" },
  { href: "/patient/favorites", labelKey: "patient.nav.favorites" },
  { href: "/patient/folder", labelKey: "patient.nav.folder" },
  { href: "/patient/medicine-search", labelKey: "patient.nav.medicines" },
  { href: "/patient/ordonnance-scan", labelKey: "patient.nav.ordonnance" },
  { href: "/patient/chatbot", labelKey: "patient.nav.chatbot" },
];

export async function PatientWebNav({ className = "" }: Props) {
  const { t } = await getServerTranslator();

  return (
    <nav
      aria-label={t("patient.nav.webAria")}
      className={`rounded-lg border bg-[#050f0e] px-4 py-3 shadow-sm ${className}`.trim()}
    >
      <ul className="flex flex-wrap items-center gap-2">
        {NAV_ITEMS.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="inline-flex rounded-full border border-slate-200 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100"
            >
              {t(item.labelKey)}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}