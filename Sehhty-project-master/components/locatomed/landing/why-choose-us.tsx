import { Heart, Clock, Layers, Paintbrush, Lock } from "lucide-react";

const REASONS = [
  {
    icon: Heart,
    title: "Conçu pour les patients",
    description:
      "Chaque fonctionnalité a été pensée pour le patient — interface claire, parcours intuitif, sans jargon médical.",
    color: "text-rose-500",
    bg: "bg-rose-50",
  },
  {
    icon: Clock,
    title: "Gain de temps",
    description:
      "Plus besoin d'appeler pour un rendez-vous ou de chercher votre ordonnance. Tout est à portée de main.",
    color: "text-amber-500",
    bg: "bg-amber-50",
  },
  {
    icon: Layers,
    title: "Plateforme tout-en-un",
    description:
      "Médicaments, rendez-vous, dossier médical — une seule application pour tout gérer, sans jongler entre plusieurs outils.",
    color: "text-teal-500",
    bg: "bg-teal-50",
  },
  {
    icon: Paintbrush,
    title: "Interface claire et intuitive",
    description:
      "Un design épuré et moderne qui s'adapte à tous les profils, des plus jeunes aux moins technophiles.",
    color: "text-teal-500",
    bg: "bg-teal-50",
  },
  {
    icon: Lock,
    title: "Sécurisé et fiable",
    description:
      "Vos données médicales sont chiffrées et protégées. LOCATOMED ne vend jamais vos informations.",
    color: "text-teal-500",
    bg: "bg-teal-50",
  },
];

export function WhyChooseUs() {
  return (
    <section id="why-us" className="py-24 bg-gray-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-start">
          {/* Left: Sticky title */}
          <div className="lg:sticky lg:top-24 space-y-6">
            <div className="inline-flex items-center gap-2 bg-teal-50 border border-teal-200 rounded-full px-4 py-1.5">
              <span className="text-sm font-medium text-teal-700">Pourquoi LOCATOMED ?</span>
            </div>
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 tracking-tight leading-[1.1]">
              Une santé{" "}
              <span className="bg-gradient-to-r from-teal-500 to-teal-500 bg-clip-text text-transparent">
                connectée
              </span>
              , enfin accessible.
            </h2>
            <p className="text-lg text-gray-500 leading-relaxed">
              Nous avons construit LOCATOMED parce que gérer sa santé ne devrait
              pas être compliqué. Voici ce qui nous différencie.
            </p>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 pt-4">
              {[
                { value: "3 min", label: "pour créer votre compte" },
                { value: "100%", label: "données sécurisées" },
                { value: "24/7", label: "accès à votre dossier" },
                { value: "Gratuit", label: "pour les patients" },
              ].map(({ value, label }) => (
                <div key={label} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                  <p className="text-2xl font-bold text-gray-900">{value}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Reason cards */}
          <div className="space-y-4">
            {REASONS.map(({ icon: Icon, title, description, color, bg }) => (
              <div
                key={title}
                className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200 flex gap-4"
              >
                <div
                  className={`w-11 h-11 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}
                >
                  <Icon className={`w-5 h-5 ${color}`} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900 mb-1">{title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
