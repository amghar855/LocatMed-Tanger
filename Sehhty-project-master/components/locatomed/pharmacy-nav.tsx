import Link from "next/link";
import {
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Package,
  Pill,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

type PharmacyTab = "dashboard" | "stock" | "reservations" | "settings";

type Props = {
  userName?: string;
  active: PharmacyTab;
};

const NAV_LINKS: Array<{
  key: PharmacyTab;
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  {
    key: "dashboard",
    href: "/pharmacy",
    label: "Tableau de bord",
    icon: LayoutDashboard,
  },
  {
    key: "stock",
    href: "/pharmacy/stock",
    label: "Stock",
    icon: Package,
  },
  {
    key: "reservations",
    href: "/pharmacy/reservations",
    label: "Réservations",
    icon: ClipboardList,
  },
  {
    key: "settings",
    href: "/pharmacy/settings",
    label: "Paramètres",
    icon: Settings,
  },
];

export default function PharmacyNav({ userName = "Pharmacien", active }: Props) {
  const initials =
    userName
      .split(" ")
      .filter(Boolean)
      .map((part) => part[0]?.toUpperCase())
      .slice(0, 2)
      .join("") || "P";

  return (
    <>
      <header className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur md:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-600 text-white">
              <Pill className="h-4 w-4" />
            </span>
            <div className="leading-tight">
              <p className="text-sm font-semibold tracking-tight">LOCATOMED</p>
              <p className="text-xs text-muted-foreground">Espace pharmacie</p>
            </div>
          </div>

          <Link
            href="/logout"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <LogOut className="h-4 w-4" />
            <span>Déconnexion</span>
          </Link>
        </div>

        <div className="border-t bg-cyan-50/70 px-4 py-2">
          <div className="flex items-center gap-1 overflow-x-auto">
            {NAV_LINKS.map(({ key, href, label, icon: Icon }) => (
              <Link
                key={key}
                href={href}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                  active === key
                    ? "bg-cyan-600 text-white"
                    : "text-cyan-900 hover:bg-cyan-100"
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}
          </div>
        </div>
      </header>

      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 border-r bg-background md:flex md:flex-col">
        <div className="border-b px-4 py-4">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-600 text-white">
              <Pill className="h-4 w-4" />
            </span>
            <div className="leading-tight">
              <p className="text-sm font-semibold tracking-tight">LOCATOMED</p>
              <p className="text-xs text-muted-foreground">Espace pharmacie</p>
            </div>
          </div>
        </div>

        <div className="px-4 py-4">
          <div className="rounded-xl border border-cyan-200/80 bg-cyan-50/80 p-3">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Profil
            </p>
            <div className="mt-2 flex items-center gap-2.5">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-cyan-600 text-sm font-semibold text-white">
                {initials}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{userName}</p>
                <p className="text-xs text-muted-foreground">Pharmacien</p>
              </div>
            </div>
          </div>
        </div>

        <nav className="flex flex-1 flex-col px-3 pb-3">
          <div className="space-y-1">
            {NAV_LINKS.map(({ key, href, label, icon: Icon }) => (
              <Link
                key={key}
                href={href}
                className={cn(
                  "inline-flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active === key
                    ? "bg-cyan-600 text-white"
                    : "text-foreground hover:bg-cyan-50 hover:text-cyan-900"
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}
          </div>

          <div className="mt-auto border-t px-1 pt-3">
            <Link
              href="/logout"
              className={cn(
                "inline-flex w-full items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              )}
            >
              <LogOut className="h-4 w-4" />
              Déconnexion
            </Link>
          </div>
        </nav>
      </aside>
    </>
  );
}
