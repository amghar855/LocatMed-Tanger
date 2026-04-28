import type { HospitalDiscover, PharmacyDiscover } from "@/features/patient/types/discover";
import { getServerTranslator } from "@/lib/i18n/server";

type Props = {
  view: "hospitals" | "pharmacies";
  hospitals: HospitalDiscover[];
  pharmacies: PharmacyDiscover[];
  selectedId: string | null;
  onSelect: (id: string) => void;
};

export async function DiscoverList({ view, hospitals, pharmacies, selectedId, onSelect }: Props) {
  const { t } = await getServerTranslator();

  if (view === "hospitals") {
    if (hospitals.length === 0) {
      return (
        <div className="rounded-xl border bg-white p-4 text-center text-sm text-gray-500">
          {t("patient.booking.noEstablishment")}
        </div>
      );
    }

    return (
      <div className="grid gap-2">
        {hospitals.map((hospital) => (
          <button
            key={hospital.id}
            type="button"
            onClick={() => onSelect(hospital.id)}
            className={`w-full rounded-xl border p-3 text-left transition-colors ${
              selectedId === hospital.id
                ? "border-slate-400 bg-slate-100"
                : "border-slate-200 bg-white hover:bg-slate-50"
            }`}
          >
            <h3 className="patient-heading text-base">{hospital.name}</h3>
            <p className="mt-1 text-sm text-gray-600">{hospital.address}</p>
            <div className="mt-2 flex items-center gap-2 text-xs">
              <span className="rounded-full border bg-white px-2 py-0.5 uppercase">{hospital.type}</span>
              {hospital.specialties?.length ? (
                <span className="text-gray-600">{hospital.specialties.slice(0, 2).join(" • ")}</span>
              ) : null}
            </div>
          </button>
        ))}
      </div>
    );
  }

  if (pharmacies.length === 0) {
    return (
      <div className="rounded-xl border bg-white p-4 text-center text-sm text-gray-500">
        {t("patient.discover.noPharmacies")}
      </div>
    );
  }

  return (
    <div className="grid gap-2">
      {pharmacies.map((pharmacy) => (
        <button
          key={pharmacy.id}
          type="button"
          onClick={() => onSelect(pharmacy.id)}
          className={`w-full rounded-xl border p-3 text-left transition-colors ${
            selectedId === pharmacy.id
              ? "border-slate-400 bg-slate-100"
              : "border-slate-200 bg-white hover:bg-slate-50"
          }`}
        >
          <h3 className="patient-heading text-base">{pharmacy.name}</h3>
          <p className="mt-1 text-sm text-gray-600">{pharmacy.address ?? t("patient.discover.addressUnavailable")}</p>
          <div className="mt-2 flex items-center gap-2 text-xs">
            {pharmacy.neighborhood ? (
              <span className="rounded-full border bg-white px-2 py-0.5">{pharmacy.neighborhood}</span>
            ) : null}
            <span className={`rounded-full px-2 py-0.5 ${pharmacy.isOnDuty ? "bg-teal-100 text-teal-800" : "bg-gray-100 text-gray-700"}`}>
              {pharmacy.isOnDuty ? t("patient.medicineSearch.onDuty") : t("patient.discover.standard")}
            </span>
          </div>
        </button>
      ))}
    </div>
  );
}
