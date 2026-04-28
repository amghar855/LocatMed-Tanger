import { Building2, MapPin, Heart } from "lucide-react";
import { FavoriteToggleForm } from "@/features/patient/components/favorites/favorite-toggle-form";
import { getServerTranslator } from "@/lib/i18n/server";

type HospitalOption = {
  id: string;
  name: string;
  type: "public" | "private" | "chu";
  address: string;
};

type Props = {
  hospitals: HospitalOption[];
  favoriteHospitalIds: string[];
};

const TYPE_STYLES: Record<string, { badge: string; dot: string }> = {
  public: { badge: "bg-teal-100 text-teal-700", dot: "bg-teal-500" },
  private: { badge: "bg-teal-100 text-teal-700", dot: "bg-teal-500" },
  chu: { badge: "bg-teal-100 text-teal-700", dot: "bg-teal-500" },
};

export async function FavoriteHospitalPicker({ hospitals, favoriteHospitalIds }: Props) {
  const { t } = await getServerTranslator();

  const TYPE_LABELS: Record<string, string> = {
    public: t("patient.favorites.typePublic"),
    private: t("patient.favorites.typePrivate"),
    chu: t("patient.favorites.typeChu"),
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* Section header */}
      <div className="flex items-center gap-2.5 border-b border-slate-100 px-5 py-4">
        <div className="flex size-7 items-center justify-center rounded-lg bg-rose-50">
          <Heart className="size-3.5 text-rose-500" />
        </div>
        <h2 className="text-sm font-bold text-slate-800">{t("patient.favorites.manage")}</h2>
        <span className="ml-auto rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-500">
          {hospitals.length}{" "}
          {hospitals.length === 1
            ? t("patient.favorites.establishmentOne")
            : t("patient.favorites.establishmentMany")}
        </span>
      </div>

      {/* Hospital list */}
      <div className="divide-y divide-slate-100">
        {hospitals.map((hospital) => {
          const isFavorite = favoriteHospitalIds.includes(hospital.id);
          const style = TYPE_STYLES[hospital.type] ?? { badge: "bg-slate-100 text-slate-600", dot: "bg-slate-400" };

          return (
            <div
              key={hospital.id}
              className={`flex items-center gap-3 px-5 py-3.5 transition-colors ${isFavorite ? "bg-rose-50/40" : "hover:bg-slate-50"}`}
            >
              {/* Icon */}
              <div className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${isFavorite ? "bg-rose-100" : "bg-slate-100"}`}>
                <Building2 className={`size-4 ${isFavorite ? "text-rose-600" : "text-slate-500"}`} />
              </div>

              {/* Info */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className={`truncate text-sm font-semibold ${isFavorite ? "text-slate-900" : "text-slate-700"}`}>
                    {hospital.name}
                  </p>
                  {isFavorite && (
                    <Heart className="size-3 shrink-0 fill-rose-500 text-rose-500" />
                  )}
                </div>
                <div className="mt-0.5 flex items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${style.badge}`}>
                    {TYPE_LABELS[hospital.type] ?? hospital.type}
                  </span>
                  <span className="flex items-center gap-1 truncate text-[11px] text-slate-400">
                    <MapPin className="size-3 shrink-0" />
                    {hospital.address}
                  </span>
                </div>
              </div>

              {/* Toggle */}
              <div className="shrink-0">
                <FavoriteToggleForm hospitalId={hospital.id} isFavorite={isFavorite} />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
