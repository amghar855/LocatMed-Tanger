import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function DoctorSignupPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-muted/40 px-4">
      <div className="w-full max-w-sm space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-bold">Compte Médecin</CardTitle>
            <CardDescription>Inscription non disponible en libre-service</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Les comptes médecins sont créés par l&apos;administrateur de votre hôpital.
              Contactez-le pour obtenir vos identifiants de connexion.
            </p>
            <Link
              href="/doctor/login"
              className="inline-flex w-full items-center justify-center rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80"
            >
              J&apos;ai déjà un compte — Se connecter
            </Link>
          </CardContent>
        </Card>
        <p className="text-center text-sm text-muted-foreground">
          <Link href="/" className="underline underline-offset-4">
            ← Retour à l&apos;accueil
          </Link>
        </p>
      </div>
    </main>
  );
}
