"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft, Lock, Mail, Eye, EyeOff } from "lucide-react";
import { useI18n } from "@/components/locatomed/i18n-provider";

type AuthVariant = "patient" | "doctor" | "pharmacy" | "hospital-admin";

type Props = {
  title: string;
  description: string;
  action: (formData: FormData) => Promise<{ error?: string; success?: boolean; redirectTo?: string }>;
  redirectTo?: string;
  signupHref?: string;
  backHref?: string;
  variant?: AuthVariant;
};

const inputBase =
  "h-11 w-full rounded-xl bg-white/80 border border-slate-200 text-slate-900 text-sm placeholder:text-slate-400 outline-none transition-colors focus:border-[#14b8a6] focus:ring-2 focus:ring-[#14b8a6]/20 px-3 shadow-sm";

export default function LoginForm({
  title,
  description,
  action,
  redirectTo,
  signupHref,
  backHref = "/",
}: Props) {
  const [isPending, startTransition] = useTransition();
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const { t } = useI18n();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await action(formData);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success(t("auth.loginSuccess", "Connexion reussie"));
        if (result?.redirectTo) {
          router.push(result.redirectTo);
          router.refresh();
          return;
        }
        if (redirectTo) {
          router.push(redirectTo);
        } else {
          router.refresh();
        }
      }
    });
  }

  return (
    <div
      className="relative min-h-screen flex items-center justify-center overflow-hidden px-4 py-10"
      style={{
        background:
          "linear-gradient(135deg, #f0fdfa 0%, #ffffff 45%, #ecfeff 100%)",
      }}
    >
      {/* Aurora blobs (low opacity for light bg) */}
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

      {/* Back link (top-left of viewport) */}
      <Link
        href={backHref}
        className="absolute top-6 left-6 z-20 inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        {t("auth.back", "Retour")}
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
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <img src="/logo-locatomed.png" alt="LocatMed" className="h-16 w-auto mx-auto" />
        </div>

        {/* Title */}
        <div className="text-center mb-6">
          <h1 className="font-serif text-2xl text-slate-900">{title}</h1>
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="email" className="block text-sm font-medium text-slate-700">
              {t("auth.emailLabel", "Adresse email")}
            </label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                id="email"
                name="email"
                type="email"
                placeholder={t("auth.emailPlaceholder", "vous@exemple.ma")}
                required
                autoComplete="email"
                className={inputBase + " pl-9"}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="password" className="block text-sm font-medium text-slate-700">
              {t("auth.passwordLabel", "Mot de passe")}
            </label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                required
                autoComplete="current-password"
                className={inputBase + " pl-9 pr-10"}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full text-white rounded-xl py-3 transition-all duration-200 hover:opacity-90 hover:-translate-y-px disabled:opacity-60 disabled:translate-y-0 disabled:cursor-not-allowed"
            style={{
              background: "linear-gradient(135deg, #0d9488, #06b6d4)",
              fontWeight: 600,
              boxShadow: "0 8px 20px rgba(13, 148, 136, 0.25)",
            }}
          >
            {isPending
              ? t("auth.loginSubmitting", "Connexion en cours...")
              : t("auth.loginSubmit", "Se connecter")}
          </button>
        </form>

        {signupHref && (
          <p className="mt-6 text-center text-sm text-slate-500">
            {t("auth.noAccount", "Pas encore de compte ?")}{" "}
            <Link
              href={signupHref}
              className="font-medium text-slate-700 hover:text-[#14b8a6] transition-colors"
            >
              {t("auth.createAccount", "S'inscrire")}
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
