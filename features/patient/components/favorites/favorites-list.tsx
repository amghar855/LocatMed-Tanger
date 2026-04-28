import type { FavoriteHospitalItem } from "@/features/patient/types/favorites";
import { Building2, MapPin, ChevronRight, Heart } from "lucide-react";
import Link from "next/link";
import { getServerTranslator } from "@/lib/i18n/server";

type Props = {
  favorites: FavoriteHospitalItem[];
};

const TYPE_STYLES: Record<string, { badge: string; iconBg: string; iconColor: string }> = {
  public:  { badge: "bg-teal-100 text-teal-700",      iconBg: "bg-teal-50",      iconColor: "text-teal-600" },
  private: { badge: "bg-teal-100 text-teal-700", iconBg: "bg-teal-50",   iconColor: "text-teal-600" },
  chu:     { badge: "bg-teal-100 text-teal-700", iconBg: "bg-teal-50", iconColor: "text-teal-600" },
};

export async function FavoritesList({ favorites }: Props) {
  const { t } = await getServerTranslator();

  const TYPE_LABELS: Record<string, string> = {
    public: t("patient.favorites.typePublic"),
    private: t("patient.favorites.typePrivate"),
    chu: t("patient.favorites.typeChu"),
  };

  if (favorites.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-rose-200 bg-rose-50/30 py-16 text-center">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-rose-100">
          <Heart className="size-6 text-rose-300" />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-600">{t("patient.favorites.noneTitle")}</p>
          <p className="mt-1 text-xs text-slate-400">
            {t("patient.favorites.noneDescription")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {favorites.map((item) => {
        const style = TYPE_STYLES[item.hospitalType] ?? {
          badge: "bg-slate-100 text-slate-600",
          iconBg: "bg-slate-50",
          iconColor: "text-slate-500",
        };

        return (
          <article
            key={item.id}
            className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all hover:border-rose-200 hover:shadow-md"
          >
            {/* Accent top bar */}
            <div className="h-1 w-full bg-gradient-to-r from-rose-400 to-pink-400" />

            <div className="p-4">
              <div className="flex items-start gap-3">
                {/* Icon */}
                <div className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${style.iconBg}`}>
                  <Building2 className={`size-5 ${style.iconColor}`} />
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-bold leading-snug text-slate-900">
                      {item.hospitalName}
                    </h3>
                    <Heart className="size-3.5 shrink-0 fill-rose-400 text-rose-400 mt-0.5" />
                  </div>

                  <div className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                    <MapPin className="size-3 shrink-0 text-slate-400" />
                    <span className="truncate">{item.address}</span>
                  </div>

                  <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                    <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${style.badge}`}>
                      {TYPE_LABELS[item.hospitalType] ?? item.hospitalType}
                    </span>
                    {item.specialties?.slice(0, 2).map((sp) => (
                      <span key={sp} className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-medium text-slate-600">
                        {sp}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Book CTA */}
              <Link
                href={`/patient/booking?hospitalId=${item.hospitalId}`}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-teal-50 py-2 text-xs font-semibold text-teal-700 transition-colors hover:bg-teal-100"
              >
                {t("patient.favorites.book")}
                <ChevronRight className="size-3.5" />
              </Link>
            </div>
          </article>
        );
      })}
    </div>
  );
}
