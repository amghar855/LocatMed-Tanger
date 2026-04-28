import { requireRole } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getHospitalByIdCompat } from "@/lib/actions/hospital-admin-actions";
import HospitalAdminNav from "@/components/locatomed/hospital-admin-nav";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Phone, ShieldCheck, User } from "lucide-react";

export default async function SettingsPage() {
  const session = await requireRole("hospital_admin");

  const admin = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
    columns: {
      fullName: true,
      email: true,
      hospitalId: true,
    },
  });

  const hospital = admin?.hospitalId ? await getHospitalByIdCompat(admin.hospitalId) : null;

  return (
    <>
      <HospitalAdminNav userName={session.user.name ?? ""} active="settings" />
      <div className="min-h-screen md:pl-72">
      <div className="mx-auto w-full max-w-6xl space-y-5 p-4 sm:p-6">
        <div className="rounded-2xl border border-teal-200/70 bg-gradient-to-br from-teal-50 via-background to-teal-50 p-5">
          <h1 className="text-2xl font-bold tracking-tight">Paramètres</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gérez votre profil et votre hôpital
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-teal-700" />
                <CardTitle className="text-base">Informations de l&apos;Hôpital</CardTitle>
              </div>
              <CardDescription>Données de votre établissement</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {hospital ? (
                <>
                  <Field label="Nom" value={hospital.name} />
                  <Field label="Ville" value={hospital.city} />
                  <Field label="Adresse" value={hospital.address} />
                  {hospital.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                      <Field label="Téléphone" value={hospital.phone} />
                    </div>
                  )}
                  <Field
                    label="Type"
                    value={
                      hospital.type === "public"
                        ? "Public"
                        : hospital.type === "private"
                          ? "Privé"
                          : "CHU"
                    }
                  />
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Aucune information d&apos;hôpital disponible.
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-teal-700" />
                <CardTitle className="text-base">Votre Profil</CardTitle>
              </div>
              <CardDescription>Vos informations personnelles</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <Field label="Nom" value={admin?.fullName ?? "—"} />
              <Field label="Email" value={admin?.email ?? "—"} />
              <div>
                <p className="text-xs text-muted-foreground">Rôle</p>
                <Badge className="mt-1 bg-teal-600 text-white hover:bg-teal-600">
                  Administrateur d&apos;hôpital
                </Badge>
              </div>
              <div className="rounded-xl border border-teal-100 bg-teal-50/70 p-3">
                <p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                  <ShieldCheck className="h-3.5 w-3.5 text-teal-700" />
                  Sécurité
                </p>
                <p className="mt-1 text-sm font-medium">
                  Accès limité aux données de votre hôpital.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      </div>
    </>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-medium">{value}</p>
    </div>
  );
}
