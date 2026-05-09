import { Shield, Zap, Users, HeartHandshake } from "lucide-react";
import { BorderGlow } from "@/components/ui/border-glow";

const TRUST_ITEMS = [
  { icon: Shield, label: "Données sécurisées", color: "text-teal-400" },
  { icon: Zap, label: "Accès rapide", color: "text-teal-400" },
  { icon: HeartHandshake, label: "Conçu pour les patients", color: "text-teal-400" },
  { icon: Users, label: "Simple à utiliser", color: "text-teal-400" },
];

export function TrustStrip() {
  return (
    <section className="bg-[#021f1d] py-16 border-y border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {TRUST_ITEMS.map(({ icon: Icon, label, color }) => (
            <BorderGlow
              key={label}
              backgroundColor="#021f1d"
              colors={['#2dd4bf', '#38bdf8', '#22d3ee']}
              glowIntensity={0.8}
              fillOpacity={0.2}
              borderRadius={16}
              animated={true}
            >
              <div className="flex items-center gap-4 p-5 h-full">
                <div className="w-12 h-12 rounded-xl bg-teal-500/10 flex items-center justify-center flex-shrink-0 border border-teal-500/10">
                  <Icon className={`w-6 h-6 ${color}`} />
                </div>
                <span className="text-sm font-bold text-white tracking-tight leading-tight">{label}</span>
              </div>
            </BorderGlow>
          ))}
        </div>
      </div>
    </section>
  );
}
