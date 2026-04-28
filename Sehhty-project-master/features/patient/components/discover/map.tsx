import { TANGIER_CENTER } from "@/features/patient/constants/tangier";
import type { HospitalDiscover, PharmacyDiscover } from "@/features/patient/types/discover";
import { getServerTranslator } from "@/lib/i18n/server";

type Props = {
  view: "hospitals" | "pharmacies";
  hospitals: HospitalDiscover[];
  pharmacies: PharmacyDiscover[];
};

export async function DiscoverMap({ view, hospitals, pharmacies }: Props) {
  const { t } = await getServerTranslator();
  const points = view === "hospitals" ? hospitals : pharmacies;
  const selected = points[0] ?? null;

  return (
    <div className="rounded bg-gradient-to-br from-slate-100 to-slate-200 p-4 border">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="font-semibold text-sm">{t("patient.medicineSearch.mapTitle")}</h2>
        <span className="text-xs text-gray-600">{points.length} points</span>
      </div>
      <div className="h-48 overflow-auto rounded bg-white p-3 text-xs text-gray-700">
        {points.length === 0 ? (
          <p>{t("patient.discover.results")} 0</p>
        ) : (
          points.map((point) => (
            <p key={point.id}>
              • {point.name} ({point.lat.toFixed(4)}, {point.lng.toFixed(4)})
            </p>
          ))
        )}
      </div>
      <div className="mt-2 text-xs text-gray-600">
        Centre fallback: {TANGIER_CENTER.lat}, {TANGIER_CENTER.lng}
      </div>
      {selected ? (
        <div className="mt-2 rounded bg-white p-2 text-xs border">
          <p className="font-medium">Sélection: {selected.name}</p>
          <p>
            {selected.lat.toFixed(4)}, {selected.lng.toFixed(4)}
          </p>
        </div>
      ) : null}
    </div>
  );
}
