import { Suspense } from "react";
import NewConsultationClient from "./new-consultation-client";
import { requireRole } from "@/lib/auth/guards";
import DoctorNav from "@/components/locatomed/doctor-nav";

export default async function NewConsultationPage() {
  const session = await requireRole("doctor");

  return (
    <Suspense
      fallback={
        <>
          <DoctorNav userName={session.user.name ?? "Médecin"} active="consultations" />
          <div className="min-h-screen md:pl-72">
            <div className="mx-auto w-full max-w-5xl p-4 sm:p-6 text-muted-foreground">
              Chargement...
            </div>
          </div>
        </>
      }
    >
      <NewConsultationClient userName={session.user.name ?? "Médecin"} />
    </Suspense>
  );
}
