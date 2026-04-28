"use client";

import { useEffect, useState } from "react";
import type { MedicinePharmacyAvailability } from "@/features/patient/types/medicine-search";
import { useI18n } from "@/components/locatomed/i18n-provider";

type SheetState = "hidden" | "collapsed" | "expanded";

type Props = {
  pharmacy: MedicinePharmacyAvailability & { distanceKm: number };
  medicineName: string;
  onNavigate: () => void;
  onBack: () => void;
};

function stockBadgeClass(status: MedicinePharmacyAvailability["stockStatus"]) {
  if (status === "in_stock") return "bg-teal-100 text-teal-800";
  if (status === "low_stock") return "bg-amber-100 text-amber-800";
  return "bg-rose-100 text-rose-800";
}

const HEIGHT: Record<SheetState, string> = {
  hidden: "h-[7vh]",
  collapsed: "h-[22vh]",
  expanded: "h-[75vh]",
};

const STATE_ORDER: SheetState[] = ["hidden", "collapsed", "expanded"];

export function PharmacyBottomSheet({ pharmacy, medicineName, onNavigate, onBack }: Props) {
  const { t } = useI18n();
  const [state, setState] = useState<SheetState>("collapsed");

  // Reset to collapsed whenever the pharmacy changes
  useEffect(() => {
    setState("collapsed");
  }, [pharmacy.pharmacyId]);

  function handleTouchStart(e: React.TouchEvent) {
    const startY = e.touches[0].clientY;

    function onEnd(ev: TouchEvent) {
      const diff = startY - (ev.changedTouches[0]?.clientY ?? startY);
      if (diff > 60) {
        setState((prev) => {
          const idx = STATE_ORDER.indexOf(prev);
          return STATE_ORDER[Math.min(idx + 1, STATE_ORDER.length - 1)];
        });
      } else if (diff < -60) {
        setState((prev) => {
          const idx = STATE_ORDER.indexOf(prev);
          return STATE_ORDER[Math.max(idx - 1, 0)];
        });
      }
      document.removeEventListener("touchend", onEnd);
    }

    document.addEventListener("touchend", onEnd);
  }

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl transition-all duration-300 ease-out ${HEIGHT[state]}`}
    >
      {/* Swipe handle — always visible, acts as the collapse/expand trigger */}
      <div
        className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing"
        onTouchStart={handleTouchStart}
        onClick={() => setState((prev) => (prev === "expanded" ? "collapsed" : prev === "collapsed" ? "hidden" : "collapsed"))}
      >
        <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
      </div>

      {/* Content — hidden when sheet is in hidden state */}
      {state !== "hidden" && (
        <div className="px-4 overflow-y-auto" style={{ maxHeight: "calc(100% - 40px)" }}>
          {/* Header row */}
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-start gap-3 min-w-0">
              <div className="w-9 h-9 bg-teal-100 rounded-full flex items-center justify-center shrink-0">
                <span className="text-teal-600">💊</span>
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-sm leading-tight truncate">{pharmacy.pharmacyName}</h3>
                <p className="text-xs text-gray-500">{pharmacy.neighborhood ?? "Tanger"}</p>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0 ml-2">
              {/* Hide sheet (keeps direction on map) */}
              <button
                onClick={() => setState("hidden")}
                className="text-gray-400 hover:text-gray-600 p-1 text-xs"
                title="Masquer"
              >
                ▼
              </button>
              {/* Back to pharmacy list */}
              <button
                onClick={onBack}
                className="text-gray-400 hover:text-gray-600 p-1 text-xs"
                title="Retour à la liste"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Key info */}
          <div className="flex items-center flex-wrap gap-2 text-xs mb-2">
            {pharmacy.isOnDuty && (
              <span className="text-teal-600 font-medium">• {t("patient.medicineSearch.onDuty")}</span>
            )}
            <span className="text-gray-600">📍 {pharmacy.distanceKm.toFixed(1)} km</span>
            <span className={`rounded-full px-2 py-0.5 ${stockBadgeClass(pharmacy.stockStatus)}`}>
              {pharmacy.quantity} unités
            </span>
          </div>

          {/* Directions CTA — always accessible */}
          <button
            onClick={onNavigate}
            className="w-full bg-teal-500 hover:bg-teal-600 text-white font-medium py-3 rounded-xl flex items-center justify-center gap-2 text-sm"
          >
            <span>🧭</span>
            {t("patient.medicineSearch.route")}
          </button>

          {/* Expanded-only details */}
          {state === "expanded" && (
            <div className="mt-4 space-y-3 border-t pt-4 pb-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-teal-50 text-teal-700 rounded-full text-sm">
                <span className="w-2 h-2 bg-teal-500 rounded-full" />
                {medicineName}
              </div>

              {pharmacy.address && (
                <div className="flex items-start gap-3">
                  <span className="text-gray-400 mt-0.5">📍</span>
                  <div>
                    <p className="text-sm font-medium">Adresse</p>
                    <p className="text-sm text-gray-600">{pharmacy.address}</p>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-3">
                <span className="text-gray-400 mt-0.5">💰</span>
                <div>
                  <p className="text-sm font-medium">Prix</p>
                  <p className="text-sm text-gray-600">{pharmacy.price} MAD</p>
                </div>
              </div>
            </div>
          )}

          {state === "collapsed" && (
            <p className="text-center text-xs text-gray-400 mt-2">Glissez vers le haut pour plus ↑</p>
          )}
        </div>
      )}

      {/* When hidden: show a small restore hint */}
      {state === "hidden" && (
        <p className="text-center text-xs text-gray-400 -mt-1">↑ {pharmacy.pharmacyName}</p>
      )}
    </div>
  );
}
