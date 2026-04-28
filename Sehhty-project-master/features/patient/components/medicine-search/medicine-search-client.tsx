"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  requestMedicineBroadcastAction,
  searchMedicinesAction,
} from "@/app/patient/medicine-search/actions";
import { TANGIER_CENTER } from "@/features/patient/constants/tangier";
import type {
  MedicinePharmacyAvailability,
  MedicineSearchItem,
} from "@/features/patient/types/medicine-search";
import { useI18n } from "@/components/locatomed/i18n-provider";
import { PharmacyBottomSheet } from "@/features/patient/components/medicine-search/pharmacy-bottom-sheet";

const PharmacyMap = dynamic(
  () => import("@/features/patient/components/medicine-search/pharmacy-map").then((m) => m.PharmacyMap),
  { ssr: false }
);

const SUGGESTED_QUERIES = ["Doliprane", "Ventoline", "Augmentin", "Spasfon"];

type UserLocation = {
  lat: number;
  lng: number;
};

function haversineKm(a: UserLocation, b: UserLocation) {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const earthRadius = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  const y = 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
  return earthRadius * y;
}

function rankStock(status: MedicinePharmacyAvailability["stockStatus"]) {
  if (status === "in_stock") return 3;
  if (status === "low_stock") return 2;
  return 1;
}

function stockBadgeClass(status: MedicinePharmacyAvailability["stockStatus"]) {
  if (status === "in_stock") return "bg-teal-100 text-teal-800";
  if (status === "low_stock") return "bg-amber-100 text-amber-800";
  return "bg-rose-100 text-rose-800";
}

function stockLabel(status: MedicinePharmacyAvailability["stockStatus"]) {
  if (status === "in_stock") return "patient.medicineSearch.stockIn";
  if (status === "low_stock") return "patient.medicineSearch.stockLow";
  return "patient.medicineSearch.stockOut";
}

export function MedicineSearchClient() {
  const { t } = useI18n();
  const [isPending, startTransition] = useTransition();
  const [isBroadcastPending, startBroadcastTransition] = useTransition();
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<MedicineSearchItem[]>([]);
  const [activeMedicineId, setActiveMedicineId] = useState<string | null>(null);
  const [selectedPharmacyId, setSelectedPharmacyId] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<UserLocation>(TANGIER_CENTER);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function selectPharmacy(id: string | null) {
    setSelectedPharmacyId(id);
  }

  useEffect(() => {
    if (!navigator.geolocation) {
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      () => {
        // silent fallback to Tangier center
      },
      { timeout: 3000 }
    );
  }, []);

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  function runSearch(nextQuery: string) {
    if (nextQuery.trim().length < 2) {
      setItems([]);
      setActiveMedicineId(null);
      selectPharmacy(null);
      return;
    }

    startTransition(async () => {
      const response = await searchMedicinesAction({ query: nextQuery });
      if (response?.error) {
        toast.error(response.error);
        return;
      }

      const nextItems = response.data?.items ?? [];
      setItems(nextItems);
      setActiveMedicineId(nextItems[0]?.medicineId ?? null);
      selectPharmacy(nextItems[0]?.pharmacies[0]?.pharmacyId ?? null);
    });
  }

  function scheduleSearch(nextQuery: string) {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      runSearch(nextQuery);
    }, 300);
  }

  function handleQueryChange(nextQuery: string) {
    setQuery(nextQuery);
    scheduleSearch(nextQuery);
  }

  function applySuggestedQuery(suggestedQuery: string) {
    setQuery(suggestedQuery);
    runSearch(suggestedQuery);
  }

  const activeItem = useMemo(
    () => items.find((item) => item.medicineId === activeMedicineId) ?? items[0] ?? null,
    [activeMedicineId, items]
  );

  const sortedPharmacies = useMemo(() => {
    if (!activeItem) {
      return [];
    }

    return [...activeItem.pharmacies]
      .map((pharmacy) => ({
        ...pharmacy,
        distanceKm: haversineKm(userLocation, { lat: pharmacy.lat, lng: pharmacy.lng }),
      }))
      .sort((a, b) => {
        const byStatus = rankStock(b.stockStatus) - rankStock(a.stockStatus);
        if (byStatus !== 0) return byStatus;
        return a.distanceKm - b.distanceKm;
      });
  }, [activeItem, userLocation]);

  const hasAvailableStock = useMemo(
    () => sortedPharmacies.some((pharmacy) => pharmacy.stockStatus !== "out_of_stock"),
    [sortedPharmacies]
  );

  function buildDirectionsUrl(pharmacy: { lat: number; lng: number }) {
    const from = `${userLocation.lat.toFixed(6)},${userLocation.lng.toFixed(6)}`;
    const to = `${pharmacy.lat.toFixed(6)},${pharmacy.lng.toFixed(6)}`;
    return `https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=${encodeURIComponent(`${from};${to}`)}`;
  }

  function requestBroadcast(medicineId: string, medicineName: string) {
    startBroadcastTransition(async () => {
      const response = await requestMedicineBroadcastAction({ medicineId });
      if (response?.error) {
        toast.error(response.error);
        return;
      }

      const createdCount = response?.data?.createdCount ?? 0;
      const pharmacyCount = response?.data?.pharmacyCount ?? 0;
      if (createdCount > 0) {
        toast.success(`${t("patient.medicineSearch.broadcastDone")} ${createdCount}/${pharmacyCount} pharmacies pour ${medicineName}`);
        return;
      }

      toast.message(t("patient.medicineSearch.broadcastPendingTitle"), {
        description: `${t("patient.medicineSearch.broadcastPendingDescriptionPrefix")} ${medicineName}.`,
      });
    });
  }

  const selectedPharmacy = useMemo(
    () => sortedPharmacies.find((p) => p.pharmacyId === selectedPharmacyId) ?? null,
    [sortedPharmacies, selectedPharmacyId]
  );

  return (
    <section className="space-y-4">
      <div className="rounded-lg border bg-white p-4 space-y-3">
        <label htmlFor="medicine-search" className="block text-sm font-medium">
          {t("patient.medicineSearch.searchLabel")}
        </label>
        <input
          id="medicine-search"
          value={query}
          onChange={(event) => handleQueryChange(event.target.value)}
          placeholder={t("patient.medicineSearch.searchPlaceholder")}
          className="w-full rounded border px-3 py-2 text-sm"
        />
        <p className="text-xs text-gray-600">{t("patient.medicineSearch.debounceHint")}</p>
        <div className="flex flex-wrap gap-2">
          {SUGGESTED_QUERIES.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => applySuggestedQuery(suggestion)}
              className="rounded-full border px-3 py-1 text-xs"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>

      {isPending ? (
        <div className="rounded-lg border bg-white p-4 text-sm text-gray-600">{t("patient.medicineSearch.searching")}</div>
      ) : null}

      {!isPending && query.trim().length >= 2 && items.length === 0 ? (
        <div className="rounded-lg border bg-white p-4 text-sm text-gray-600">
          {t("patient.medicineSearch.notFound")}
        </div>
      ) : null}

      {/* Mobile fullscreen overlay — shown below lg when results exist */}
      {items.length > 0 ? (
        <div className="fixed inset-0 z-40 flex flex-col lg:hidden">
          {/* Search bar pinned at top */}
          <div className="bg-white/95 backdrop-blur shadow-sm px-3 py-2 z-50 relative space-y-2">
            <input
              value={query}
              onChange={(event) => handleQueryChange(event.target.value)}
              placeholder={t("patient.medicineSearch.searchPlaceholder")}
              className="w-full rounded border px-3 py-2 text-sm"
            />
            <div className="flex flex-wrap gap-2">
              {SUGGESTED_QUERIES.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => applySuggestedQuery(suggestion)}
                  className="rounded-full border px-3 py-1 text-xs"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>

          {/* Map fills remaining space */}
          <div className="flex-1 relative">
            <PharmacyMap
              pharmacies={sortedPharmacies}
              selectedPharmacyId={selectedPharmacyId}
              onSelectPharmacy={selectPharmacy}
              userLocation={userLocation}
              fullscreen
            />
          </div>

          {/* Bottom sheet when pharmacy selected and not dismissed */}
          {/* Bottom sheet — always rendered when pharmacy selected; manages its own hidden/collapsed/expanded state */}
          {selectedPharmacy ? (
            <PharmacyBottomSheet
              pharmacy={selectedPharmacy}
              medicineName={activeItem?.medicineName ?? ""}
              onBack={() => selectPharmacy(null)}
              onNavigate={() => window.open(buildDirectionsUrl(selectedPharmacy), "_blank")}
            />
          ) : (
            /* Compact pharmacy list when none selected */
            <div className="fixed bottom-0 left-0 right-0 z-50 max-h-[40vh] overflow-y-auto bg-white/95 backdrop-blur rounded-t-3xl shadow-2xl">
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-12 h-1 bg-gray-300 rounded-full" />
              </div>
              <div className="px-4 pb-4">
                <h3 className="font-semibold text-sm text-gray-900 mb-2">
                  {sortedPharmacies.length} {sortedPharmacies.length === 1 ? "pharmacie" : "pharmacies"}
                </h3>
                {sortedPharmacies.map((pharmacy) => (
                  <button
                    key={pharmacy.pharmacyId}
                    type="button"
                    onClick={() => selectPharmacy(pharmacy.pharmacyId)}
                    className="w-full text-left p-3 rounded-xl bg-white hover:bg-gray-50 border mb-2"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{pharmacy.pharmacyName}</p>
                        <p className="text-xs text-gray-500">{pharmacy.distanceKm.toFixed(1)} km · {pharmacy.neighborhood ?? "Tanger"}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className={`rounded-full px-2 py-0.5 text-xs ${stockBadgeClass(pharmacy.stockStatus)}`}>
                          {t(stockLabel(pharmacy.stockStatus))}
                        </span>
                        {pharmacy.isOnDuty ? (
                          <span className="text-cyan-600 text-xs font-medium">• {t("patient.medicineSearch.onDuty")}</span>
                        ) : null}
                      </div>
                    </div>
                  </button>
                ))}

                {(sortedPharmacies.length === 0 || !hasAvailableStock) ? (
                  <div className="rounded border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 mt-2">
                    <p className="font-medium">{t("patient.medicineSearch.noStockNow")}</p>
                    <p className="mt-1">{t("patient.medicineSearch.broadcastHint")}</p>
                    {activeItem ? (
                      <button
                        type="button"
                        onClick={() => requestBroadcast(activeItem.medicineId, activeItem.medicineName)}
                        disabled={isBroadcastPending}
                        className="mt-2 rounded bg-amber-600 px-3 py-1.5 text-white transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        {isBroadcastPending ? t("patient.medicineSearch.broadcastSending") : t("patient.medicineSearch.broadcastButton")}
                      </button>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </div>
          )}
        </div>
      ) : null}

      {/* Desktop grid — hidden on mobile */}
      {items.length > 0 ? (
        <div className="hidden lg:grid gap-4 lg:grid-cols-[1.2fr_1fr]">
          <div className="space-y-3">
            {items.map((item) => {
              const isActive = item.medicineId === (activeItem?.medicineId ?? null);

              return (
                <article key={item.medicineId} className="rounded-lg border bg-white p-3">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveMedicineId(item.medicineId);
                      selectPharmacy(item.pharmacies[0]?.pharmacyId ?? null);
                    }}
                    className="w-full text-left"
                  >
                    <h3 className="font-semibold">{item.medicineName}</h3>
                    <p className="text-sm text-gray-600">{t("patient.medicineSearch.activeIngredient")}: {item.activeIngredient}</p>
                    <p className="text-xs text-gray-600">
                      {t("patient.medicineSearch.form")}: {item.dosageForm ?? "-"} | {t("patient.medicineSearch.ppm")}: {item.ppm ?? "-"} MAD
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      {t("patient.medicineSearch.linkedPharmacies")}: {item.pharmacies.length}
                    </p>
                  </button>

                  {isActive ? (
                    <div className="mt-3 space-y-2">
                      {sortedPharmacies.length === 0 ? (
                        <p className="text-sm text-gray-600">{t("patient.medicineSearch.noPharmacyForMedicine")}</p>
                      ) : (
                        sortedPharmacies.map((pharmacy) => (
                          <button
                            key={`${item.medicineId}-${pharmacy.pharmacyId}`}
                            type="button"
                            onClick={() => selectPharmacy(pharmacy.pharmacyId)}
                            className={`w-full rounded border p-2 text-left text-xs ${
                              pharmacy.pharmacyId === selectedPharmacyId ? "border-teal-500 bg-teal-50" : "bg-white"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <p className="font-medium">{pharmacy.pharmacyName}</p>
                              <span className={`rounded-full px-2 py-0.5 ${stockBadgeClass(pharmacy.stockStatus)}`}>
                                {t(stockLabel(pharmacy.stockStatus))}
                              </span>
                            </div>
                            <p>{pharmacy.neighborhood ?? "Tanger"}</p>
                            <p>{t("patient.medicineSearch.distance")}: {pharmacy.distanceKm.toFixed(2)} km</p>
                            <p>{t("patient.medicineSearch.quantity")}: {pharmacy.quantity}</p>
                            <p>{t("patient.medicineSearch.price")}: {pharmacy.price} MAD</p>
                            {pharmacy.isOnDuty ? (
                              <span className="mt-1 inline-block rounded-full bg-cyan-100 px-2 py-0.5 text-cyan-700">
                                {t("patient.medicineSearch.onDuty")}
                              </span>
                            ) : null}
                            <a
                              href={buildDirectionsUrl(pharmacy)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-1.5 inline-block rounded border border-slate-200 px-2 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-50"
                              onClick={(event) => event.stopPropagation()}
                            >
                              {t("patient.medicineSearch.route")}
                            </a>
                          </button>
                        ))
                      )}

                      {(sortedPharmacies.length === 0 || !hasAvailableStock) && isActive ? (
                        <div className="rounded border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                          <p className="font-medium">{t("patient.medicineSearch.noStockNow")}</p>
                          <p className="mt-1">{t("patient.medicineSearch.broadcastHint")}</p>
                          <button
                            type="button"
                            onClick={() => requestBroadcast(item.medicineId, item.medicineName)}
                            disabled={isBroadcastPending}
                            className="mt-2 rounded bg-amber-600 px-3 py-1.5 text-white transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-70"
                          >
                            {isBroadcastPending ? t("patient.medicineSearch.broadcastSending") : t("patient.medicineSearch.broadcastButton")}
                          </button>
                          <p className="mt-1 text-[11px] text-amber-800">
                            {t("patient.medicineSearch.broadcastFollowup")}
                          </p>
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>

          <div className="space-y-2">
            <h2 className="text-sm font-semibold">{t("patient.medicineSearch.mapTitle")}</h2>
            <PharmacyMap
              pharmacies={sortedPharmacies}
              selectedPharmacyId={selectedPharmacyId}
              onSelectPharmacy={selectPharmacy}
              userLocation={userLocation}
            />
          </div>
        </div>
      ) : null}
    </section>
  );
}
