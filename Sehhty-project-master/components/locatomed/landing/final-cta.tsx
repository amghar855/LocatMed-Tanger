import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export function FinalCta() {
  return (
    <section className="py-24 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Glow */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-teal-200/40 to-teal-200/40 rounded-3xl blur-3xl" />

          <div className="relative bg-gradient-to-br from-teal-50 via-white to-teal-50 border border-gray-100 rounded-3xl p-12 lg:p-20 space-y-8 shadow-sm">
            <div className="inline-flex items-center gap-2 bg-white border border-teal-200 rounded-full px-4 py-1.5 shadow-sm">
              <Sparkles className="w-4 h-4 text-teal-500" />
              <span className="text-sm font-medium text-teal-700">
                Rejoignez LOCATOMED aujourd&apos;hui
              </span>
            </div>

            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 tracking-tight">
              Prenez le contrôle de{" "}
              <span className="bg-gradient-to-r from-teal-500 to-teal-500 bg-clip-text text-transparent">
                votre santé
              </span>{" "}
              dès aujourd&apos;hui
            </h2>

            <p className="text-lg text-gray-500 max-w-xl mx-auto">
              Créez votre compte gratuitement et commencez à gérer vos
              médicaments, rendez-vous et dossiers médicaux en quelques minutes.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/patient/signup"
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "bg-gradient-to-r from-teal-500 to-teal-500 hover:from-teal-600 hover:to-teal-600 text-white shadow-lg shadow-teal-200 h-12 px-8 text-base font-semibold border-0 inline-flex items-center"
                )}
              >
                Créer un compte gratuit
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
              <Link
                href="/patient/login"
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  "h-12 px-8 text-base border-gray-200 text-gray-700 hover:bg-gray-50"
                )}
              >
                Se connecter
              </Link>
            </div>

            <p className="text-sm text-gray-400">
              Gratuit pour les patients · Aucune carte bancaire · Données sécurisées
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
