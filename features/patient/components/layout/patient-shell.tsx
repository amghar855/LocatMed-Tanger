"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";

import { PatientNavbar, SidebarDrawerContent } from "@/components/locatomed/patient-navbar";

type PatientInfo = {
  name: string;
  email: string;
};

type Props = {
  children: ReactNode;
  patient?: PatientInfo;
};

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join("");
}

export function PatientShell({ children, patient }: Props) {
  const patientInfo = patient ?? { name: "LocatMed", email: "" };

  return (
    <div className="patient-body min-h-screen bg-slate-50">
      <div className="sticky top-0 z-40 lg:hidden">
        <PatientNavbar patient={patientInfo} showSearch={false} />
      </div>

      <div className="flex">
        <aside
          className="fixed inset-y-0 left-0 z-30 hidden w-[280px] flex-col border-r border-slate-200/80 px-6 py-6 lg:flex"
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.7)",
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
          }}
        >
          <div className="mb-8 flex items-center gap-2.5 px-1">
            <img
              src="/logo-locatomed.png"
              alt="LocatMed"
              className="h-10 w-auto object-contain"
            />
          </div>

          <SidebarDrawerContent patient={patientInfo} />
        </aside>

        <main className="min-w-0 flex-1 lg:pl-[280px]">
          <div className="sticky top-0 z-40 hidden h-16 items-center justify-between border-b border-slate-200/80 bg-white/95 px-6 backdrop-blur-sm lg:grid lg:grid-cols-[1fr_auto] lg:gap-4">
            <div />

            {patient && (
              <Link
                href="/patient/profile"
                className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-teal-600 shadow-sm transition-colors hover:bg-teal-700"
              >
                <span className="font-heading text-sm font-bold text-white">
                  {getInitials(patient.name)}
                </span>
              </Link>
            )}
          </div>

          <div className="mx-auto max-w-5xl space-y-5 px-4 py-5 md:px-6 md:py-6 lg:px-8 lg:py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
