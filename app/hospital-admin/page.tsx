import { requireRole } from "@/lib/auth/guards";
import { getHospitalStats, getRecentDoctors } from "@/lib/actions/hospital-admin-actions";
import HospitalAdminNav from "@/components/locatomed/hospital-admin-nav";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { buttonVariants } from "@/components/ui/button";
import {
  Activity,
  ArrowUpRight,
  Building2,
  CalendarDays,
  Clock3,
  MapPin,
  Settings,
  Stethoscope,
  UserPlus,
  Users,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default async function HospitalAdminDashboard() {
  const session = await requireRole("hospital_admin");
  const [stats, recentDoctors] = await Promise.all([
    getHospitalStats(),
    getRecentDoctors(5),
  ]);

  const { hospital, totalDoctors, todayAppointments } = stats;
  const hospitalLabel = hospital ? `${hospital.name} • ${hospital.city}` : "Hôpital non configuré";
  const todayLabel = new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  }).format(new Date());

  return (
    <>
      <HospitalAdminNav userName={session.user.name ?? ""} active="dashboard" />
      <div className="min-h-screen md:pl-72">
      <div className="mx-auto w-full max-w-6xl space-y-6 p-4 sm:p-6">
        <section className="rounded-2xl border border-teal-200/70 bg-gradient-to-br from-teal-50 via-background to-teal-50 p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-3">
              <Badge className="bg-teal-600 text-white hover:bg-teal-600">
                Tableau de bord hôpital
              </Badge>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Bonjour, {session.user.name}</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Pilotez votre activité médicale depuis une vue centralisée.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-teal-200 bg-white px-2.5 py-1">
                  <Clock3 className="h-3.5 w-3.5 text-teal-700" />
                  {todayLabel}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-teal-200 bg-white px-2.5 py-1">
                  <MapPin className="h-3.5 w-3.5 text-teal-700" />
                  {hospitalLabel}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                href="/hospital-admin/doctors/new"
                className={cn(buttonVariants({ variant: "default" }), "gap-2 bg-teal-600 text-white hover:bg-teal-700")}
              >
                <UserPlus className="h-4 w-4" />
                Ajouter un médecin
              </Link>
              <Link
                href="/hospital-admin/settings"
                className={cn(buttonVariants({ variant: "outline" }), "gap-2 border-teal-200 bg-white/80")}
              >
                <Settings className="h-4 w-4" />
                Paramètres
              </Link>
            </div>
          </div>
        </section>

        <Tabs defaultValue="overview" className="space-y-4">
          <div className="w-full overflow-x-auto">
            <TabsList variant="line">
              <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
              <TabsTrigger value="doctors">Équipe médicale</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <Card className="border-teal-100">
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-sm">Médecins actifs</CardTitle>
                  <Stethoscope className="h-4 w-4 text-teal-700" />
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-semibold leading-none">{totalDoctors}</p>
                  <p className="mt-2 text-xs text-muted-foreground">Dans votre établissement</p>
                </CardContent>
              </Card>

              <Card className="border-teal-100">
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-sm">Rendez-vous du jour</CardTitle>
                  <CalendarDays className="h-4 w-4 text-teal-700" />
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-semibold leading-none">{todayAppointments}</p>
                  <p className="mt-2 text-xs text-muted-foreground">Planifiés pour aujourd&apos;hui</p>
                </CardContent>
              </Card>

              <Card className="border-teal-100 sm:col-span-2 xl:col-span-1">
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-sm">Hôpital associé</CardTitle>
                  <Building2 className="h-4 w-4 text-teal-700" />
                </CardHeader>
                <CardContent>
                  <p className="text-base font-semibold leading-tight">{hospital?.name ?? "—"}</p>
                  <p className="mt-2 text-xs text-muted-foreground">{hospital?.address ?? "Adresse non renseignée"}</p>
                </CardContent>
              </Card>

              <Card className="border-teal-100">
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-sm">Nouveaux profils</CardTitle>
                  <Activity className="h-4 w-4 text-teal-700" />
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-semibold leading-none">{recentDoctors.length}</p>
                  <p className="mt-2 text-xs text-muted-foreground">Ajouts récents dans l&apos;équipe</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-7">
              <Card className="lg:col-span-4">
                <CardHeader>
                  <CardTitle>Actions rapides</CardTitle>
                  <CardDescription>Accès direct aux opérations les plus fréquentes</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3 sm:grid-cols-2">
                  <QuickAction
                    href="/hospital-admin/doctors/new"
                    title="Créer un compte médecin"
                    description="Invitez un nouveau médecin à rejoindre votre hôpital."
                    icon={UserPlus}
                  />
                  <QuickAction
                    href="/hospital-admin/doctors"
                    title="Gérer les médecins"
                    description="Visualisez, filtrez et mettez à jour votre équipe médicale."
                    icon={Users}
                  />
                  <QuickAction
                    href="/hospital-admin/settings"
                    title="Mettre à jour l'hôpital"
                    description="Vérifiez les informations publiques de votre établissement."
                    icon={Building2}
                  />
                </CardContent>
              </Card>

              <Card className="lg:col-span-3">
                <CardHeader>
                  <CardTitle>Médecins récemment ajoutés</CardTitle>
                  <CardDescription>Derniers profils créés par votre administration</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {recentDoctors.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Aucun médecin enregistré pour le moment.
                    </p>
                  ) : (
                    recentDoctors.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between rounded-xl border border-border/70 bg-muted/20 px-3 py-2.5"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{doc.fullName}</p>
                          <p className="truncate text-xs text-muted-foreground">{doc.email}</p>
                        </div>
                        <Link
                          href={`/hospital-admin/doctors/${doc.id}`}
                          className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "gap-1 text-teal-700 hover:text-teal-800")}
                        >
                          Voir
                          <ArrowUpRight className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="doctors" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Gestion de l'équipe médicale</CardTitle>
                <CardDescription>
                  Consultez la liste complète des médecins et créez de nouveaux accès.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-3">
                <Link
                  href="/hospital-admin/doctors"
                  className={cn(buttonVariants({ variant: "outline" }), "gap-2")}
                >
                  <Users className="h-4 w-4" />
                  Voir tous les médecins
                </Link>
                <Link
                  href="/hospital-admin/doctors/new"
                  className={cn(buttonVariants({ variant: "default" }), "gap-2 bg-teal-600 text-white hover:bg-teal-700")}
                >
                  <UserPlus className="h-4 w-4" />
                  Ajouter un médecin
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
