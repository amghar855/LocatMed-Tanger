"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useI18n } from "@/components/locatomed/i18n-provider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { Button } from "@/components/ui/button";
import {
  Heart,
  Stethoscope,
  ShoppingBag,
  Building2,
  ArrowLeft,
  Lock,
  Mail,
  CheckCircle2,
} from "lucide-react";

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

const THEMES: Record<
  AuthVariant,
  {
    gradient: string;
    iconBg: string;
    Icon: React.ElementType;
    btnClass: string;
    accentText: string;
    bullets: string[];
    panelTaglineKey: string;
  }
> = {
  patient: {
    gradient: "from-teal-500 via-teal-500 to-teal-500",
    iconBg: "bg-teal-50",
    Icon: Heart,
    btnClass: "bg-gradient-to-r from-teal-500 to-teal-500 hover:from-teal-600 hover:to-teal-600 text-white border-0 shadow-md shadow-teal-200",
    accentText: "text-teal-600",
    bullets: [
      "auth.patientBullet1",
      "auth.patientBullet2",
      "auth.patientBullet3",
    ],
    panelTaglineKey: "auth.patientTagline",
  },
  doctor: {
    gradient: "from-teal-600 via-teal-600 to-cyan-600",
    iconBg: "bg-teal-50",
    Icon: Stethoscope,
    btnClass: "bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white border-0 shadow-md shadow-teal-200",
    accentText: "text-teal-600",
    bullets: [
      "auth.doctorBullet1",
      "auth.doctorBullet2",
      "auth.doctorBullet3",
    ],
    panelTaglineKey: "auth.doctorTagline",
  },
  pharmacy: {
    gradient: "from-teal-500 via-teal-500 to-teal-600",
    iconBg: "bg-teal-50",
    Icon: ShoppingBag,
    btnClass: "bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white border-0 shadow-md shadow-teal-200",
    accentText: "text-teal-600",
    bullets: [
      "auth.pharmacyBullet1",
      "auth.pharmacyBullet2",
      "auth.pharmacyBullet3",
    ],
    panelTaglineKey: "auth.pharmacyTagline",
  },
  "hospital-admin": {
    gradient: "from-teal-600 via-teal-600 to-teal-700",
    iconBg: "bg-teal-50",
    Icon: Building2,
    btnClass: "bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white border-0 shadow-md shadow-teal-200",
    accentText: "text-teal-600",
    bullets: [
      "auth.adminBullet1",
      "auth.adminBullet2",
      "auth.adminBullet3",
    ],
    panelTaglineKey: "auth.adminTagline",
  },
};

export default function LoginForm({
  title,
  description,
  action,
  redirectTo,
  signupHref,
  backHref = "/",
  variant = "patient",
}: Props) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const { t } = useI18n();
  const theme = THEMES[variant];
  const { Icon } = theme;

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
    <div className="min-h-screen flex">
      {/* Left panel — branding */}
      <div
        className={cn(
          "hidden lg:flex lg:w-5/12 xl:w-1/2 flex-col justify-between p-12 bg-gradient-to-br text-white relative overflow-hidden",
          theme.gradient
        )}
      >
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />

        {/* Top: Logo */}
        <div className="relative">
          <Link href="/" className="flex items-center gap-2.5 w-fit">
            <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center overflow-hidden">
              {/* TODO: replace with <img src="/logo-locatomed.png" /> */}
            <span style={{ fontFamily: "serif", fontWeight: "bold", color: "#14b8a6" }}>LOCATOMED</span>
            </div>
            <span className="font-bold text-2xl text-white">LOCATOMED</span>
          </Link>
        </div>

        {/* Middle: tagline + bullets */}
        <div className="relative space-y-8">
          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-white/60">
              {t("auth.digitalHealthPlatform", "Plateforme de sante numerique")}
            </p>
            <h2 className="text-3xl xl:text-4xl font-bold leading-tight">
              {t(theme.panelTaglineKey, "")}
            </h2>
          </div>

          <div className="space-y-3">
            {theme.bullets.map((b) => (
              <div key={b} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="text-sm text-white/90">{t(b, b)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom: city */}
        <div className="relative">
          <p className="text-xs text-white/50">{t("auth.tangierMorocco", "Tanger, Maroc")}</p>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex flex-col min-h-screen bg-white">
        {/* Top bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <Link
            href={backHref}
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "flex items-center gap-1.5 text-gray-500"
            )}
          >
            <ArrowLeft className="w-4 h-4" />
            {t("auth.back", "Retour")}
          </Link>
          <Link href="/" className="flex items-center gap-2 lg:hidden">
            {/* TODO: replace with <img src="/logo-locatomed.png" /> */}
            <span style={{ fontFamily: "serif", fontWeight: "bold", color: "#14b8a6" }}>LOCATOMED</span>
            <span className="font-bold text-gray-900">LOCATOMED</span>
          </Link>
          <div className="w-20" />
        </div>

        {/* Form area */}
        <div className="flex-1 flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-sm space-y-8">
            {/* Form header */}
            <div className="space-y-4">
              <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center", theme.iconBg)}>
                <Icon className={cn("w-6 h-6", theme.accentText)} />
              </div>
              <div className="space-y-1.5">
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{title}</h1>
                <p className="text-sm text-gray-500">{description}</p>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                  {t("auth.emailLabel", "Adresse email")}
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder={t("auth.emailPlaceholder", "vous@exemple.ma")}
                    required
                    autoComplete="email"
                    className="pl-9 h-11 border-gray-200 focus:border-teal-400 bg-gray-50/50"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                  {t("auth.passwordLabel", "Mot de passe")}
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    required
                    autoComplete="current-password"
                    className="pl-9 h-11 border-gray-200 focus:border-teal-400 bg-gray-50/50"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isPending}
                className={cn("w-full h-11 font-semibold text-sm", theme.btnClass)}
              >
                {isPending
                  ? t("auth.loginSubmitting", "Connexion en cours...")
                  : t("auth.loginSubmit", "Se connecter")}
              </Button>
            </form>

            {/* Footer links */}
            <div className="space-y-3">
              {signupHref && (
                <p className="text-center text-sm text-gray-500">
                  {t("auth.noAccount", "Pas encore de compte ?")}{" "}
                  <Link
                    href={signupHref}
                    className={cn("font-semibold underline-offset-4 hover:underline", theme.accentText)}
                  >
                    {t("auth.createAccount", "Creer un compte")}
                  </Link>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
