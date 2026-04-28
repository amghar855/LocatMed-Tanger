"use client";

import { useTransition } from "react";
import type { FormEvent, ReactNode } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import { useI18n } from "@/components/locatomed/i18n-provider";

import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  Heart,
  ShoppingBag,
  Building2,
  ArrowLeft,
  CheckCircle2,
  User,
  Mail,
  Phone,
  Lock,
} from "lucide-react";

type SignupVariant = "patient" | "pharmacy" | "hospital-admin";

type Props = {
  title: string;
  description: string;
  action: (formData: FormData) => Promise<{ error?: string; success?: boolean }>;
  variant: SignupVariant;
  showPhone?: boolean;
  loginHref: string;
  backHref?: string;
};

const THEMES: Record<
  SignupVariant,
  {
    gradient: string;
    Icon: React.ElementType;
    iconBg: string;
    iconColor: string;
    btnClass: string;
    accentText: string;
    sectionBg: string;
    sectionBorder: string;
    bullets: string[];
    panelTaglineKey: string;
  }
> = {
  patient: {
    gradient: "from-teal-500 via-teal-500 to-teal-500",
    Icon: Heart,
    iconBg: "bg-teal-50",
    iconColor: "text-teal-500",
    btnClass: "bg-gradient-to-r from-teal-500 to-teal-500 hover:from-teal-600 hover:to-teal-600 text-white border-0 shadow-md shadow-teal-200",
    accentText: "text-teal-600",
    sectionBg: "bg-teal-50/50",
    sectionBorder: "border-teal-100",
    bullets: [
      "auth.patientBullet1",
      "auth.patientBullet2",
      "auth.patientBullet3",
    ],
    panelTaglineKey: "auth.patientTagline",
  },
  pharmacy: {
    gradient: "from-teal-500 via-teal-500 to-teal-600",
    Icon: ShoppingBag,
    iconBg: "bg-teal-50",
    iconColor: "text-teal-500",
    btnClass: "bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white border-0 shadow-md shadow-teal-200",
    accentText: "text-teal-600",
    sectionBg: "bg-teal-50/50",
    sectionBorder: "border-teal-100",
    bullets: [
      "auth.pharmacyBullet1",
      "auth.pharmacyBullet2",
      "auth.pharmacyBullet3",
    ],
    panelTaglineKey: "auth.pharmacyTagline",
  },
  "hospital-admin": {
    gradient: "from-teal-600 via-teal-600 to-teal-700",
    Icon: Building2,
    iconBg: "bg-teal-50",
    iconColor: "text-teal-600",
    btnClass: "bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white border-0 shadow-md shadow-teal-200",
    accentText: "text-teal-600",
    sectionBg: "bg-teal-50/50",
    sectionBorder: "border-teal-100",
    bullets: [
      "auth.adminBullet1",
      "auth.adminBullet2",
      "auth.adminBullet3",
    ],
    panelTaglineKey: "auth.adminTagline",
  },
};

const textareaClassName =
  "min-h-24 w-full rounded-xl border border-gray-200 bg-gray-50/50 px-3 py-2.5 text-sm transition-colors outline-none placeholder:text-gray-400 focus-visible:border-teal-400 focus-visible:ring-2 focus-visible:ring-teal-100 disabled:pointer-events-none disabled:opacity-50";

function Section({
  title,
  description,
  children,
  sectionBg,
  sectionBorder,
}: {
  title: string;
  description: string;
  children: ReactNode;
  sectionBg: string;
  sectionBorder: string;
}) {
  return (
    <div className={cn("rounded-2xl border p-5 space-y-4", sectionBg, sectionBorder)}>
      <div className="space-y-0.5">
        <h2 className="text-sm font-bold text-gray-800">{title}</h2>
        <p className="text-xs text-gray-500">{description}</p>
      </div>
      {children}
    </div>
  );
}

function Field({
  htmlFor,
  label,
  hint,
  children,
}: {
  htmlFor: string;
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor} className="text-sm font-medium text-gray-700">
        {label}
      </Label>
      {children}
      {hint && <p className="text-xs text-gray-400">{hint}</p>}
    </div>
  );
}

export default function SignupForm({
  title,
  description,
  action,
  variant,
  showPhone = false,
  loginHref,
  backHref = "/",
}: Props) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const { t } = useI18n();
  const theme = THEMES[variant];
  const { Icon } = theme;
  const showPhoneField = variant === "patient" ? showPhone !== false : true;
  const isWideForm = variant === "pharmacy" || variant === "hospital-admin";

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const result = await action(formData);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success(
        variant === "patient"
          ? t("auth.successPatient", "Compte patient cree avec succes !")
          : variant === "pharmacy"
            ? t("auth.successPharmacy", "Pharmacie creee avec succes !")
            : t("auth.successHospitalAdmin", "Etablissement hospitalier cree avec succes !")
      );
      router.refresh();
    });
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel — branding */}
      <div
        className={cn(
          "hidden lg:flex lg:w-5/12 xl:w-[420px] flex-col justify-between p-12 bg-gradient-to-br text-white relative overflow-hidden flex-shrink-0",
          theme.gradient
        )}
      >
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />

        {/* Logo */}
        <div className="relative">
          <Link href="/" className="flex items-center gap-2.5 w-fit">
            <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center overflow-hidden">
              {/* TODO: replace with <img src="/logo-locatomed.png" /> */}
            <span style={{ fontFamily: "serif", fontWeight: "bold", color: "#14b8a6" }}>LOCATOMED</span>
            </div>
            <span className="font-bold text-2xl text-white">LOCATOMED</span>
          </Link>
        </div>

        {/* Tagline + bullets */}
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

        <div className="relative">
          <p className="text-xs text-white/50">{t("auth.tangierMorocco", "Tanger, Maroc")}</p>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex flex-col bg-white min-w-0">
        {/* Top bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
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

        {/* Scrollable form area */}
        <div className="flex-1 overflow-y-auto px-6 py-10">
          <div className={cn("mx-auto space-y-8", isWideForm ? "max-w-2xl" : "max-w-sm")}>
            {/* Header */}
            <div className="space-y-4">
              <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center", theme.iconBg)}>
                <Icon className={cn("w-6 h-6", theme.iconColor)} />
              </div>
              <div className="space-y-1.5">
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{title}</h1>
                <p className="text-sm text-gray-500">{description}</p>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Account info section */}
              <Section
                title={t("auth.accountInfoTitle", "Informations du compte")}
                description={t(
                  "auth.accountInfoDescription",
                  "Creez le profil qui se connectera a LOCATOMED."
                )}
                sectionBg={theme.sectionBg}
                sectionBorder={theme.sectionBorder}
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field htmlFor="fullName" label="Nom complet">
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        id="fullName"
                        name="fullName"
                        placeholder="Fatima Zahra Alami"
                        required
                        autoComplete="name"
                        className="pl-9 h-10 border-gray-200 bg-white/80"
                      />
                    </div>
                  </Field>
                  <Field htmlFor="email" label="Email">
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="vous@exemple.ma"
                        required
                        autoComplete="email"
                        className="pl-9 h-10 border-gray-200 bg-white/80"
                      />
                    </div>
                  </Field>
                </div>

                {showPhoneField && (
                  <Field htmlFor="phone" label="Téléphone" hint="Optionnel">
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        placeholder="+212 6XX XXX XXX"
                        autoComplete="tel"
                        className="pl-9 h-10 border-gray-200 bg-white/80"
                      />
                    </div>
                  </Field>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field htmlFor="password" label="Mot de passe">
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        id="password"
                        name="password"
                        type="password"
                        required
                        autoComplete="new-password"
                        className="pl-9 h-10 border-gray-200 bg-white/80"
                      />
                    </div>
                  </Field>
                  <Field htmlFor="confirmPassword" label="Confirmer le mot de passe">
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        required
                        autoComplete="new-password"
                        className="pl-9 h-10 border-gray-200 bg-white/80"
                      />
                    </div>
                  </Field>
                </div>
              </Section>

              {/* Pharmacy section */}
              {variant === "pharmacy" && (
                <Section
                  title="Informations de la pharmacie"
                  description="Renseignez les coordonnées de votre nouvelle pharmacie."
                  sectionBg={theme.sectionBg}
                  sectionBorder={theme.sectionBorder}
                >
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field htmlFor="pharmacyName" label="Nom de la pharmacie">
                      <Input
                        id="pharmacyName"
                        name="pharmacyName"
                        placeholder="Pharmacie Al Amal"
                        required
                        className="h-10 border-gray-200 bg-white/80"
                      />
                    </Field>
                    <Field htmlFor="city" label="Ville">
                      <Input
                        id="city"
                        name="city"
                        placeholder="Tanger"
                        required
                        className="h-10 border-gray-200 bg-white/80"
                      />
                    </Field>
                  </div>

                  <Field htmlFor="pharmacyAddress" label="Adresse">
                    <Input
                      id="pharmacyAddress"
                      name="pharmacyAddress"
                      placeholder="12 Avenue Mohammed V"
                      required
                      className="h-10 border-gray-200 bg-white/80"
                    />
                  </Field>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field htmlFor="pharmacyNeighborhood" label="Quartier">
                      <Input
                        id="pharmacyNeighborhood"
                        name="pharmacyNeighborhood"
                        placeholder="Centre-ville"
                        required
                        className="h-10 border-gray-200 bg-white/80"
                      />
                    </Field>
                    <Field htmlFor="openingHours" label="Horaires">
                      <Input
                        id="openingHours"
                        name="openingHours"
                        placeholder="Lun-Sam 08:30–20:00"
                        required
                        className="h-10 border-gray-200 bg-white/80"
                      />
                    </Field>
                  </div>

                  <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white/80 px-4 py-3">
                    <input
                      id="isOnDuty"
                      name="isOnDuty"
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300 accent-teal-500"
                    />
                    <div>
                      <Label htmlFor="isOnDuty" className="text-sm font-medium text-gray-700 cursor-pointer">
                        Pharmacie de garde
                      </Label>
                      <p className="text-xs text-gray-400">Disponible en dehors des heures normales</p>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field htmlFor="latitude" label="Latitude" hint="Facultatif">
                      <Input
                        id="latitude"
                        name="latitude"
                        type="number"
                        step="any"
                        placeholder="35.76"
                        className="h-10 border-gray-200 bg-white/80"
                      />
                    </Field>
                    <Field htmlFor="longitude" label="Longitude" hint="Facultatif">
                      <Input
                        id="longitude"
                        name="longitude"
                        type="number"
                        step="any"
                        placeholder="-5.80"
                        className="h-10 border-gray-200 bg-white/80"
                      />
                    </Field>
                  </div>
                </Section>
              )}

              {/* Hospital admin section */}
              {variant === "hospital-admin" && (
                <Section
                  title="Informations de votre établissement"
                  description="Créez votre établissement avant de lancer le compte administrateur."
                  sectionBg={theme.sectionBg}
                  sectionBorder={theme.sectionBorder}
                >
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field htmlFor="hospitalName" label="Nom de l'établissement">
                      <Input
                        id="hospitalName"
                        name="hospitalName"
                        placeholder="Hôpital Mohammed V"
                        required
                        className="h-10 border-gray-200 bg-white/80"
                      />
                    </Field>
                    <Field htmlFor="hospitalType" label="Type d'établissement">
                      <Select name="hospitalType" required>
                        <SelectTrigger id="hospitalType" className="h-10 border-gray-200 bg-white/80">
                          <SelectValue placeholder="Sélectionner un type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="public">Public</SelectItem>
                          <SelectItem value="private">Privé</SelectItem>
                          <SelectItem value="chu">CHU</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field htmlFor="hospitalAddress" label="Adresse">
                      <Input
                        id="hospitalAddress"
                        name="hospitalAddress"
                        placeholder="Boulevard Moulay Rachid"
                        required
                        className="h-10 border-gray-200 bg-white/80"
                      />
                    </Field>
                    <Field htmlFor="city" label="Ville">
                      <Input
                        id="city"
                        name="city"
                        placeholder="Tanger"
                        required
                        className="h-10 border-gray-200 bg-white/80"
                      />
                    </Field>
                  </div>

                  <Field htmlFor="hospitalPhone" label="Téléphone de la structure" hint="Optionnel">
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        id="hospitalPhone"
                        name="hospitalPhone"
                        type="tel"
                        placeholder="+212 5XX XXX XXX"
                        autoComplete="tel"
                        className="pl-9 h-10 border-gray-200 bg-white/80"
                      />
                    </div>
                  </Field>

                  <Field
                    htmlFor="specialties"
                    label="Spécialités"
                    hint="Séparez les spécialités par des virgules. Optionnel."
                  >
                    <textarea
                      id="specialties"
                      name="specialties"
                      rows={3}
                      className={textareaClassName}
                      placeholder="chirurgie, pédiatrie, oncologie"
                    />
                  </Field>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field htmlFor="latitude" label="Latitude" hint="Facultatif">
                      <Input
                        id="latitude"
                        name="latitude"
                        type="number"
                        step="any"
                        placeholder="35.72"
                        className="h-10 border-gray-200 bg-white/80"
                      />
                    </Field>
                    <Field htmlFor="longitude" label="Longitude" hint="Facultatif">
                      <Input
                        id="longitude"
                        name="longitude"
                        type="number"
                        step="any"
                        placeholder="-5.84"
                        className="h-10 border-gray-200 bg-white/80"
                      />
                    </Field>
                  </div>
                </Section>
              )}

              <Button
                type="submit"
                disabled={isPending}
                className={cn("w-full h-11 font-semibold text-sm", theme.btnClass)}
              >
                {isPending
                  ? t("auth.signupSubmitting", "Creation en cours...")
                  : variant === "patient"
                    ? t("auth.submitPatient", "Creer mon compte")
                    : variant === "pharmacy"
                      ? t("auth.submitPharmacy", "Creer la pharmacie")
                      : t("auth.submitHospitalAdmin", "Creer votre etablissement")}
              </Button>
            </form>

            {/* Footer */}
            <p className="text-center text-sm text-gray-500">
              {t("auth.alreadyAccount", "Deja un compte ?")}{" "}
              <Link
                href={loginHref}
                className={cn("font-semibold underline-offset-4 hover:underline", theme.accentText)}
              >
                {t("auth.loginSubmit", "Se connecter")}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
