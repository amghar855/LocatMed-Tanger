import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function DoctorSignupPage() {
  return (
    <div
      className="relative min-h-screen flex items-center justify-center overflow-hidden px-4 py-10"
      style={{
        background:
          "linear-gradient(135deg, #f0fdfa 0%, #ffffff 45%, #ecfeff 100%)",
      }}
    >
      {/* Aurora blobs */}
      <div
        aria-hidden
        className="absolute top-[-15%] left-[-10%] w-[35rem] h-[35rem] rounded-full blur-3xl pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(20,184,166,0.18) 0%, rgba(20,184,166,0) 70%)",
          animation: "blob 18s ease-in-out infinite",
        }}
      />
      <div
        aria-hidden
        className="absolute top-[20%] right-[-10%] w-[40rem] h-[40rem] rounded-full blur-3xl pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(34,211,238,0.14) 0%, rgba(34,211,238,0) 70%)",
          animation: "blob 22s ease-in-out infinite reverse",
        }}
      />
      <div
        aria-hidden
        className="absolute bottom-[-15%] left-[30%] w-[38rem] h-[38rem] rounded-full blur-3xl pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(13,148,136,0.16) 0%, rgba(13,148,136,0) 70%)",
          animation: "blob 26s ease-in-out infinite",
        }}
      />

      {/* Back link */}
      <Link
        href="/"
        className="absolute top-6 left-6 z-20 inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Retour
      </Link>

      {/* Glass card */}
      <div
        className="relative w-full max-w-md"
        style={{
          backgroundColor: "rgba(255, 255, 255, 0.70)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          border: "1px solid rgba(255, 255, 255, 0.80)",
          borderRadius: "24px",
          padding: "40px",
          boxShadow:
            "0 25px 50px rgba(15, 23, 42, 0.08), 0 0 0 1px rgba(15, 23, 42, 0.04)",
        }}
      >
        {/* Logo + tagline */}
        <div className="flex flex-col items-center mb-6">
          <img src="/logo-locatomed.png" alt="LocatMed" className="h-10 w-auto mx-auto" />
          <p className="mt-2 text-xs italic text-teal-600 text-center">
            La santé de vos proches n&apos;attend pas
          </p>
        </div>

        {/* Title */}
        <div className="text-center mb-6">
          <h1 className="font-serif text-2xl text-slate-900">Compte Médecin</h1>
          <p className="mt-1 text-sm text-slate-500">
            Inscription non disponible en libre-service
          </p>
        </div>

        <p className="text-sm text-slate-700 leading-relaxed mb-6">
          Les comptes médecins sont créés par l&apos;administrateur de votre
          hôpital. Contactez-le pour obtenir vos identifiants de connexion.
        </p>

        <Link
          href="/doctor/login"
          className="block w-full text-center text-white rounded-xl py-3 transition-all duration-200 hover:opacity-90 hover:-translate-y-px"
          style={{
            background: "linear-gradient(135deg, #0d9488, #06b6d4)",
            fontWeight: 600,
            boxShadow: "0 8px 20px rgba(13, 148, 136, 0.25)",
          }}
        >
          J&apos;ai déjà un compte — Se connecter
        </Link>

        <p className="mt-6 text-center text-sm text-slate-500">
          <Link href="/" className="hover:text-[#14b8a6] transition-colors">
            ← Retour à l&apos;accueil
          </Link>
        </p>
      </div>
    </div>
  );
}
