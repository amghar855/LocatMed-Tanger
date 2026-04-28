"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Building2, Calendar, Clock, MapPin, Navigation, Pill, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PharmacyDiscover } from "@/features/patient/types/discover";
import { formatDistance } from "@/features/patient/utils/distance";
import { useI18n } from "@/components/locatomed/i18n-provider";

type Pharmacy = PharmacyDiscover & { distanceKm: number };

type Props = {
  pharmacy: Pharmacy;
  committedQuery: string;
  medicineAvailableInPharmacy: boolean | null;
  isExpanded: boolean;
  onExpand: () => void;
  onCollapse: () => void;
  onClose: () => void;
  onNavigate: () => void;
};

export function PharmacyBottomSheet({
  pharmacy,
  committedQuery,
  medicineAvailableInPharmacy,
  isExpanded,
  onExpand,
  onCollapse,
  onClose,
  onNavigate,
}: Props) {
  const { t } = useI18n();
  const startYRef = useRef<number | null>(null);
  const [dragOffset, setDragOffset] = useState(0);
  const isDragging = useRef(false);

  const bookingUrl = `/patient/booking?pharmacyId=${pharmacy.id}`;
  const detailUrl = `/patient/pharmacy/${pharmacy.id}`;

  function onHandleTouchStart(e: React.TouchEvent) {
    startYRef.current = e.touches[0].clientY;
    isDragging.current = true;
    setDragOffset(0);
  }

  function onHandleTouchMove(e: React.TouchEvent) {
    if (!isDragging.current || startYRef.current === null) return;
    const delta = e.touches[0].clientY - startYRef.current;
    // Only drag downward (positive delta)
    if (delta > 0) setDragOffset(delta);
  }

  function onHandleTouchEnd(e: React.TouchEvent) {
    if (!isDragging.current || startYRef.current === null) return;
    const delta = e.changedTouches[0].clientY - startYRef.current;
    const threshold = window.innerHeight * 0.12;

    if (delta < -threshold) {
      // Swipe up
      if (!isExpanded) onExpand();
    } else if (delta > threshold) {
      // Swipe down
      if (isExpanded) onCollapse();
      else onClose();
    }

    isDragging.current = false;
    startYRef.current = null;
    setDragOffset(0);
  }

  return (
    <>
      {/* Backdrop — only when expanded */}
      {isExpanded && (
        <div
          className="fixed inset-0 z-[999] bg-black/20"
          onClick={onCollapse}
        />
      )}

      {/* Sheet */}
      <div
        className={cn(
          "fixed bottom-0 left-0 right-0 z-[1000] bg-white rounded-t-[28px]",
          "shadow-[0_-8px_40px_rgba(0,0,0,0.18)]",
          isExpanded ? "h-[85vh]" : "h-[35vh]"
        )}
        style={{
          transform: dragOffset > 0 ? `translateY(${dragOffset}px)` : undefined,
          transition: dragOffset > 0 ? "none" : "height 300ms ease-out, transform 300ms ease-out",
        }}
      >
        {/* ── Drag handle — full-width touch area ── */}
        <div
          className="flex cursor-grab justify-center pb-2 pt-3 active:cursor-grabbing touch-manipulation"
          style={{ minHeight: "44px", alignItems: "center" }}
          onTouchStart={onHandleTouchStart}
          onTouchMove={onHandleTouchMove}
          onTouchEnd={onHandleTouchEnd}
          onClick={() => (isExpanded ? onCollapse() : onExpand())}
        >
          <div className="h-1.5 w-12 rounded-full bg-slate-200" />
        </div>

        {isExpanded ? (
          <ExpandedContent
            pharmacy={pharmacy}
            committedQuery={committedQuery}
            medicineAvailableInPharmacy={medicineAvailableInPharmacy}
            onClose={onClose}
            onNavigate={onNavigate}
            bookingUrl={bookingUrl}
            detailUrl={detailUrl}
            t={t}
          />
        ) : (
          <CompactContent
            pharmacy={pharmacy}
            committedQuery={committedQuery}
            medicineAvailableInPharmacy={medicineAvailableInPharmacy}
            onClose={onClose}
            onNavigate={onNavigate}
            t={t}
          />
        )}
      </div>
    </>
  );
}

/* ─────────────────────────────────────────────────────── */
/*  Compact mode (35vh) — essential info + destination     */
/* ─────────────────────────────────────────────────────── */

function CompactContent({
  pharmacy,
  committedQuery,
  medicineAvailableInPharmacy,
  onClose,
  onNavigate,
  t,
}: {
  pharmacy: Pharmacy;
  committedQuery: string;
  medicineAvailableInPharmacy: boolean | null;
  onClose: () => void;
  onNavigate: () => void;
  t: (key: string) => string;
}) {
  return (
    <div className="flex flex-col h-[calc(35vh-44px)] px-4 pb-safe overflow-hidden">
      {/* Name + close */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0">
          <p className="text-[15px] font-bold leading-snug text-slate-900 truncate">
            {pharmacy.name}
          </p>
          <p className="text-[12px] text-slate-500 truncate">
            {pharmacy.neighborhood ?? "Tanger"}
          </p>
        </div>
        {/* 44×44 close button */}
        <button
          onClick={onClose}
          className="shrink-0 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors touch-manipulation"
          style={{ width: "44px", height: "44px" }}
        >
          <X className="size-4" />
        </button>
      </div>

      {/* Badge row */}
      <div className="flex flex-wrap items-center gap-1.5 mb-3">
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold",
            pharmacy.isOnDuty
              ? "bg-amber-100 text-amber-800"
              : "bg-slate-100 text-slate-500"
          )}
        >
          <span
            className={cn(
              "size-1.5 rounded-full",
              pharmacy.isOnDuty ? "bg-amber-500" : "bg-slate-400"
            )}
          />
          {pharmacy.isOnDuty ? t("patient.discover.openOnDuty") : t("patient.discover.closed")}
        </span>

        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
          <MapPin className="size-2.5" />
          {formatDistance(pharmacy.distanceKm)}
        </span>

        {medicineAvailableInPharmacy === true && committedQuery && (
          <span className="inline-flex items-center gap-1 rounded-full bg-teal-100 px-2.5 py-1 text-[11px] font-semibold text-teal-700">
            <Pill className="size-2.5" />
            {committedQuery}
          </span>
        )}

        {medicineAvailableInPharmacy === false && committedQuery && (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-1 text-[11px] font-semibold text-rose-600">
            ✗ {committedQuery}
          </span>
        )}
      </div>

      {/* Primary CTA — 56px tall, full width */}
      <button
        type="button"
        onClick={onNavigate}
        className="w-full flex items-center justify-center gap-2 rounded-2xl font-semibold text-white shadow-md active:opacity-80 touch-manipulation"
        style={{
          background: "linear-gradient(135deg,#0284c7,#0ea5e9)",
          minHeight: "56px",
        }}
      >
        <Navigation className="size-5" />
        <span className="text-[15px]">{t("patient.discover.destination")}</span>
      </button>

      <p className="text-center text-[11px] text-slate-400 mt-2">
        {t("patient.discover.swipeForDetails") || "Balayez ↑ pour plus de détails"}
      </p>
    </div>
  );
}

/* ─────────────────────────────────────────────────────── */
/*  Expanded mode (85vh) — full details + all actions      */
/* ─────────────────────────────────────────────────────── */

function ExpandedContent({
  pharmacy,
  committedQuery,
  medicineAvailableInPharmacy,
  onClose,
  onNavigate,
  bookingUrl,
  detailUrl,
  t,
}: {
  pharmacy: Pharmacy;
  committedQuery: string;
  medicineAvailableInPharmacy: boolean | null;
  onClose: () => void;
  onNavigate: () => void;
  bookingUrl: string;
  detailUrl: string;
  t: (key: string) => string;
}) {
  return (
    <div className="flex flex-col h-[calc(85vh-44px)]">
      {/* Fixed header */}
      <div className="flex-none px-4 pb-3 border-b border-slate-100">
        <div
          className={cn(
            "overflow-hidden rounded-2xl border shadow-sm",
            "border-teal-100 bg-gradient-to-br from-teal-50 to-white"
          )}
        >
          <div
            className="h-1.5 w-full"
            style={{ background: "linear-gradient(90deg,#059669,#10b981)" }}
          />
          <div className="flex items-start justify-between gap-3 p-4">
            <div className="flex items-start gap-3 min-w-0">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-teal-100">
                <Pill className="size-5 text-teal-600" />
              </div>
              <div className="min-w-0">
                <p className="text-[15px] font-bold leading-snug text-slate-900 truncate">
                  {pharmacy.name}
                </p>
                <p className="mt-0.5 text-[12px] text-slate-500 truncate">
                  {pharmacy.neighborhood ?? "Tanger"}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
                      pharmacy.isOnDuty
                        ? "bg-teal-100 text-teal-700"
                        : "bg-slate-100 text-slate-500"
                    )}
                  >
                    <span
                      className={cn(
                        "size-1.5 rounded-full",
                        pharmacy.isOnDuty ? "bg-teal-500" : "bg-slate-400"
                      )}
                    />
                    {pharmacy.isOnDuty ? t("patient.discover.openOnDuty") : t("patient.discover.closed")}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600">
                    <MapPin className="size-2.5" />
                    {formatDistance(pharmacy.distanceKm)}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="shrink-0 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-400 touch-manipulation"
              style={{ width: "44px", height: "44px" }}
            >
              <X className="size-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1 sheet-scroll">
        {/* Medicine unavailable alert */}
        {medicineAvailableInPharmacy === false && committedQuery && (
          <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 mb-2">
            <Pill className="size-3.5 shrink-0 translate-y-0.5 text-amber-500" />
            <p className="text-[12px] leading-snug text-amber-800">
              <span className="font-semibold">{committedQuery}</span>{" "}
              {t("patient.discover.notAvailableInPharmacy")}
            </p>
          </div>
        )}

        {/* Closed alert */}
        {medicineAvailableInPharmacy !== null && !pharmacy.isOnDuty && (
          <div className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 mb-2">
            <Clock className="size-3.5 shrink-0 translate-y-0.5 text-rose-400" />
            <p className="text-[12px] leading-snug text-rose-800">
              {t("patient.discover.currentlyClosed")}
            </p>
          </div>
        )}

        {/* Address */}
        {pharmacy.address && (
          <div className="flex items-start gap-3 rounded-xl px-1 py-2">
            <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-slate-100">
              <MapPin className="size-3.5 text-slate-500" />
            </div>
            <span className="mt-0.5 text-[13px] text-slate-700 leading-snug">{pharmacy.address}</span>
          </div>
        )}

        {/* Opening hours */}
        {pharmacy.openingHours && (
          <div className="flex items-center gap-3 rounded-xl px-1 py-2">
            <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-slate-100">
              <Clock className="size-3.5 text-slate-500" />
            </div>
            <span className="text-[13px] text-slate-700">{pharmacy.openingHours}</span>
          </div>
        )}

        {/* Available medicines */}
        {pharmacy.availableMedicines.length > 0 && (
          <div className="flex items-start gap-3 rounded-xl px-1 py-2">
            <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-teal-50">
              <Pill className="size-3.5 text-teal-600" />
            </div>
            <div className="flex flex-wrap gap-1">
              {pharmacy.availableMedicines.slice(0, 10).map((med) => (
                <span
                  key={med}
                  className={cn(
                    "rounded-full px-2.5 py-0.5 text-[11px] font-medium",
                    committedQuery && med.toLowerCase().includes(committedQuery.toLowerCase())
                      ? "bg-teal-100 text-teal-700"
                      : "bg-teal-50 text-teal-700"
                  )}
                >
                  {med}
                </span>
              ))}
              {pharmacy.availableMedicines.length > 10 && (
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] text-slate-500">
                  +{pharmacy.availableMedicines.length - 10}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Fixed footer — action buttons */}
      <div className="flex-none px-4 pt-3 border-t border-slate-100 pb-safe space-y-2.5">
        <button
          type="button"
          onClick={onNavigate}
          className="w-full flex items-center justify-center gap-2 rounded-2xl font-semibold text-white shadow-md active:opacity-80 touch-manipulation"
          style={{
            background: "linear-gradient(135deg,#0284c7,#0ea5e9)",
            minHeight: "56px",
          }}
        >
          <Navigation className="size-5" />
          <span className="text-[15px]">{t("patient.discover.destination")}</span>
        </button>

        <div className="grid grid-cols-2 gap-2.5">
          <Link
            href={bookingUrl}
            className="flex items-center justify-center gap-2 rounded-2xl font-semibold text-white shadow-md active:opacity-80 touch-manipulation"
            style={{
              background: "linear-gradient(135deg,#059669,#10b981)",
              minHeight: "48px",
            }}
          >
            <Calendar className="size-4" />
            <span className="text-sm">{t("patient.discover.book")}</span>
          </Link>

          <Link
            href={detailUrl}
            className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 font-semibold text-slate-700 hover:bg-slate-100 active:bg-slate-200 touch-manipulation"
            style={{ minHeight: "48px" }}
          >
            <Building2 className="size-4" />
            <span className="text-sm">{t("patient.discover.fullDetails")}</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
