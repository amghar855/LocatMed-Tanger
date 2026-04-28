import { UserPlus, ClipboardList, LayoutDashboard } from "lucide-react";

const STEPS = [
  {
    step: "01",
    icon: UserPlus,
    title: "Créez votre compte",
    description:
      "Inscrivez-vous en quelques secondes avec votre email. Aucune carte bancaire requise.",
    color: "from-teal-500 to-teal-600",
    lightBg: "bg-teal-50",
    lightBorder: "border-teal-100",
    lightText: "text-teal-600",
  },
  {
    step: "02",
    icon: ClipboardList,
    title: "Ajoutez vos données de santé",
    description:
      "Renseignez vos médicaments, vos traitements en cours et vos informations médicales essentielles.",
    color: "from-teal-500 to-teal-600",
    lightBg: "bg-teal-50",
    lightBorder: "border-teal-100",
    lightText: "text-teal-600",
  },
  {
    step: "03",
    icon: LayoutDashboard,
    title: "Gérez tout facilement",
    description:
      "Prenez rendez-vous, accédez à votre dossier médical et ne manquez plus aucun médicament.",
    color: "from-teal-500 to-teal-600",
    lightBg: "bg-teal-50",
    lightBorder: "border-teal-100",
    lightText: "text-teal-600",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 bg-teal-50 border border-teal-200 rounded-full px-4 py-1.5">
            <span className="text-sm font-medium text-teal-700">Comment ça marche</span>
          </div>
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 tracking-tight">
            Démarrez en{" "}
            <span className="bg-gradient-to-r from-teal-500 to-teal-500 bg-clip-text text-transparent">
              3 étapes simples
            </span>
          </h2>
          <p className="text-lg text-gray-500 max-w-xl mx-auto">
            LOCATOMED a été conçu pour être aussi simple que possible, afin que
            vous puissiez vous concentrer sur l&apos;essentiel : votre santé.
          </p>
        </div>

        {/* Steps */}
        <div className="grid lg:grid-cols-3 gap-8 relative">
          {/* Connector line (desktop) */}
          <div className="hidden lg:block absolute top-14 left-1/3 right-1/3 h-0.5 bg-gradient-to-r from-teal-200 via-teal-200 to-teal-200" />

          {STEPS.map(({ step, icon: Icon, title, description, color, lightBg, lightBorder, lightText }) => (
            <div key={step} className="relative flex flex-col items-center text-center gap-5">
              {/* Step number + icon */}
              <div className="relative">
                <div
                  className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center shadow-lg`}
                >
                  <Icon className="w-7 h-7 text-white" />
                </div>
                <div
                  className={`absolute -top-2 -right-2 w-6 h-6 rounded-full ${lightBg} border ${lightBorder} flex items-center justify-center`}
                >
                  <span className={`text-[10px] font-bold ${lightText}`}>{step}</span>
                </div>
              </div>

              {/* Content */}
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-gray-900">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed max-w-xs mx-auto">
                  {description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
