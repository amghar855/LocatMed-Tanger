import { requireRole } from "@/lib/auth/guards";
import {
  listFavoriteHospitalsByPatient,
  listHospitalsForFavoritePicker,
} from "@/features/patient/services/favorites";
import { FavoritesList } from "@/features/patient/components/favorites/favorites-list";
import { FavoriteHospitalPicker } from "@/features/patient/components/favorites/favorite-hospital-picker";
import { PatientShellServer } from "@/features/patient/components/layout/patient-shell-server";
import { Heart } from "lucide-react";
import { getServerTranslator } from "@/lib/i18n/server";

export default async function PatientFavoritesPage() {
  const { t } = await getServerTranslator();
  const session = await requireRole("patient");

  const [favorites, hospitals] = await Promise.all([
    listFavoriteHospitalsByPatient(session.user.id),
    listHospitalsForFavoritePicker(),
  ]);

  const favoriteHospitalIds = favorites.map((item) => item.hospitalId);

  return (
    <PatientShellServer>
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-rose-500 via-pink-500 to-orange-400 px-6 py-8 text-white shadow-lg">
        <div className="pointer-events-none absolute -right-8 -top-8 size-40 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -bottom-6 right-20 size-24 rounded-full bg-white/10" />
        <div className="flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-white/15">
            <Heart className="size-5 text-white" />
          </div>
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-widest text-rose-100">
              {t("patient.dashboard.space")}
            </p>
            <h1 className="text-2xl font-bold">{t("patient.favorites.title")}</h1>
          </div>
        </div>
        <p className="mt-3 max-w-sm text-sm text-rose-100/90">
          {t("patient.favorites.description")}
        </p>
        <div className="mt-4 flex flex-wrap gap-3 text-sm font-medium">
          <div className="flex items-center gap-2 rounded-full bg-white/15 px-3.5 py-1.5 backdrop-blur-sm">
            <Heart className="size-3.5" />
            {favorites.length}{" "}
            {favorites.length === 1
              ? t("patient.favorites.savedCountSuffixOne")
              : t("patient.favorites.savedCountSuffixMany")}
          </div>
        </div>
      </section>

      <FavoriteHospitalPicker
        hospitals={hospitals}
        favoriteHospitalIds={favoriteHospitalIds}
      />

      {/* Saved favorites */}
      <section className="space-y-3">
        <div className="flex items-center gap-2 px-1">
          <h2 className="text-sm font-bold text-slate-800">{t("patient.favorites.savedTitle")}</h2>
          <span className="rounded-full bg-rose-100 px-2.5 py-0.5 text-[11px] font-semibold text-rose-700">
            {favorites.length}
          </span>
        </div>
        <FavoritesList favorites={favorites} />
      </section>
    </PatientShellServer>
  );
}
