import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Stethoscope, ShoppingBag, Building2, ArrowRight, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Footer } from "@/components/locatomed/landing/footer";
import { cn } from "@/lib/utils";

const ROLES = [
  {
    icon: Stethoscope,
    title: "Médecin",
    description:
      "Accédez aux dossiers de vos patients, gérez vos rendez-vous et ajoutez des notes de consultation depuis votre tableau de bord.",
    features: ["Dossiers patients", "Agenda des consultations", "Notes médicales", "Historique complet"],
    loginHref: "/doctor/login",
    loginLabel: "Se connecter",
    gradientBar: "from-teal-500 to-teal-600",
    btnGradient: "bg-gradient-to-r from-teal-500 to-teal-600 text-white border-0",
    lightBg: "bg-teal-50",
    lightBorder: "border-teal-100",
    iconColor: "text-teal-500",
    iconBg: "bg-teal-100",
    badgeColor: "bg-teal-50 border-teal-200 text-teal-700",
    badge: "Pour les cliniciens",
    note: "Compte créé par votre administrateur hospitalier.",
  },
  {
    icon: ShoppingBag,
    title: "Pharmacien",
    description:
      "Gérez votre stock de médicaments, mettez à jour les disponibilités et consultez les alertes de rupture en temps réel.",
    features: ["Gestion de stock", "Disponibilité en ligne", "Alertes de rupture", "Mise à jour des prix"],
    loginHref: "/pharmacy/login",
    loginLabel: "Se connecter",
    gradientBar: "from-teal-500 to-teal-600",
    btnGradient: "bg-gradient-to-r from-teal-500 to-teal-600 text-white border-0",
    lightBg: "bg-teal-50",
    lightBorder: "border-teal-100",
    iconColor: "text-teal-500",
    iconBg: "bg-teal-100",
    badgeColor: "bg-teal-50 border-teal-200 text-teal-700",
    badge: "Pour les officines",
    note: null,
  },
  {
    icon: Building2,
    title: "Administrateur hospitalier",
    description:
      "Supervisez les équipes médicales, créez les comptes médecins et gérez l'organisation de votre établissement.",
    features: ["Gestion des équipes", "Création de comptes médecins", "Tableau de bord établissement", "Reporting"],
    loginHref: "/hospital-admin/login",
    loginLabel: "Se connecter",
    gradientBar: "from-teal-500 to-teal-600",
    btnGradient: "bg-gradient-to-r from-teal-500 to-teal-600 text-white border-0",
    lightBg: "bg-teal-50",
    lightBorder: "border-teal-100",
    iconColor: "text-teal-500",
    iconBg: "bg-teal-100",
    badgeColor: "bg-teal-50 border-teal-200 text-teal-700",
    badge: "Pour les établissements",
    note: null,
  },
];

export default function BusinessPage() {
  return (
    <>
      {/* Minimal navbar */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-teal-500 to-teal-500 flex items-center justify-center">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <span className="font-bold text-xl text-gray-900">LOCATOMED</span>
          </Link>
          <Link
            href="/"
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "flex items-center gap-1.5 text-gray-600"
            )}
          >
            <ArrowLeft className="w-4 h-4" />
            Retour
          </Link>
        </div>
      </header>

      <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-gray-50">
        {/* Hero */}
        <section className="relative pt-20 pb-16 overflow-hidden">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-teal-100/50 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-teal-100/40 rounded-full blur-3xl" />

          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
            <div className="inline-flex items-center gap-2 bg-slate-900 rounded-full px-4 py-1.5">
              <span className="text-sm font-medium text-white">Plateforme professionnelle</span>
            </div>
            <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 tracking-tight">
              Pour les{" "}
              <span className="bg-gradient-to-r from-teal-500 to-teal-500 bg-clip-text text-transparent">
                professionnels
              </span>{" "}
              de santé
            </h1>
            <p className="text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed">
              LOCATOMED propose des outils dédiés à chaque acteur de la santé —
              médecins, pharmaciens et administrateurs hospitaliers.
            </p>
          </div>
        </section>

        {/* Role cards */}
        <section className="pb-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-3 gap-8">
              {ROLES.map(
                ({
                  icon: Icon,
                  title,
                  description,
                  features,
                  loginHref,
                  loginLabel,
                  gradientBar,
                  btnGradient,
                  lightBg,
                  lightBorder,
                  iconColor,
                  iconBg,
                  badgeColor,
                  badge,
                  note,
                }) => (
                  <div
                    key={title}
                    className="bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col"
                  >
                    {/* Card top gradient bar */}
                    <div className={`h-1.5 bg-gradient-to-r ${gradientBar}`} />

                    <div className="p-8 flex flex-col gap-6 flex-1">
                      {/* Badge */}
                      <div
                        className={`inline-flex items-center self-start border rounded-full px-3 py-1 text-xs font-semibold ${badgeColor}`}
                      >
                        {badge}
                      </div>

                      {/* Icon + title */}
                      <div className="space-y-3">
                        <div className={`w-14 h-14 rounded-2xl ${iconBg} flex items-center justify-center`}>
                          <Icon className={`w-7 h-7 ${iconColor}`} />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
                        <p className="text-gray-500 leading-relaxed text-sm">{description}</p>
                      </div>

                      {/* Features */}
                      <div className={`rounded-2xl ${lightBg} border ${lightBorder} p-4 space-y-2.5`}>
                        {features.map((f) => (
                          <div key={f} className="flex items-center gap-2.5">
                            <CheckCircle2 className={`w-4 h-4 flex-shrink-0 ${iconColor}`} />
                            <span className="text-sm font-medium text-gray-700">{f}</span>
                          </div>
                        ))}
                      </div>

                      {/* Note */}
                      {note && (
                        <p className="text-xs text-gray-400 italic">{note}</p>
                      )}

                      {/* CTA */}
                      <div className="mt-auto">
                        <Link
                          href={loginHref}
                          className={cn(
                            buttonVariants({ size: "lg" }),
                            btnGradient,
                            "w-full justify-center h-11 font-semibold inline-flex items-center"
                          )}
                        >
                          {loginLabel}
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        </section>

        {/* Patient reminder */}
        <section className="pb-24">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-gradient-to-br from-teal-50 to-teal-50 border border-teal-100 rounded-3xl p-8 text-center space-y-4">
              <p className="text-gray-600">
                Vous êtes un patient ? Cette page est réservée aux professionnels.
              </p>
              <Link
                href="/"
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "border-teal-200 text-teal-700 hover:bg-teal-50 inline-flex items-center"
                )}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour à l&apos;accueil patient
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
