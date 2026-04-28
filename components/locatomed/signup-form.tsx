"use client";

import { useTransition } from "react";
import type { FormEvent, ReactNode } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft, Lock, Mail, Phone, User } from "lucide-react";
import { useI18n } from "@/components/locatomed/i18n-provider";

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

const inputBase =
  "h-11 w-full rounded-xl bg-white/80 border border-slate-200 text-slate-900 text-sm placeholder:text-slate-400 outline-none transition-colors focus:border-[#14b8a6] focus:ring-2 focus:ring-[#14b8a6]/20 px-3 shadow-sm";

const textareaClass =
  "min-h-24 w-full rounded-xl bg-white/80 border border-slate-200 text-slate-900 text-sm placeholder:text-slate-400 outline-none transition-colors focus:border-[#14b8a6] focus:ring-2 focus:ring-[#14b8a6]/20 px-3 py-2.5 shadow-sm";

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div
      className="rounded-2xl p-5 space-y-4"
      style={{
        backgroundColor: "rgba(255, 255, 255, 0.55)",
        border: "1px solid rgba(15, 23, 42, 0.06)",
      }}
    >
      <div className="space-y-0.5">
        <h2 className="text-sm font-semibold text-slate-800">{title}</h2>
        <p className="text-xs text-slate-500">{description}</p>
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
      <label htmlFor={htmlFor} className="block text-sm font-medium text-slate-700">
        {label}
      </label>
      {children}
      {hint && <p className="text-xs text-slate-400">{hint}</p>}
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
        href={backHref}
        className="absolute top-6 left-6 z-20 inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        {t("auth.back", "Retour")}
      </Link>

      {/* Glass card */}
      <div
        className={`relative w-full ${isWideForm ? "max-w-2xl" : "max-w-md"}`}
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
          <h1 className="font-serif text-2xl text-slate-900">{title}</h1>
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Account info */}
          <Section
            title={t("auth.accountInfoTitle", "Informations du compte")}
            description={t(
              "auth.accountInfoDescription",
              "Creez le profil qui se connectera a LocatMed."
            )}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Field htmlFor="fullName" label="Nom complet">
                <div className="relative">
                  <User className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    id="fullName"
                    name="fullName"
                    placeholder="Fatima Zahra Alami"
                    required
                    autoComplete="name"
                    className={inputBase + " pl-9"}
                  />
                </div>
              </Field>
              <Field htmlFor="email" label="Email">
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="vous@exemple.ma"
                    required
                    autoComplete="email"
                    className={inputBase + " pl-9"}
                  />
                </div>
              </Field>
            </div>

            {showPhoneField && (
              <Field htmlFor="phone" label="Téléphone" hint="Optionnel">
                <div className="relative">
                  <Phone className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="+212 6XX XXX XXX"
                    autoComplete="tel"
                    className={inputBase + " pl-9"}
                  />
                </div>
              </Field>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <Field htmlFor="password" label="Mot de passe">
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    autoComplete="new-password"
                    className={inputBase + " pl-9"}
                  />
                </div>
              </Field>
              <Field htmlFor="confirmPassword" label="Confirmer le mot de passe">
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    required
                    autoComplete="new-password"
                    className={inputBase + " pl-9"}
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
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <Field htmlFor="pharmacyName" label="Nom de la pharmacie">
                  <input
                    id="pharmacyName"
                    name="pharmacyName"
                    placeholder="Pharmacie Al Amal"
                    required
                    className={inputBase}
                  />
                </Field>
                <Field htmlFor="city" label="Ville">
                  <input
                    id="city"
                    name="city"
                    placeholder="Tanger"
                    required
                    className={inputBase}
                  />
                </Field>
              </div>

              <Field htmlFor="pharmacyAddress" label="Adresse">
                <input
                  id="pharmacyAddress"
                  name="pharmacyAddress"
                  placeholder="12 Avenue Mohammed V"
                  required
                  className={inputBase}
                />
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field htmlFor="pharmacyNeighborhood" label="Quartier">
                  <input
                    id="pharmacyNeighborhood"
                    name="pharmacyNeighborhood"
                    placeholder="Centre-ville"
                    required
                    className={inputBase}
                  />
                </Field>
                <Field htmlFor="openingHours" label="Horaires">
                  <input
                    id="openingHours"
                    name="openingHours"
                    placeholder="Lun-Sam 08:30–20:00"
                    required
                    className={inputBase}
                  />
                </Field>
              </div>

              <div
                className="flex items-center gap-3 rounded-xl px-4 py-3"
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.60)",
                  border: "1px solid rgba(15, 23, 42, 0.08)",
                }}
              >
                <input
                  id="isOnDuty"
                  name="isOnDuty"
                  type="checkbox"
                  className="h-4 w-4 rounded border-slate-300 accent-teal-600"
                />
                <div>
                  <label
                    htmlFor="isOnDuty"
                    className="block text-sm font-medium text-slate-700 cursor-pointer"
                  >
                    Pharmacie de garde
                  </label>
                  <p className="text-xs text-slate-500">Disponible en dehors des heures normales</p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field htmlFor="latitude" label="Latitude" hint="Facultatif">
                  <input
                    id="latitude"
                    name="latitude"
                    type="number"
                    step="any"
                    placeholder="35.76"
                    className={inputBase}
                  />
                </Field>
                <Field htmlFor="longitude" label="Longitude" hint="Facultatif">
                  <input
                    id="longitude"
                    name="longitude"
                    type="number"
                    step="any"
                    placeholder="-5.80"
                    className={inputBase}
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
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <Field htmlFor="hospitalName" label="Nom de l'établissement">
                  <input
                    id="hospitalName"
                    name="hospitalName"
                    placeholder="Hôpital Mohammed V"
                    required
                    className={inputBase}
                  />
                </Field>
                <Field htmlFor="hospitalType" label="Type d'établissement">
                  <select
                    id="hospitalType"
                    name="hospitalType"
                    required
                    defaultValue=""
                    className={inputBase + " appearance-none cursor-pointer"}
                  >
                    <option value="" disabled>
                      Sélectionner un type
                    </option>
                    <option value="public">Public</option>
                    <option value="private">Privé</option>
                    <option value="chu">CHU</option>
                  </select>
                </Field>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field htmlFor="hospitalAddress" label="Adresse">
                  <input
                    id="hospitalAddress"
                    name="hospitalAddress"
                    placeholder="Boulevard Moulay Rachid"
                    required
                    className={inputBase}
                  />
                </Field>
                <Field htmlFor="city" label="Ville">
                  <input
                    id="city"
                    name="city"
                    placeholder="Tanger"
                    required
                    className={inputBase}
                  />
                </Field>
              </div>

              <Field htmlFor="hospitalPhone" label="Téléphone de la structure" hint="Optionnel">
                <div className="relative">
                  <Phone className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    id="hospitalPhone"
                    name="hospitalPhone"
                    type="tel"
                    placeholder="+212 5XX XXX XXX"
                    autoComplete="tel"
                    className={inputBase + " pl-9"}
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
                  className={textareaClass}
                  placeholder="chirurgie, pédiatrie, oncologie"
                />
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field htmlFor="latitude" label="Latitude" hint="Facultatif">
                  <input
                    id="latitude"
                    name="latitude"
                    type="number"
                    step="any"
                    placeholder="35.72"
                    className={inputBase}
                  />
                </Field>
                <Field htmlFor="longitude" label="Longitude" hint="Facultatif">
                  <input
                    id="longitude"
                    name="longitude"
                    type="number"
                    step="any"
                    placeholder="-5.84"
                    className={inputBase}
                  />
                </Field>
              </div>
            </Section>
          )}

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
              ? t("auth.signupSubmitting", "Creation en cours...")
              : variant === "patient"
                ? t("auth.submitPatient", "Creer mon compte")
                : variant === "pharmacy"
                  ? t("auth.submitPharmacy", "Creer la pharmacie")
                  : t("auth.submitHospitalAdmin", "Creer votre etablissement")}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          {t("auth.alreadyAccount", "Deja un compte ?")}{" "}
          <Link
            href={loginHref}
            className="font-medium text-slate-700 hover:text-[#14b8a6] transition-colors"
          >
            {t("auth.loginSubmit", "Se connecter")}
          </Link>
        </p>
      </div>
    </div>
  );
}
