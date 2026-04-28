import { Quote } from "lucide-react";

const TESTIMONIALS = [
  {
    name: "Fatima Bensalem",
    role: "Patiente, Tanger",
    initials: "FB",
    quote:
      "Grâce à LOCATOMED, je ne rate plus jamais mon médicament du matin. L'application me rappelle tout et j'ai mes rendez-vous en un clic. C'est vraiment pratique !",
    color: "from-teal-400 to-teal-600",
  },
  {
    name: "Karim Alaoui",
    role: "Patient, Tanger",
    initials: "KA",
    quote:
      "J'ai trouvé mon médicament en stock dans une pharmacie à 5 minutes de chez moi. Avant je cherchais partout. Maintenant c'est simple et rapide.",
    color: "from-teal-400 to-teal-600",
  },
  {
    name: "Yasmine Berrada",
    role: "Patiente, Tanger",
    initials: "YB",
    quote:
      "Mon dossier médical est toujours à jour. Quand je vois un nouveau médecin, je lui montre directement depuis l'application. C'est très professionnel.",
    color: "from-teal-400 to-teal-600",
  },
];

export function Testimonials() {
  return (
    <section className="py-24 bg-gray-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 bg-rose-50 border border-rose-200 rounded-full px-4 py-1.5">
            <span className="text-sm font-medium text-rose-700">Témoignages</span>
          </div>
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 tracking-tight">
            Ils font confiance à{" "}
            <span className="bg-gradient-to-r from-teal-500 to-teal-500 bg-clip-text text-transparent">
              LOCATOMED
            </span>
          </h2>
        </div>

        {/* Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {TESTIMONIALS.map(({ name, role, initials, quote, color }) => (
            <div
              key={name}
              className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col gap-5"
            >
              {/* Quote icon */}
              <div className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center">
                <Quote className="w-4 h-4 text-gray-300" />
              </div>

              {/* Quote text */}
              <p className="text-sm text-gray-600 leading-relaxed flex-1 italic">
                &ldquo;{quote}&rdquo;
              </p>

              {/* Author */}
              <div className="flex items-center gap-3 pt-2 border-t border-gray-50">
                <div
                  className={`w-10 h-10 rounded-full bg-gradient-to-br ${color} flex items-center justify-center text-white text-sm font-bold flex-shrink-0`}
                >
                  {initials}
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">{name}</p>
                  <p className="text-xs text-gray-400">{role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
