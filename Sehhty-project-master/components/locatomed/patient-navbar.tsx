"use client";

import Link from "next/link";
import Image from "next/image";
import { LogOut, Menu, Search, X } from "lucide-react";
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
    <div className="flex h-full flex-col">
      <Link
        href="/patient/profile"
        onClick={onNavigate}
        className="mb-8 flex items-center gap-3 rounded-2xl border border-transparent px-3 py-2.5 transition-colors duration-200 hover:border-teal-200 hover:bg-teal-50/50"
      >
        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-teal-600 shadow-sm">
          <span className="font-heading text-sm font-bold text-white">
            {getInitials(patient.name)}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-heading text-[15px] font-bold leading-tight text-slate-900">
            {patient.name}
          </p>
          <p className="truncate text-[10px] leading-tight text-slate-400">
            {patient.email}
          </p>
        </div>
      </Link>

      <div className="flex-1 overflow-y-auto">
        <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
          {t("patient.nav.navigation")}
        </p>
        <PatientNavLinks onNavigate={onNavigate} />
      </div>

      <div className="mt-4 border-t border-slate-100 pt-4">
        <Link
          href="/logout"
          className="group flex items-center gap-3 rounded-xl border border-transparent px-3 py-2.5 text-sm font-medium text-rose-600 transition-colors duration-200 hover:border-teal-200 hover:bg-teal-50/40 hover:text-rose-700"
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
      className={`relative z-[1000] grid h-16 shrink-0 items-center gap-2 border-b border-slate-200/80 bg-white/95 px-3 backdrop-blur-sm sm:px-4 ${
        showSearch ? "grid-cols-[auto_minmax(0,1fr)_auto]" : "grid-cols-[auto_1fr_auto]"
      }`}
    >
      {/* Left: Logo */}
      <Link
        href="/patient/dashboard"
        className="group inline-flex h-10 shrink-0 items-center justify-center transition-transform hover:scale-[1.02]"
      >
        <div className="flex size-8 items-center justify-center overflow-hidden transition-transform group-hover:scale-105">
          {/* TODO: replace with <img src="/logo-locatomed.png" /> */}
            <span style={{ fontFamily: "serif", fontWeight: "bold", color: "#14b8a6" }}>LOCATOMED</span>
        </div>
        <span className="sr-only">LOCATOMED</span>
      </Link>

      {/* Center: Search */}
      {showSearch ? (
        <form onSubmit={onSearchSubmit} className="relative flex min-w-0 flex-col">
          <div className="flex h-10 w-full items-center gap-2 rounded-2xl border border-teal-300/70 bg-white px-3 shadow-[0_1px_0_rgba(15,23,42,0.03),0_8px_20px_rgba(15,23,42,0.06)] transition-all focus-within:border-teal-500 focus-within:ring-2 focus-within:ring-teal-100">
            {searchIcon ?? <Search className="size-4 shrink-0 text-slate-400" />}
            <input
              type="text"
              value={searchValue ?? ""}
              onChange={(e) => onSearchChange?.(e.target.value)}
              placeholder={searchPlaceholder}
              className="h-full flex-1 bg-transparent text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none"
            />
            {searchValue && (
              <button
                type="button"
                onClick={() => onSearchChange?.("")}
                className="rounded-md p-0.5 text-slate-400 transition-colors hover:text-slate-600"
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
                className="size-10 rounded-xl border border-slate-200 bg-white shadow-sm hover:bg-slate-50"
              />
            }
          >
            <Menu className="size-4" />
            <span className="sr-only">{t("patient.discover.menu")}</span>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 px-5 py-6">
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
