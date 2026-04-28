import { notFound } from "next/navigation";
import Link from "next/link";
import { requireRole } from "@/lib/auth/guards";
import { getDoctorById } from "@/lib/actions/hospital-admin-actions";
import HospitalAdminNav from "@/components/locatomed/hospital-admin-nav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { User, Mail, Calendar, ArrowLeft, Stethoscope, Phone, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function DoctorDetailPage({ params }: Props) {
  const session = await requireRole("hospital_admin");
  const { id } = await params;

  let data: Awaited<ReturnType<typeof getDoctorById>>;
  try {
    data = await getDoctorById(id);
  } catch {
    notFound();
  }

  const { doctor, stats } = data;

  return (
    <>
      <HospitalAdminNav userName={session.user.name ?? ""} active="doctors" />
      <div className="min-h-screen md:pl-72">
      <div className="mx-auto w-full max-w-6xl space-y-5 p-4 sm:p-6">
        <div className="rounded-2xl border border-teal-200/70 bg-gradient-to-br from-teal-50 via-background to-teal-50 p-5">
          <div className="space-y-1.5">
            <Link
              href="/hospital-admin/doctors"
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "-ml-2 gap-1.5 text-teal-800 hover:bg-teal-100",
              )}
            >
              <ArrowLeft className="h-4 w-4" />
              Retour à la liste
            </Link>
            <h1 className="text-2xl font-bold tracking-tight">{doctor.fullName}</h1>
            <p className="text-sm text-muted-foreground">Fiche complète du médecin</p>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-3">
          <Card className="xl:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Informations personnelles</CardTitle>
              <CardDescription>Données d&apos;identification du professionnel</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Nom Complet</p>
                  <p className="text-sm font-medium">{doctor.fullName}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="text-sm font-medium">{doctor.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Téléphone</p>
                  <p className="text-sm font-medium">{doctor.phone ?? "Non renseigné"}</p>
                </div>
              </div>

              {doctor.specialty && (
                <div className="flex items-center gap-3">
                  <Stethoscope className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Spécialité</p>
                    <p className="text-sm font-medium">{doctor.specialty}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Date d&apos;ajout</p>
                  <p className="text-sm font-medium">
                    {doctor.createdAt
                      ? new Date(doctor.createdAt).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })
                      : "—"}
                  </p>
                </div>
              </div>

              <div className="sm:col-span-2">
                <p className="text-xs text-muted-foreground">Statut</p>
                <Badge variant="default" className="mt-1 bg-teal-600 text-white hover:bg-teal-600">
                  Actif
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Statistiques</CardTitle>
              <CardDescription>Indicateurs liés au médecin</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-xl border border-teal-100 bg-teal-50/70 p-3">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-teal-700" />
                  <p className="text-xs text-muted-foreground">Total rendez-vous</p>
                </div>
                <p className="mt-2 text-3xl font-semibold leading-none">{stats.totalAppointments}</p>
              </div>

              <Link
                href="/hospital-admin/doctors"
                className={cn(buttonVariants({ variant: "outline" }), "w-full")}
              >
                Retour à la liste
              </Link>
              <Link
                href="/hospital-admin/doctors/new"
                className={cn(buttonVariants({ variant: "default" }), "w-full bg-teal-600 text-white hover:bg-teal-700")}
              >
                Ajouter un médecin
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
      </div>
    </>
  );
}
