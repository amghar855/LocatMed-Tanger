"use client";

import Link from "next/link";
import Image from "next/image";
import { LogOut, Menu, Search, User, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { PatientNavLinks } from "@/features/patient/components/layout/patient-nav-links";
import { useI18n } from "@/components/locatomed/i18n-provider";
import { useState } from "react";

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join("");
}

export function SidebarDrawerContent({
  patient,
  onNavigate,
}: {
  patient: { name: string; email: string };
  onNavigate?: () => void;
}) {
  const { t } = useI18n();

  return (
    <div className="relative flex h-full flex-col">
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

      {/* Role badge (logo lives in patient-shell / PatientNavbar top bar) */}
      <div className="relative z-10 mb-5">
        <span
          className="inline-flex items-center gap-1.5 text-xs font-semibold"
          style={{
            background: "rgba(13,148,136,0.15)",
            border: "1px solid rgba(13,148,136,0.25)",
            color: "#0d9488",
            borderRadius: "20px",
            padding: "4px 12px",
          }}
        >
          <User className="h-3 w-3" />
          Espace patient
        </span>
      </div>

      {/* Profile card */}
      <Link
        href="/patient/profile"
        onClick={onNavigate}
        className="relative z-10 mb-6 block"
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
            {getInitials(patient.name) || "?"}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-[#0f2420]">
              {patient.name}
            </p>
            <p className="truncate text-xs text-[#5f8a84]">{patient.email}</p>
          </div>
        </div>
      </Link>

      {/* Nav links */}
      <div className="relative z-10 flex-1 overflow-y-auto">
        <p className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-widest text-[#5f8a84]">
          {t("patient.nav.navigation")}
        </p>
        <PatientNavLinks onNavigate={onNavigate} />
      </div>

      {/* Logout */}
      <div className="relative z-10 mt-4 pt-4">
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
          <LogOut className="size-4 shrink-0" />
          {t("patient.nav.logout")}
        </Link>
      </div>
    </div>
  );
}

export function PatientNavbar({
  patient,
  searchValue,
  onSearchChange,
  onSearchSubmit,
  searchPlaceholder = "Search...",
  searchIcon,
  children,
  showSearch = true,
}: {
  patient: { name: string; email: string };
  searchValue?: string;
  onSearchChange?: (v: string) => void;
  onSearchSubmit?: (e: React.FormEvent) => void;
  searchPlaceholder?: string;
  searchIcon?: React.ReactNode;
  children?: React.ReactNode;
  showSearch?: boolean;
}) {
  const { t } = useI18n();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header
      className={`relative z-[1000] grid h-16 shrink-0 items-center gap-2 border-b border-slate-200/80 bg-[#050f0e]/90 px-3 backdrop-blur-[12px] sm:px-4 ${showSearch ? "grid-cols-[auto_minmax(0,1fr)_auto]" : "grid-cols-[auto_1fr_auto]"
        }`}
    >
      {/* Left: Logo */}
      <Link
        href="/patient/dashboard"
        className="group inline-flex h-10 shrink-0 items-center justify-center transition-transform hover:scale-[1.02]"
      >
        <div className="flex size-8 items-center justify-center overflow-hidden transition-transform group-hover:scale-105">
          <img
            src="/logo-locatomed.png"
            alt="LocatMed"
            className="h-10 w-auto object-contain"
          />
        </div>
      </Link>

      {/* Center: Search */}
      {showSearch ? (
        <form onSubmit={onSearchSubmit} className="relative flex min-w-0 flex-col">
          <div className="flex h-10 w-full items-center gap-2 rounded-2xl border border-teal-300/70 bg-[#050f0e] px-3 shadow-[0_1px_0_rgba(15,23,42,0.03),0_8px_20px_rgba(15,23,42,0.06)] transition-all focus-within:border-teal-500 focus-within:ring-2 focus-within:ring-teal-100">
            {searchIcon ?? <Search className="size-4 shrink-0 text-slate-400" />}
            <input
              type="text"
              value={searchValue ?? ""}
              onChange={(e) => onSearchChange?.(e.target.value)}
              placeholder={searchPlaceholder}
              className="h-full flex-1 bg-transparent text-sm text-white placeholder:text-slate-400 focus:outline-none"
            />
            {searchValue && (
              <button
                type="button"
                onClick={() => onSearchChange?.("")}
                className="rounded-md p-0.5 text-slate-400 transition-colors hover:text-teal-100/70"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>
          {children}
        </form>
      ) : (
        <div className="min-w-0" />
      )}

      {/* Right: Hamburger */}
      <div className="flex shrink-0 items-center justify-end">
        <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
          <SheetTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                className="size-10 rounded-xl border border-slate-200 bg-[#050f0e] shadow-sm hover:bg-slate-50"
              />
            }
          >
            <Menu className="size-4" />
            <span className="sr-only">{t("patient.discover.menu")}</span>
          </SheetTrigger>
          <SheetContent
            side="left"
            className="w-72 border-r-0 px-5 py-6"
            style={{
              background:
                "linear-gradient(160deg, rgba(13,148,136,0.15) 0%, rgba(6,182,212,0.08) 100%)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              borderRight: "1px solid rgba(20,184,166,0.15)",
            }}
          >
            <SheetHeader>
              <SheetTitle className="sr-only">{t("patient.nav.navigation")}</SheetTitle>
              <SheetDescription className="sr-only">{t("patient.nav.webAria")}</SheetDescription>
            </SheetHeader>
            <SidebarDrawerContent patient={patient} onNavigate={() => setMenuOpen(false)} />
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
