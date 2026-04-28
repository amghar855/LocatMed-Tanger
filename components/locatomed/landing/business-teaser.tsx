import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { ArrowRight, Building2, Stethoscope, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";

export function BusinessTeaser() {
  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-10 lg:p-16">
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl" />

          <div className="relative grid lg:grid-cols-2 gap-12 items-center">
            {/* Left */}
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5">
                <span className="text-sm font-medium text-white/80">
                  Pour les professionnels de santé
                </span>
              </div>
              <h2 className="text-3xl lg:text-4xl font-bold text-white tracking-tight">
                Vous êtes un professionnel de santé ?
              </h2>
              <p className="text-gray-400 leading-relaxed">
                LocatMed propose une plateforme dédiée aux médecins, pharmaciens
                et administrateurs hospitaliers. Gérez vos équipes, votre stock
                et vos patients depuis un tableau de bord centralisé.
              </p>
              <Link
                href="/business"
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "bg-white text-slate-900 hover:bg-gray-100 h-12 px-6 font-semibold border-0 inline-flex items-center"
                )}
              >
                Accéder à la plateforme Business
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>

            {/* Right: role cards */}
            <div className="grid gap-3">
              {[
                {
                  icon: Stethoscope,
                  label: "Médecin",
                  desc: "Dossiers patients, rendez-vous, notes de consultation",
                  color: "text-teal-400",
                  bg: "bg-teal-500/10",
                },
                {
                  icon: ShoppingBag,
                  label: "Pharmacien",
                  desc: "Gestion de stock, disponibilité, commandes",
                  color: "text-teal-400",
                  bg: "bg-teal-500/10",
                },
                {
                  icon: Building2,
                  label: "Administrateur hospitalier",
                  desc: "Équipes médicales, organisation, reporting",
                  color: "text-teal-400",
                  bg: "bg-teal-500/10",
                },
              ].map(({ icon: Icon, label, desc, color, bg }) => (
                <div
                  key={label}
                  className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-2xl p-4 hover:bg-white/10 transition-colors"
                >
                  <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`w-5 h-5 ${color}`} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{label}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
