import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { ArrowRight, Calendar, Pill, FileText, Clock, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

function AppMockup() {
  return (
    <div className="relative w-full max-w-sm mx-auto">
      {/* Glow effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-teal-400/20 to-teal-400/20 rounded-3xl blur-3xl scale-110" />

      {/* Phone frame */}
      <div className="relative bg-white rounded-3xl shadow-2xl shadow-teal-200/50 border border-gray-100 p-5 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between pb-1">
          <div>
            <p className="text-xs text-gray-400 font-medium">Bonjour,</p>
            <p className="text-sm font-bold text-gray-800">Fatima B.</p>
          </div>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-teal-400 flex items-center justify-center text-white text-xs font-bold">
            FB
          </div>
        </div>

        {/* Next appointment card */}
        <div className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-2xl p-3.5 border border-teal-100">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-500 flex items-center justify-center flex-shrink-0">
              <Calendar className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-semibold text-teal-600 uppercase tracking-wide">Prochain rendez-vous</p>
              <p className="text-sm font-bold text-gray-800 truncate mt-0.5">Dr. Benjelloun</p>
              <p className="text-xs text-gray-500">Demain — 10h30 · Hôpital Mohammed V</p>
            </div>
            <div className="w-2 h-2 rounded-full bg-teal-400 flex-shrink-0 mt-1" />
          </div>
        </div>

        {/* Medication reminder */}
        <div className="bg-gradient-to-br from-teal-50 to-teal-50 rounded-2xl p-3.5 border border-teal-100">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-500 flex items-center justify-center flex-shrink-0">
              <Pill className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-semibold text-teal-600 uppercase tracking-wide">Rappel médicament</p>
              <p className="text-sm font-bold text-gray-800 mt-0.5">Paracétamol 1000mg</p>
              <div className="flex items-center gap-1 mt-0.5">
                <Clock className="w-3 h-3 text-gray-400" />
                <p className="text-xs text-gray-500">Dans 2 heures</p>
              </div>
            </div>
            <CheckCircle2 className="w-5 h-5 text-teal-400 flex-shrink-0 mt-0.5" />
          </div>
        </div>

        {/* Medical summary */}
        <div className="bg-gradient-to-br from-teal-50 to-teal-50 rounded-2xl p-3.5 border border-teal-100">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-500 flex items-center justify-center flex-shrink-0">
              <FileText className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-semibold text-teal-600 uppercase tracking-wide">Dossier médical</p>
              <p className="text-sm font-bold text-gray-800 mt-0.5">Résumé mis à jour</p>
              <p className="text-xs text-gray-500">Consultation · 15 Avr 2026</p>
            </div>
          </div>
        </div>

        {/* Bottom status bar */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-teal-400" />
            <span className="text-[10px] text-gray-400 font-medium">Données sécurisées</span>
          </div>
          <span className="text-[10px] text-gray-300">locatomed.ma</span>
        </div>
      </div>

      {/* Floating badge */}
      <div className="absolute -top-3 -right-3 bg-white rounded-2xl shadow-lg shadow-teal-100 border border-gray-100 px-3 py-2 flex items-center gap-2">
        <div className="w-6 h-6 rounded-full bg-teal-100 flex items-center justify-center">
          <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
        </div>
        <span className="text-xs font-semibold text-gray-700">Tout en un</span>
      </div>
    </div>
  );
}

export function HeroSection() {
  return (
    <section
      id="hero"
      className="relative min-h-[84vh] flex items-start pt-10 overflow-hidden bg-[#050f0e]"
    >
      {/* Aurora blobs (pure CSS, mix-blend-screen) */}
      <div
        aria-hidden
        className="absolute top-[-10%] left-[-5%] w-[40rem] h-[40rem] rounded-full blur-3xl opacity-60 mix-blend-screen pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at 30% 30%, #14b8a6 0%, rgba(20,184,166,0) 70%)",
          animation: "blob 18s ease-in-out infinite",
        }}
      />
      <div
        aria-hidden
        className="absolute bottom-[-15%] right-[-10%] w-[50rem] h-[50rem] rounded-full blur-3xl opacity-50 mix-blend-screen pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at 60% 50%, #0d9488 0%, rgba(13,148,136,0) 70%)",
          animation: "blob 22s ease-in-out infinite reverse",
        }}
      />
      <div
        aria-hidden
        className="absolute top-[30%] left-[40%] w-[28rem] h-[28rem] rounded-full blur-3xl opacity-40 mix-blend-screen pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, #06b6d4 0%, rgba(6,182,212,0) 70%)",
          animation: "blob 26s ease-in-out infinite",
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-16">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left: Text */}
          <div className="space-y-8">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-teal-500/10 border border-teal-400/30 rounded-full px-4 py-1.5 backdrop-blur-sm">
              <div className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
              <span className="text-sm font-medium text-teal-200">
                Plateforme de santé numérique — Tanger
              </span>
            </div>

            {/* Headline */}
            <div className="space-y-4">
              <h1 className="text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight text-white leading-[1.05]">
                One connected{" "}
                <span className="bg-gradient-to-r from-teal-300 to-cyan-300 bg-clip-text text-transparent">
                  healthcare
                </span>{" "}
                journey.
              </h1>
              <p className="text-xl text-teal-100/70 leading-relaxed max-w-lg">
                Gérez vos médicaments, rendez-vous et dossiers médicaux en un
                seul endroit — simplement, rapidement, en toute sécurité.
              </p>
            </div>

            {/* CTA buttons */}
            <div className="flex flex-wrap gap-4">
              <Link
                href="/patient/signup"
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "bg-teal-600 hover:bg-teal-700 text-white shadow-lg shadow-teal-900/40 h-12 px-6 text-base border-0"
                )}
              >
                Commencer gratuitement
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
              <a
                href="#how-it-works"
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  "h-12 px-6 text-base border-teal-400/30 bg-transparent text-teal-100 hover:bg-teal-500/10"
                )}
              >
                En savoir plus
              </a>
            </div>

            {/* Social proof */}
            <div className="flex items-center gap-6 pt-2">
              <div className="flex -space-x-2">
                {["FB", "KA", "YB", "RM"].map((init) => (
                  <div
                    key={init}
                    className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-cyan-400 border-2 border-[#050f0e] flex items-center justify-center text-white text-[10px] font-bold"
                  >
                    {init}
                  </div>
                ))}
              </div>
              <div>
                <p className="text-sm font-semibold text-white">+2 000 patients</p>
                <p className="text-xs text-teal-100/60">nous font confiance à Tanger</p>
              </div>
            </div>
          </div>

          {/* Right: App mockup */}
          <div className="flex justify-center lg:justify-end">
            <AppMockup />
          </div>
        </div>
      </div>
    </section>
  );
}
