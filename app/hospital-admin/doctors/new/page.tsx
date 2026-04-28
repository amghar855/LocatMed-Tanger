import { requireRole } from "@/lib/auth/guards";
import HospitalAdminNav from "@/components/locatomed/hospital-admin-nav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { ArrowLeft, KeyRound, ShieldCheck, Stethoscope } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import AddDoctorForm from "./add-doctor-form";

export default async function NewDoctorPage() {
  const session = await requireRole("hospital_admin");

  return (
    <>
      <HospitalAdminNav userName={session.user.name ?? ""} active="doctors" />
      <div className="min-h-screen md:pl-72">
      <div className="mx-auto w-full max-w-5xl space-y-5 p-4 sm:p-6">
        <div className="rounded-2xl border border-teal-200/70 bg-gradient-to-br from-teal-50 via-background to-teal-50 p-5">
          <Link
            href="/hospital-admin/doctors"
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "-ml-2 gap-1.5 text-teal-800 hover:bg-teal-100")}
          >
            <ArrowLeft className="h-4 w-4" />
            Retour à la liste
          </Link>
          <h1 className="mt-2 text-2xl font-bold tracking-tight">Ajouter un médecin</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Créez un compte médecin pour votre hôpital.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Informations du médecin</CardTitle>
              <CardDescription>
                Le médecin pourra se connecter immédiatement avec le mot de passe temporaire.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AddDoctorForm />
            </CardContent>
          </Card>

          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="text-base">Checklist de création</CardTitle>
              <CardDescription>Avant de valider, vérifiez les points ci-dessous</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <CheckLine icon={Stethoscope} text="Nom complet du médecin" />
              <CheckLine icon={KeyRound} text="Mot de passe temporaire sécurisé" />
              <CheckLine icon={ShieldCheck} text="Accès limité à votre hôpital" />
            </CardContent>
          </Card>
        </div>
      </div>
      </div>
    </>
  );
}

function CheckLine({
  icon: Icon,
  text,
}: {
  icon: React.ComponentType<{ className?: string }>;
  text: string;
}) {
  return (
    <div className="flex items-start gap-2 rounded-lg border border-teal-100 bg-teal-50/60 p-2.5">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-teal-700" />
      <p>{text}</p>
    </div>
  );
}
