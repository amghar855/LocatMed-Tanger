import { requireRole } from "@/lib/auth/guards";
import {
  getIncomingBroadcastRequests,
  getPharmacyStats,
  getLowStockItems,
} from "@/lib/actions/pharmacy-stock-actions";
import { getReservations } from "@/lib/actions/reservation-actions";
import PharmacyNav from "@/components/locatomed/pharmacy-nav";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  AlertTriangle,
  ArrowUpRight,
  BellRing,
  CalendarCheck,
  ClipboardList,
  Clock3,
  MapPin,
  Package,
  Pill,
  Settings,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default async function PharmacyDashboard() {
  const session = await requireRole("pharmacist");
  const [stats, lowStockItems, pendingReservations, incomingBroadcastRequests] = await Promise.all([
    getPharmacyStats(),
    getLowStockItems(5),
    getReservations("pending"),
    getIncomingBroadcastRequests(6),
  ]);
  const todayLabel = new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  }).format(new Date());
  const pharmacyLabel = stats.pharmacy
    ? `${stats.pharmacy.name} • ${stats.pharmacy.city}`
    : "Pharmacie non configurée";

  return (
    <>
      <PharmacyNav userName={session.user.name ?? ""} active="dashboard" />
      <div className="min-h-screen md:pl-72">
        <div className="mx-auto w-full max-w-6xl space-y-6 p-4 sm:p-6">
          <section className="rounded-2xl border border-cyan-200/70 bg-gradient-to-br from-cyan-50 via-background to-teal-50 p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="bg-cyan-600 text-white hover:bg-cyan-600">
                    Tableau de bord pharmacie
                  </Badge>
                  {stats.pharmacy?.isOnDuty && (
                    <Badge className="border-amber-500/40 bg-amber-500/20 text-amber-500 hover:bg-amber-500/20">
                      DE GARDE
                    </Badge>
                  )}
                </div>
                <div>
                  <h1 className="text-3xl font-bold tracking-tight">Bonjour, {session.user.name}</h1>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Pilotez vos stocks et réservations patients depuis un espace unifié.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-200 bg-white px-2.5 py-1">
                    <Clock3 className="h-3.5 w-3.5 text-cyan-700" />
                    {todayLabel}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-200 bg-white px-2.5 py-1">
                    <MapPin className="h-3.5 w-3.5 text-cyan-700" />
                    {pharmacyLabel}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Link
                  href="/pharmacy/stock"
                  className={cn(
                    buttonVariants({ variant: "default" }),
                    "gap-2 bg-cyan-600 text-white hover:bg-cyan-700"
                  )}
                >
                  <Package className="h-4 w-4" />
                  Gérer le stock
                </Link>
                <Link
                  href="/pharmacy/reservations"
                  className={cn(
                    buttonVariants({ variant: "outline" }),
                    "gap-2 border-cyan-200 bg-white/80"
                  )}
                >
                  <ClipboardList className="h-4 w-4" />
                  Réservations
                </Link>
              </div>
            </div>
          </section>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Card className="border-cyan-100">
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm">Médicaments en stock</CardTitle>
                <Pill className="h-4 w-4 text-cyan-700" />
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-semibold leading-none">{stats.totalMedicines}</p>
                <p className="mt-2 text-xs text-muted-foreground">Références disponibles actuellement</p>
              </CardContent>
            </Card>

            <Card className="border-cyan-100">
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm">Stock faible</CardTitle>
                <AlertTriangle className="h-4 w-4 text-cyan-700" />
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-semibold leading-none">{stats.lowStock}</p>
                <p className="mt-2 text-xs text-muted-foreground">Sous le seuil minimum</p>
              </CardContent>
            </Card>

            <Card className="border-cyan-100">
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm">Ruptures de stock</CardTitle>
                <XCircle className="h-4 w-4 text-cyan-700" />
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-semibold leading-none">{stats.outOfStock}</p>
                <p className="mt-2 text-xs text-muted-foreground">Articles momentanément indisponibles</p>
              </CardContent>
            </Card>

            <Card className="border-cyan-100">
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm">Réservations en attente</CardTitle>
                <CalendarCheck className="h-4 w-4 text-cyan-700" />
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-semibold leading-none">{stats.pendingReservations}</p>
                <p className="mt-2 text-xs text-muted-foreground">Demandes patients à traiter</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-7">
            <Card className="lg:col-span-4">
              <CardHeader>
                <CardTitle>Actions rapides</CardTitle>
                <CardDescription>
                  Gérez vos opérations principales en un clic.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-2">
                <QuickAction
                  href="/pharmacy/stock"
                  title="Mettre à jour le stock"
                  description="Ajustez les quantités et ajoutez de nouveaux médicaments."
                  icon={Package}
                />
                <QuickAction
                  href="/pharmacy/reservations"
                  title="Traiter les réservations"
                  description="Confirmez ou annulez les demandes de vos patients."
                  icon={ClipboardList}
                />
                <QuickAction
                  href="/pharmacy/settings"
                  title="Paramétrer la pharmacie"
                  description="Mettez à jour vos informations et statut de garde."
                  icon={Settings}
                />
              </CardContent>
            </Card>

            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle>Réservations récentes</CardTitle>
                <CardDescription>Les dernières demandes en attente</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {pendingReservations.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Aucune réservation en attente.</p>
                ) : (
                  pendingReservations.slice(0, 5).map((res) => (
                    <div
                      key={res.id}
                      className="flex items-center justify-between gap-2 rounded-xl border border-border/70 bg-muted/20 px-3 py-2.5"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{res.citizenName}</p>
                        <p className="truncate text-xs text-muted-foreground">{res.medicineName}</p>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {res.createdAt ? new Date(res.createdAt).toLocaleDateString("fr-FR") : ""}
                      </span>
                    </div>
                  ))
                )}

                {pendingReservations.length > 0 && (
                  <Link
                    href="/pharmacy/reservations"
                    className={cn(
                      buttonVariants({ variant: "ghost", size: "sm" }),
                      "mt-1 gap-1 text-cyan-700 hover:text-cyan-800"
                    )}
                  >
                    Voir toutes les réservations
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  Alertes de stock faible
                </CardTitle>
              </CardHeader>
              <CardContent>
                {lowStockItems.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Aucune alerte pour le moment.</p>
                ) : (
                  <ul className="divide-y">
                    {lowStockItems.map((item) => (
                      <li key={item.stockId} className="flex items-center justify-between py-2.5">
                        <p className="text-sm font-medium">{item.medicineName}</p>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            {item.quantity} restant{item.quantity !== 1 ? "s" : ""}
                          </span>
                          <Badge
                            className={
                              item.status === "out_of_stock"
                                ? "border-red-500/40 bg-red-500/20 text-red-500"
                                : "border-amber-500/40 bg-amber-500/20 text-amber-500"
                            }
                          >
                            {item.status === "out_of_stock" ? "Rupture" : "Faible"}
                          </Badge>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <BellRing className="h-4 w-4 text-cyan-700" />
                  Demandes patients reçues (broadcast)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {incomingBroadcastRequests.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Aucune demande patient en attente pour le moment.
                  </p>
                ) : (
                  <ul className="divide-y">
                    {incomingBroadcastRequests.map((request) => (
                      <li key={request.id} className="flex items-center justify-between gap-3 py-2.5">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{request.medicineName}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            {request.phoneNumber ?? request.email ?? "Contact non renseigné"}
                          </p>
                        </div>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {request.createdAt
                            ? new Date(request.createdAt).toLocaleDateString("fr-FR")
                            : ""}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
                <p className="mt-3 text-xs text-muted-foreground">
                  Ces demandes sont automatiquement notifiées quand vous remettez le médicament en stock.
                </p>
              </CardContent>
            </Card>
          </div>
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
      className="group rounded-xl border border-cyan-100 bg-cyan-50/60 p-3 transition-colors hover:bg-cyan-100/70"
    >
      <div className="mb-2 inline-flex rounded-lg bg-white p-2 text-cyan-700 ring-1 ring-cyan-200">
        <Icon className="h-4 w-4" />
      </div>
      <p className="text-sm font-medium text-foreground">{title}</p>
      <p className="mt-1 text-xs text-muted-foreground">{description}</p>
    </Link>
  );
}
