import { requireRole } from "@/lib/auth/guards";
import DoctorNav from "@/components/locatomed/doctor-nav";
import { AppointmentCard } from "@/components/locatomed/appointment-card";
import {
  getDoctorStats,
  getUpcomingAppointments,
} from "@/lib/actions/doctor-actions";
import {
  CardDescription,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { buttonVariants } from "@/components/ui/button";
import {
  Activity,
  ArrowUpRight,
  CalendarDays,
  Clock3,
  FileText,
  Plus,
  Search,
  Stethoscope,
  Users,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default async function DoctorDashboard() {
  const session = await requireRole("doctor");
  const [stats, upcoming] = await Promise.all([
    getDoctorStats(),
    getUpcomingAppointments(5),
  ]);
  const todayLabel = new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  }).format(new Date());

  return (
    <>
      <DoctorNav userName={session.user.name ?? ""} active="dashboard" />
      <div className="min-h-screen md:pl-72">
        <div className="mx-auto w-full max-w-6xl space-y-6 p-4 sm:p-6">
        <section className="rounded-2xl border border-teal-200/70 bg-gradient-to-br from-teal-50 via-background to-cyan-50 p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-3">
              <Badge className="bg-teal-600 text-white hover:bg-teal-600">
                Tableau de bord médecin
              </Badge>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">
                  Bonjour, {session.user.name}
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Gérez vos consultations et suivez vos patients depuis un seul espace.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-teal-200 bg-white px-2.5 py-1">
                  <Clock3 className="h-3.5 w-3.5 text-teal-700" />
                  {todayLabel}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-teal-200 bg-white px-2.5 py-1">
                  <Stethoscope className="h-3.5 w-3.5 text-teal-700" />
                  Espace clinique
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                href="/doctor/appointments"
                className={cn(
                  buttonVariants({ variant: "default" }),
                  "gap-2 bg-teal-600 text-white hover:bg-teal-700"
                )}
              >
                <CalendarDays className="h-4 w-4" />
                Mes rendez-vous
              </Link>
              <Link
                href="/doctor/consultations/new"
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "gap-2 border-teal-200 bg-white/80"
                )}
              >
                <Plus className="h-4 w-4" />
                Nouvelle consultation
              </Link>
            </div>
          </div>
        </section>

        <Tabs defaultValue="overview" className="space-y-4">
          <div className="w-full overflow-x-auto">
            <TabsList variant="line">
              <TabsTrigger value="overview">Vue d&apos;ensemble</TabsTrigger>
              <TabsTrigger value="planning">Planning</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <Card className="border-teal-100">
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-sm">Rendez-vous du jour</CardTitle>
                  <CalendarDays className="h-4 w-4 text-teal-700" />
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-semibold leading-none">{stats.todayAppointments}</p>
                  <p className="mt-2 text-xs text-muted-foreground">Consultations prévues aujourd&apos;hui</p>
                </CardContent>
              </Card>

              <Card className="border-teal-100">
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-sm">Patients de la semaine</CardTitle>
                  <Users className="h-4 w-4 text-teal-700" />
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-semibold leading-none">{stats.weekPatients}</p>
                  <p className="mt-2 text-xs text-muted-foreground">Activité sur les 7 derniers jours</p>
                </CardContent>
              </Card>

              <Card className="border-teal-100">
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-sm">Dossiers à compléter</CardTitle>
                  <FileText className="h-4 w-4 text-teal-700" />
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-semibold leading-none">{stats.pendingRecords}</p>
                  <p className="mt-2 text-xs text-muted-foreground">Consultations sans note médicale</p>
                </CardContent>
              </Card>

              <Card className="border-teal-100">
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-sm">À venir</CardTitle>
                  <Activity className="h-4 w-4 text-teal-700" />
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-semibold leading-none">{upcoming.length}</p>
                  <p className="mt-2 text-xs text-muted-foreground">Rendez-vous planifiés prochainement</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-7">
              <Card className="lg:col-span-4">
                <CardHeader>
                  <CardTitle>Actions rapides</CardTitle>
                  <CardDescription>
                    Accès direct aux opérations les plus fréquentes de votre journée.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3 sm:grid-cols-2">
                  <QuickAction
                    href="/doctor/appointments"
                    title="Gérer mes rendez-vous"
                    description="Consultez votre planning et les détails de chaque consultation."
                    icon={CalendarDays}
                  />
                  <QuickAction
                    href="/doctor/patients"
                    title="Rechercher un patient"
                    description="Retrouvez rapidement un dossier patient par nom ou e-mail."
                    icon={Search}
                  />
                  <QuickAction
                    href="/doctor/consultations/new"
                    title="Créer une consultation"
                    description="Rédigez une nouvelle note clinique et ajoutez des prescriptions."
                    icon={Plus}
                  />
                </CardContent>
              </Card>

              <Card className="lg:col-span-3">
                <CardHeader>
                  <CardTitle>Prochains rendez-vous</CardTitle>
                  <CardDescription>Vos cinq prochains créneaux confirmés</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {upcoming.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Aucun rendez-vous à venir pour le moment.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {upcoming.map((apt) => (
                        <AppointmentCard key={apt.id} appointment={apt} />
                      ))}
                    </div>
                  )}

                  {upcoming.length > 0 && (
                    <Link
                      href="/doctor/appointments"
                      className={cn(
                        buttonVariants({ variant: "ghost", size: "sm" }),
                        "mt-1 gap-1 text-teal-700 hover:text-teal-800"
                      )}
                    >
                      Voir tout le planning
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </Link>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="planning" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Planification médicale</CardTitle>
                <CardDescription>
                  Organisez vos consultations et accédez à vos outils quotidiens.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-3">
                <Link
                  href="/doctor/appointments"
                  className={cn(buttonVariants({ variant: "default" }), "gap-2 bg-teal-600 text-white hover:bg-teal-700")}
                >
                  <CalendarDays className="h-4 w-4" />
                  Ouvrir le planning
                </Link>
                <Link
                  href="/doctor/patients"
                  className={cn(buttonVariants({ variant: "outline" }), "gap-2")}
                >
                  <Search className="h-4 w-4" />
                  Voir les patients
                </Link>
                <Link
                  href="/doctor/consultations/new"
                  className={cn(buttonVariants({ variant: "outline" }), "gap-2")}
                >
                  <Plus className="h-4 w-4" />
                  Nouvelle consultation
                </Link>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        </div>
      </div>
    </>
  );
}

type QuickActionProps = {
  href: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
};

function QuickAction({ href, title, description, icon: Icon }: QuickActionProps) {
  return (
    <Link
      href={href}
      className="group rounded-xl border border-teal-100 bg-teal-50/60 p-3 transition-colors hover:bg-teal-100/70"
    >
      <div className="mb-2 inline-flex rounded-lg bg-white p-2 text-teal-700 ring-1 ring-teal-200">
        <Icon className="h-4 w-4" />
      </div>
      <p className="text-sm font-medium text-foreground">{title}</p>
      <p className="mt-1 text-xs text-muted-foreground">{description}</p>
    </Link>
  );
}
