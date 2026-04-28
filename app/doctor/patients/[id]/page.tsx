import { requireRole } from "@/lib/auth/guards";
import DoctorNav from "@/components/locatomed/doctor-nav";
import {
  getPatientById,
  getPatientMedicalRecords,
} from "@/lib/actions/doctor-actions";
import { MedicalRecordTimeline } from "@/components/locatomed/medical-record-timeline";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { User, Mail, ArrowLeft, Plus } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function PatientFilePage({ params }: PageProps) {
  const session = await requireRole("doctor");
  const { id } = await params;

  const [patient, records] = await Promise.all([
    getPatientById(id),
    getPatientMedicalRecords(id),
  ]);

  return (
    <>
      <DoctorNav userName={session.user.name ?? ""} active="patients" />

      <div className="min-h-screen md:pl-72">
        <div className="mx-auto w-full max-w-6xl space-y-6 p-4 sm:p-6">
          {/* Back */}
          <Link
            href="/doctor/patients"
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Retour à la recherche
          </Link>

          {/* Header */}
          <section className="rounded-2xl border border-teal-200/70 bg-gradient-to-br from-teal-50 via-background to-cyan-50 p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Dossier médical</h1>
                <p className="mt-1 text-sm text-muted-foreground">{patient.fullName}</p>
              </div>
              <Link
                href={`/doctor/consultations/new?patientId=${patient.id}`}
                className={cn(
                  buttonVariants({ variant: "default" }),
                  "bg-teal-600 text-white hover:bg-teal-700"
                )}
              >
                <Plus className="h-4 w-4 mr-2" />
                Nouvelle consultation
              </Link>
            </div>
          </section>

          {/* Patient info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Informations patient</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span>
                  <span className="text-muted-foreground">Nom complet : </span>
                  {patient.fullName}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>
                  <span className="text-muted-foreground">Email : </span>
                  {patient.email}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Medical history */}
          <div>
            <h2 className="mb-3 text-lg font-semibold">Historique médical</h2>
            <MedicalRecordTimeline records={records} />
          </div>
        </div>
      </div>
    </>
  );
}
