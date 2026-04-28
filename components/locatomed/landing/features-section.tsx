import { Pill, Calendar, FileText, Bell, Activity, Smartphone } from "lucide-react";

const FEATURES = [
  {
    icon: Pill,
    title: "Recherche de médicaments",
    description:
      "Trouvez instantanément vos médicaments et localisez les pharmacies qui les ont en stock près de chez vous.",
    color: "text-teal-500",
    bg: "bg-teal-50",
    border: "border-teal-100",
  },
  {
    icon: Calendar,
    title: "Prise de rendez-vous",
    description:
      "Réservez vos consultations en ligne avec les médecins des hôpitaux partenaires en quelques clics.",
    color: "text-teal-500",
    bg: "bg-teal-50",
    border: "border-teal-100",
  },
  {
    icon: FileText,
    title: "Dossier médical",
    description:
      "Accédez à tout votre historique médical, vos ordonnances et vos résultats d'analyses en un seul endroit.",
    color: "text-teal-500",
    bg: "bg-teal-50",
    border: "border-teal-100",
  },
  {
    icon: Bell,
    title: "Rappels intelligents",
    description:
      "Ne manquez plus vos prises de médicaments grâce aux rappels personnalisés et aux notifications.",
    color: "text-amber-500",
    bg: "bg-amber-50",
    border: "border-amber-100",
  },
  {
    icon: Activity,
    title: "Suivi de santé",
    description:
      "Visualisez l'évolution de votre santé, suivez vos traitements et partagez vos données avec votre médecin.",
    color: "text-rose-500",
    bg: "bg-rose-50",
    border: "border-rose-100",
  },
  {
    icon: Smartphone,
    title: "Accès mobile",
    description:
      "Application progressive installable sur votre téléphone — votre santé accessible même hors connexion.",
    color: "text-teal-500",
    bg: "bg-teal-50",
    border: "border-teal-100",
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="py-24 bg-gray-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 bg-teal-50 border border-teal-200 rounded-full px-4 py-1.5">
            <span className="text-sm font-medium text-teal-700">Fonctionnalités</span>
          </div>
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 tracking-tight">
            Tout ce dont vous avez besoin,{" "}
            <span className="bg-gradient-to-r from-teal-500 to-teal-500 bg-clip-text text-transparent">
              au même endroit
            </span>
          </h2>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            LocatMed centralise tous vos besoins de santé en une seule plateforme
            intuitive et sécurisée.
          </p>
        </div>

        {/* Cards grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map(({ icon: Icon, title, description, color, bg, border }) => (
            <div
              key={title}
              className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group"
            >
              <div
                className={`w-12 h-12 rounded-2xl ${bg} border ${border} flex items-center justify-center mb-5`}
              >
                <Icon className={`w-6 h-6 ${color}`} />
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-2">{title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
