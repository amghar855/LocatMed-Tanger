import { Shield, Zap, Users, HeartHandshake } from "lucide-react";

const TRUST_ITEMS = [
  { icon: Shield, label: "Données sécurisées", color: "text-teal-500", bg: "bg-teal-50" },
  { icon: Zap, label: "Accès rapide", color: "text-amber-500", bg: "bg-amber-50" },
  { icon: HeartHandshake, label: "Conçu pour les patients", color: "text-rose-500", bg: "bg-rose-50" },
  { icon: Users, label: "Simple à utiliser", color: "text-teal-500", bg: "bg-teal-50" },
];

export function TrustStrip() {
  return (
    <section className="bg-white border-y border-gray-100 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {TRUST_ITEMS.map(({ icon: Icon, label, color, bg }) => (
            <div key={label} className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
              <span className="text-sm font-semibold text-gray-700">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
