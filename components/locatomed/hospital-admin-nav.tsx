import Link from "next/link";
import { Building2, LayoutDashboard, LogOut, Settings, Stethoscope } from "lucide-react";
import { cn } from "@/lib/utils";

type HospitalAdminTab = "dashboard" | "doctors" | "settings";

type Props = {
  userName: string;
  active: HospitalAdminTab;
};

const NAV_LINKS: Array<{ key: HospitalAdminTab; href: string; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { key: "dashboard", href: "/hospital-admin", label: "Tableau de bord", icon: LayoutDashboard },
  { key: "doctors", href: "/hospital-admin/doctors", label: "Médecins", icon: Stethoscope },
  { key: "settings", href: "/hospital-admin/settings", label: "Paramètres", icon: Settings },
];

export default function HospitalAdminNav({ userName, active }: Props) {
  const initials = userName
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase())
    .slice(0, 2)
    .join("") || "A";

  return (
    <>
      {/* ── Mobile header (untouched) ── */}
      <header className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur md:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2.5">
            {/* TODO: replace with <img src="/logo-locatomed.png" /> */}
            <img
              src="/logo-locatomed.png"
              alt="LocatMed"
              className="h-10 w-auto object-contain"
            />
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-teal-600 text-white">
              <Building2 className="h-4 w-4" />
            </span>
            <div className="leading-tight">
              <p className="text-xs text-muted-foreground">Administration hôpital</p>
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

        <div className="border-t bg-teal-50/70 px-4 py-2">
          <div className="flex items-center gap-1 overflow-x-auto">
            {NAV_LINKS.map(({ key, href, label, icon: Icon }) => (
              <Link
                key={key}
                href={href}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                  active === key
                    ? "bg-teal-600 text-white"
                    : "text-teal-900 hover:bg-teal-100"
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}
          </div>
        </div>
      </header>

      {/* ── Desktop sidebar (glassmorphism) ── */}
      <aside
        className="fixed inset-y-0 left-0 z-30 hidden w-72 overflow-hidden md:flex md:flex-col"
        style={{
          background:
            "linear-gradient(160deg, rgba(13,148,136,0.15) 0%, rgba(6,182,212,0.08) 100%)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderRight: "1px solid rgba(20,184,166,0.15)",
        }}
      >
        {/* Decorative blob */}
        <div
          aria-hidden
          className="pointer-events-none absolute"
          style={{
            bottom: "20%",
            left: "-30%",
            width: "200px",
            height: "200px",
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(13,148,136,0.2), transparent 70%)",
            zIndex: 0,
          }}
        />

        {/* Logo + role badge */}
        <div className="relative z-10 px-5 pt-6 pb-4">
          <img
            src="/logo-locatomed.png"
            alt="LocatMed"
            className="h-10 w-auto object-contain"
          />
          <span
            className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold"
            style={{
              background: "rgba(13,148,136,0.15)",
              border: "1px solid rgba(13,148,136,0.25)",
              color: "#0d9488",
              borderRadius: "20px",
              padding: "4px 12px",
            }}
          >
            <Building2 className="h-3 w-3" />
            Administration hôpital
          </span>
        </div>

        {/* Profile card */}
        <div className="relative z-10 px-5 pb-4">
          <div
            style={{
              background: "rgba(255,255,255,0.25)",
              backdropFilter: "blur(10px)",
              WebkitBackdropFilter: "blur(10px)",
              border: "1px solid rgba(255,255,255,0.3)",
              borderRadius: "14px",
              padding: "12px 16px",
            }}
          >
            <div className="flex items-center gap-3">
              <span
                className="flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                style={{
                  background: "linear-gradient(135deg, #0d9488, #06b6d4)",
                  boxShadow: "0 4px 10px rgba(13,148,136,0.25)",
                }}
              >
                {initials}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-[#0f2420]">
                  {userName}
                </p>
                <p className="text-xs text-[#5f8a84]">Administrateur</p>
              </div>
            </div>
          </div>
        </div>

        {/* Nav links + logout */}
        <nav className="relative z-10 flex flex-1 flex-col px-3 pb-4">
          <div className="space-y-1">
            {NAV_LINKS.map(({ key, href, label, icon: Icon }) => {
              const isActive = active === key;
              return (
                <Link
                  key={key}
                  href={href}
                  className={cn(
                    "inline-flex w-full items-center gap-2.5 text-sm font-medium transition-all",
                    isActive
                      ? "text-white"
                      : "text-[#0f766e] hover:bg-[#0d9488]/10 hover:text-[#0d9488]"
                  )}
                  style={
                    isActive
                      ? {
                          background: "rgba(13,148,136,0.85)",
                          borderRadius: "10px",
                          padding: "10px 14px",
                          boxShadow: "0 4px 12px rgba(13,148,136,0.3)",
                        }
                      : { borderRadius: "10px", padding: "10px 14px" }
                  }
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              );
            })}
          </div>

          <div className="mt-auto pt-4">
            <Link
              href="/logout"
              className="inline-flex w-full items-center gap-2.5 text-sm font-medium text-[#0f766e] transition-colors hover:bg-red-500/10 hover:text-[#ef4444]"
              style={{
                background: "rgba(255,255,255,0.2)",
                border: "1px solid rgba(255,255,255,0.3)",
                borderRadius: "10px",
                padding: "10px 14px",
              }}
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
