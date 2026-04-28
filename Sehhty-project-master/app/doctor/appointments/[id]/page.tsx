import { requireRole } from "@/lib/auth/guards";
import DoctorNav from "@/components/locatomed/doctor-nav";
import { getAppointmentById } from "@/lib/actions/doctor-actions";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Calendar,
  Clock,
  User,
  Mail,
  ArrowLeft,
  FileText,
  Stethoscope,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const STATUS_COLORS: Record<string, string> = {
  scheduled: "bg-teal-500 hover:bg-teal-500",
  completed: "bg-green-500 hover:bg-green-500",
  cancelled: "bg-red-500 hover:bg-red-500",
};

const STATUS_LABELS: Record<string, string> = {
  scheduled: "Prévu",
  completed: "Terminé",
  cancelled: "Annulé",
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AppointmentDetailPage({ params }: PageProps) {
  const session = await requireRole("doctor");
  const { id } = await params;
  const appointment = await getAppointmentById(id);

  const date = new Date(appointment.datetime);
  const dateStr = date.toLocaleDateString("fr-FR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const timeStr = date.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <>
      <DoctorNav userName={session.user.name ?? ""} active="appointments" />

      <div className="min-h-screen md:pl-72">
        <div className="mx-auto w-full max-w-6xl space-y-6 p-4 sm:p-6">
          {/* Back */}
          <Link
            href="/doctor/appointments"
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Retour
          </Link>

          {/* Title + status */}
          <section className="rounded-2xl border border-teal-200/70 bg-gradient-to-br from-teal-50 via-background to-cyan-50 p-6">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">
                  Rendez-vous avec {appointment.patient.fullName}
                </h1>
                <p className="mt-1 text-sm text-muted-foreground capitalize">{dateStr}</p>
              </div>
              <Badge
                className={
                  STATUS_COLORS[appointment.status] ??
                  "bg-gray-500 hover:bg-gray-500"
                }
              >
                {STATUS_LABELS[appointment.status] ?? appointment.status}
              </Badge>
            </div>
          </section>

          {/* Cards */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Détails du rendez-vous</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="capitalize">{dateStr}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{timeStr}</span>
                </div>
                {appointment.reason && (
                  <div className="text-muted-foreground">
                    <span className="font-medium text-foreground">Motif : </span>
                    {appointment.reason}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Informations patient</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>{appointment.patient.fullName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{appointment.patient.email}</span>
                </div>
                <Link
                  href={`/doctor/patients/${appointment.patient.id}`}
                  className={cn(
                    buttonVariants({ variant: "outline", size: "sm" })
                  )}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Voir dossier médical
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* Actions */}
          {appointment.status === "scheduled" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Actions</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-3">
                <Link
                  href={`/doctor/consultations/new?patientId=${appointment.patient.id}&appointmentId=${appointment.id}`}
                  className={cn(
                    buttonVariants({ variant: "default" }),
                    "bg-teal-600 text-white hover:bg-teal-700"
                  )}
                >
                  <Stethoscope className="h-4 w-4 mr-2" />
                  Commencer la consultation
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
