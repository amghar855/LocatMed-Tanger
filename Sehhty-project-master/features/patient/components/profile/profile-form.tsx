"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { updatePatientProfile } from "@/app/patient/profile/actions";
import { useI18n } from "@/components/locatomed/i18n-provider";

type Props = {
  fullName: string;
  phone: string | null;
};

export function ProfileForm({ fullName, phone }: Props) {
  const { t } = useI18n();
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await updatePatientProfile(formData);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success(t("patient.profile.savedToast"));
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <label htmlFor="fullName" className="text-sm font-medium text-slate-700">
          {t("patient.profile.fullName")}
        </label>
        <input
          id="fullName"
          name="fullName"
          type="text"
          defaultValue={fullName}
          required
          minLength={2}
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20"
          placeholder={t("patient.profile.fullNamePlaceholder")}
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="phone" className="text-sm font-medium text-slate-700">
          {t("patient.profile.phone")}
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          defaultValue={phone ?? ""}
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20"
          placeholder={t("patient.profile.phonePlaceholder")}
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-xl bg-teal-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-700 disabled:opacity-60"
      >
        {isPending ? t("patient.profile.saving") : t("patient.profile.saveChanges")}
      </button>
    </form>
  );
}
