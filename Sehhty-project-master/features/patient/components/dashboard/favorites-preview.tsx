import Link from "next/link";
import { ArrowRight, Heart, MapPin } from "lucide-react";
import type { FavoriteHospitalItem } from "@/features/patient/types/favorites";
import { getServerTranslator } from "@/lib/i18n/server";

type Props = {
  favorites: FavoriteHospitalItem[];
};

export async function FavoritesPreview({ favorites }: Props) {
  const { t } = await getServerTranslator();

  return (
    <div>
      <div className="mb-3 flex items-center justify-between px-1">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
          {t("patient.dashboard.favoriteHospitals")}
        </p>
        <Link
          href="/patient/favorites"
          className="flex items-center gap-1 text-xs font-medium text-teal-600 hover:underline"
        >
          {t("patient.dashboard.seeAll")}
          <ArrowRight className="size-3" />
        </Link>
      </div>

      {favorites.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl bg-slate-50 py-8 text-center">
          <Heart className="size-6 text-slate-300" />
          <p className="text-sm text-slate-500">{t("patient.dashboard.noFavorites")}</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {favorites.slice(0, 3).map((item) => (
            <li key={item.id}>
              <Link
                href={`/patient/hospital/${item.id}`}
                className="group flex items-center gap-3 rounded-2xl px-4 py-3 transition-colors hover:bg-slate-50"
              >
                <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-teal-50">
                  <MapPin className="size-3.5 text-teal-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-900">
                    {item.hospitalName}
                  </p>
                  <p className="truncate text-xs text-slate-500">{item.address}</p>
                </div>
                <ArrowRight className="size-3.5 shrink-0 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-teal-500" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
