"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Building2,
  Calendar,
  ChevronDown,
  Clock,
  MapPin,
  Menu,
  Navigation,
  Phone,
  Pill,
  Search,
  Stethoscope,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import type { HospitalDiscover, PharmacyDiscover } from "@/features/patient/types/discover/index";
import { cn } from "@/lib/utils";
import { SidebarDrawerContent } from "@/components/locatomed/patient-navbar";
import { TANGIER_CENTER } from "@/features/patient/constants/tangier";
import { calculateDistance, formatDistance } from "@/features/patient/utils/distance";
import { useI18n } from "@/components/locatomed/i18n-provider";
import { PharmacyBottomSheet } from "@/features/patient/components/discover/pharmacy-bottom-sheet";

const DiscoverMapLeaflet = dynamic(
  () =>
    import("@/features/patient/components/discover/discover-map-leaflet").then(
      (module) => module.DiscoverMapLeaflet
    ),
  { ssr: false }
);

type PatientInfo = {
  name: string;
  email: string;
};

type Props = {
  view: "hospitals" | "pharmacies";
  hospitals: HospitalDiscover[];
  pharmacies: PharmacyDiscover[];
  allMedicineNames: string[];
  selectedType: string;
  pharmacyFilter?: "all" | "on-duty";
  radiusKm?: number;
  query?: string;
  patient?: PatientInfo;
};



type RadiusOption = {
  value: number;
  label?: string;
  labelKey?: string;
};

const RADIUS_OPTIONS: RadiusOption[] = [
  { value: 0, labelKey: "patient.discover.allTangier" },
  { value: 2, label: "2 km" },
  { value: 5, label: "5 km" },
  { value: 10, label: "10 km" },
  { value: 15, label: "15 km" },
  { value: 20, label: "20 km" },
];

const AUTO_RADIUS_STEPS = [1, 2, 5, 10, 15, 20] as const;

export function DiscoverClient({
  view,
  hospitals,
  pharmacies,
  allMedicineNames,
  selectedType,
  pharmacyFilter = "all",
  radiusKm = 0,
  query = "",
  patient,
}: Props) {
  const { t } = useI18n();
  const router = useRouter();
  const [, startTransition] = useTransition();

  const HOSPITAL_TYPES = [
    { value: "", label: t("patient.discover.allTypes") },
    { value: "public", label: t("patient.discover.typePublic") },
    { value: "private", label: t("patient.discover.typePrivate") },
    { value: "chu", label: t("patient.discover.typeChu") },
  ];

  const PHARMACY_FILTERS = [
    { value: "all", label: t("patient.discover.allPharmacies") },
    { value: "on-duty", label: t("patient.discover.onDutyPharmacies") },
  ] as const;

  const [localQuery, setLocalQuery] = useState(query);
  // committedQuery is set only when the user explicitly selects a suggestion or
  // submits the form — direction line is gated on this, not on live keystrokes
  const [committedQuery, setCommittedQuery] = useState(query);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [typeOpen, setTypeOpen] = useState(false);
  const [pharmacyFilterOpen, setPharmacyFilterOpen] = useState(false);
  const [radiusOpen, setRadiusOpen] = useState(false);
  const [localPharmacyFilter, setLocalPharmacyFilter] = useState<"all" | "on-duty">(pharmacyFilter);
  const [localRadiusKm, setLocalRadiusKm] = useState(radiusKm);
  const [userLocation, setUserLocation] = useState(TANGIER_CENTER);
  // Ref so the auto-select effect always reads the latest location without
  // re-running every time watchPosition fires a new coordinate.
  const userLocationRef = useRef(TANGIER_CENTER);
  userLocationRef.current = userLocation;
  const [locationAccuracyM, setLocationAccuracyM] = useState<number | null>(null);
  const [directionTarget, setDirectionTarget] = useState<{ lat: number; lng: number } | null>(null);
  const [locationSource, setLocationSource] = useState<"fallback" | "device">("fallback");
  const [locationDenied, setLocationDenied] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // drag-to-dismiss state (hospital sheet only)
  const [dragY, setDragY] = useState(0);
  const [startY, setStartY] = useState<number | null>(null);

  // pharmacy sheet expansion (35vh compact ↔ 85vh expanded)
  const [sheetExpanded, setSheetExpanded] = useState(false);

  const normalizedQuery = localQuery.trim().toLowerCase();
  const committedNormalized = committedQuery.trim().toLowerCase();

  // Suggestions filtered by current input — only shown in pharmacy view.
  // allMedicineNames comes from the server (full catalogue, stock > 0) so it never
  // shrinks after the first search the way a derived-from-pharmacies set would.
  const medicineSuggestions = useMemo(() => {
    if (view !== "pharmacies" || !localQuery.trim()) return [];
    const q = localQuery.trim().toLowerCase();
    return allMedicineNames.filter((name) => name.toLowerCase().includes(q)).slice(0, 8);
  }, [allMedicineNames, localQuery, view]);

  useEffect(() => {
    if (!navigator.geolocation) return;

    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 5000,
    };

    const handleSuccess = (position: GeolocationPosition) => {
      setUserLocation({
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      });
      setLocationAccuracyM(position.coords.accuracy);
      setLocationSource("device");
      setLocationDenied(false);
    };

    const handleError = (error: GeolocationPositionError) => {
      if (error.code === error.PERMISSION_DENIED) {
        setLocationDenied(true);
      }
    };

    navigator.geolocation.getCurrentPosition(handleSuccess, handleError, options);
    const watchId = navigator.geolocation.watchPosition(handleSuccess, handleError, options);

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  // When the user commits a medicine search, automatically find and select the
  // best pharmacy across the full dataset: on-duty first, then closest, then
  // medicine available. The route draws automatically via the selectedPharmacy effect.
  useEffect(() => {
    if (view !== "pharmacies" || !committedNormalized) {
      setSelectedId(null);
      setSheetExpanded(false);
      return;
    }

    const loc = userLocationRef.current;
    const best = pharmacies
      .map((p) => ({
        ...p,
        distanceKm: calculateDistance(loc.lat, loc.lng, p.lat, p.lng),
      }))
      .filter((p) =>
        p.availableMedicines.some((m) => m.toLowerCase().includes(committedNormalized))
      )
      .sort((a, b) => {
        // on-duty first, then closest
        if (a.isOnDuty !== b.isOnDuty) return a.isOnDuty ? -1 : 1;
        return a.distanceKm - b.distanceKm;
      })[0] ?? null;

    if (!best) return;
    setSelectedId(best.id);
  }, [committedNormalized, view, pharmacies]); // eslint-disable-line react-hooks/exhaustive-deps

  const filteredHospitals = useMemo(
    () =>
      hospitals.filter((h) => {
        const matchesQuery =
          !normalizedQuery ||
          h.name.toLowerCase().includes(normalizedQuery) ||
          h.address.toLowerCase().includes(normalizedQuery);
        if (!matchesQuery) return false;
        if (localRadiusKm > 0) {
          const distanceKm = calculateDistance(userLocation.lat, userLocation.lng, h.lat, h.lng);
          if (distanceKm > localRadiusKm) return false;
        }
        return true;
      }),
    [hospitals, normalizedQuery, localRadiusKm, userLocation]
  );

  const pharmaciesMatchingQuery = useMemo(
    () =>
      pharmacies.filter((p) => {
        if (localPharmacyFilter === "on-duty" && !p.isOnDuty) return false;
        return true;
      }),
    [pharmacies, localPharmacyFilter]
  );

  const pharmaciesWithDistance = useMemo(
    () =>
      pharmaciesMatchingQuery
        .map((pharmacy) => ({
          ...pharmacy,
          distanceKm: calculateDistance(userLocation.lat, userLocation.lng, pharmacy.lat, pharmacy.lng),
        }))
        .sort((a, b) => {
          if (a.isOnDuty !== b.isOnDuty) return a.isOnDuty ? -1 : 1;
          return a.distanceKm - b.distanceKm;
        }),
    [pharmaciesMatchingQuery, userLocation]
  );

  const autoRadiusKm = useMemo(() => {
    if (pharmaciesWithDistance.length === 0) return AUTO_RADIUS_STEPS[0];
    for (const step of AUTO_RADIUS_STEPS) {
      if (pharmaciesWithDistance.some((pharmacy) => pharmacy.distanceKm <= step)) return step;
    }
    return Math.ceil(pharmaciesWithDistance[0].distanceKm);
  }, [pharmaciesWithDistance]);

  const effectivePharmacyRadiusKm = view === "pharmacies"
    ? (localRadiusKm > 0 ? localRadiusKm : autoRadiusKm)
    : localRadiusKm;

  const visiblePharmacies = useMemo(
    () => pharmaciesWithDistance.filter((pharmacy) => pharmacy.distanceKm <= effectivePharmacyRadiusKm),
    [pharmaciesWithDistance, effectivePharmacyRadiusKm]
  );

  const nearestQualifiedPharmacy = useMemo(() => {
    if (!committedNormalized) return null;
    return (
      visiblePharmacies.find(
        (p) =>
          p.isOnDuty &&
          p.availableMedicines.some((m) => m.toLowerCase().includes(committedNormalized))
      ) ?? null
    );
  }, [visiblePharmacies, committedNormalized]);

  const points = view === "hospitals" ? filteredHospitals : visiblePharmacies;
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selectedHospital = useMemo(
    () => (view === "hospitals" && selectedId ? hospitals.find((h) => h.id === selectedId) ?? null : null),
    [view, selectedId, hospitals]
  );
  const selectedPharmacy = useMemo(
    () =>
      view === "pharmacies" && selectedId
        ? visiblePharmacies.find((p) => p.id === selectedId) ?? null
        : null,
    [view, selectedId, visiblePharmacies]
  );
  const activeSelectedId = selectedHospital?.id ?? selectedPharmacy?.id ?? null;

  // Auto-show route whenever the user selects a marker.
  // Look up the pharmacy in the full (unfiltered) list so the route draws
  // even when the auto-selected pharmacy sits outside the current visible radius.
  useEffect(() => {
    if (view === "pharmacies" && selectedId) {
      const pharmacy = pharmacies.find((p) => p.id === selectedId);
      if (pharmacy) {
        setDirectionTarget({ lat: pharmacy.lat, lng: pharmacy.lng });
        return;
      }
    }
    if (selectedHospital) {
      setDirectionTarget({ lat: selectedHospital.lat, lng: selectedHospital.lng });
      return;
    }
    setDirectionTarget(null);
  }, [view, selectedId, pharmacies, selectedHospital]);

  const selectedPharmacyDistanceKm = selectedPharmacy?.distanceKm ?? null;

  // Availability status for the selected pharmacy — only meaningful when the
  // user has committed a medicine query.  null = "no query, don't show status".
  const medicineAvailableInPharmacy =
    selectedPharmacy && committedNormalized
      ? selectedPharmacy.availableMedicines.some((m) =>
          m.toLowerCase().includes(committedNormalized)
        )
      : null;

  // Hospital sheet uses the legacy full-height slide-up panel.
  // Pharmacy sheet uses the new PWA compact PharmacyBottomSheet.
  const sheetOpen = selectedHospital !== null;

  const bookingUrl = activeSelectedId
    ? view === "hospitals"
      ? `/patient/booking?hospitalId=${activeSelectedId}`
      : `/patient/booking?pharmacyId=${activeSelectedId}`
    : "#";

  const detailUrl = activeSelectedId
    ? view === "hospitals"
      ? `/patient/hospital/${activeSelectedId}`
      : `/patient/pharmacy/${activeSelectedId}`
    : "#";

  function navigate(params: Record<string, string>) {
    const nextView = (params.view as "hospitals" | "pharmacies" | undefined) ?? view;
    const nextType = params.type ?? selectedType;
    const nextQuery = params.q ?? localQuery;
    const nextPharmacyFilter =
      (params.pharmacy as "all" | "on-duty" | "" | undefined) ?? localPharmacyFilter;
    const nextRadiusKm =
      params.radius !== undefined ? Number(params.radius || 0) : localRadiusKm;

    const sp = new URLSearchParams();
    sp.set("view", nextView);

    if (nextView === "hospitals" && nextType) {
      sp.set("type", nextType);
    }

    if (nextView === "pharmacies" && nextPharmacyFilter && nextPharmacyFilter !== "all") {
      sp.set("pharmacy", nextPharmacyFilter);
    }

    if (Number.isFinite(nextRadiusKm) && nextRadiusKm > 0) {
      sp.set("radius", String(nextRadiusKm));
    }

    if (nextQuery) {
      sp.set("q", nextQuery);
    }

    startTransition(() => router.push(`/patient/discover?${sp.toString()}`));
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setSuggestionsOpen(false);
    setCommittedQuery(localQuery);
    setSelectedId(null);
    setSheetExpanded(false);
    navigate({ q: localQuery });
  }

  function applySuggestion(name: string) {
    setLocalQuery(name);
    setSuggestionsOpen(false);
    setCommittedQuery(name);
    setSelectedId(null);
    setSheetExpanded(false);
    navigate({ q: name });
  }

  function handleViewSwitch(next: "hospitals" | "pharmacies") {
    setTypeOpen(false);
    setPharmacyFilterOpen(false);
    setRadiusOpen(false);
    setSelectedId(null);
    setSheetExpanded(false);
    setDirectionTarget(null);

    if (next === "hospitals") {
      setLocalPharmacyFilter("all");
      navigate({ view: next, pharmacy: "" });
      return;
    }

    setLocalPharmacyFilter("all");
    navigate({ view: next, type: "", pharmacy: "" });
  }

  function handleTypeSelect(t: string) {
    setTypeOpen(false);
    navigate({ type: t });
  }

  function handlePharmacyFilterSelect(filter: "all" | "on-duty") {
    setPharmacyFilterOpen(false);
    setLocalPharmacyFilter(filter);
    navigate({ pharmacy: filter === "all" ? "" : filter });
  }

  function handleRadiusSelect(radius: number) {
    setRadiusOpen(false);
    setLocalRadiusKm(radius);
    navigate({ radius: radius > 0 ? String(radius) : "" });
  }

  function handleMapZoomRadiusChange(nextRadiusKm: number) {
    setLocalRadiusKm((prev) => (prev === nextRadiusKm ? prev : nextRadiusKm));
  }

  function handleShowRouteInMap() {
    if (view === "pharmacies" && selectedId) {
      const pharmacy = pharmacies.find((p) => p.id === selectedId);
      if (pharmacy) {
        setDirectionTarget({ lat: pharmacy.lat, lng: pharmacy.lng });
        return;
      }
    }
    if (selectedHospital) {
      setDirectionTarget({ lat: selectedHospital.lat, lng: selectedHospital.lng });
    }
  }

  function handleTouchStart(e: React.TouchEvent) {
    setStartY(e.touches[0].clientY);
  }

  function handleTouchMove(e: React.TouchEvent) {
    if (startY === null) return;
    const delta = e.touches[0].clientY - startY;
    if (delta > 0) setDragY(delta);
  }

  function handleTouchEnd() {
    if (dragY > 80) setSelectedId(null);
    setDragY(0);
    setStartY(null);
  }

  const activeTypeLabel =
    HOSPITAL_TYPES.find((type) => type.value === selectedType)?.label ?? t("patient.discover.typeHospital");

  const activePharmacyLabel =
    PHARMACY_FILTERS.find((f) => f.value === localPharmacyFilter)?.label ??
    t("patient.discover.allPharmacies");

  const activeRadiusLabel =
    view === "pharmacies" && localRadiusKm === 0
      ? `${t("patient.discover.autoRadius")} (${effectivePharmacyRadiusKm} km)`
      : (() => {
          const selectedOption = RADIUS_OPTIONS.find((option) => option.value === localRadiusKm);
          if (selectedOption?.labelKey) return t(selectedOption.labelKey);
          return selectedOption?.label;
        })() ??
        `${localRadiusKm} km`;

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-slate-100">
      {/* ══════════════════════════════════════════════════
          NAVBAR — Logo | Search (center) | Hamburger
      ══════════════════════════════════════════════════ */}
      <header className="relative z-[1000] grid h-16 shrink-0 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 border-b border-slate-200/80 bg-white/95 px-3 backdrop-blur-sm sm:px-4">
        {/* Left — App Logo */}
        <Link
          href="/patient/dashboard"
          className="group inline-flex h-10 shrink-0 items-center justify-center transition-transform hover:scale-[1.02]"
        >
          <div className="flex size-8 items-center justify-center overflow-hidden transition-transform group-hover:scale-105">
            {/* TODO: replace with <img src="/logo-locatomed.png" /> */}
            <span style={{ fontFamily: "serif", fontWeight: "bold", color: "#14b8a6" }}>LOCATOMED</span>
          </div>
          <span className="sr-only">LOCATOMED</span>
        </Link>

        {/* Center — Search bar */}
        <form
          onSubmit={handleSearch}
          className="relative flex min-w-0 flex-col"
        >
          <div className="flex h-10 w-full items-center gap-2 rounded-2xl border border-teal-300/70 bg-white px-3 shadow-[0_1px_0_rgba(15,23,42,0.03),0_8px_20px_rgba(15,23,42,0.06)] transition-all focus-within:border-teal-500 focus-within:ring-2 focus-within:ring-teal-100">
            <Search className="size-4 shrink-0 text-slate-400" />
            <input
              type="text"
              value={localQuery}
              onChange={(e) => {
                setLocalQuery(e.target.value);
                setSuggestionsOpen(true);
              }}
              onFocus={() => {
                if (localQuery.trim()) setSuggestionsOpen(true);
              }}
              placeholder={
                view === "hospitals"
                  ? t("patient.discover.searchHospital")
                  : t("patient.discover.searchMedicine")
              }
              className="h-full flex-1 bg-transparent text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none"
            />
            {localQuery && (
              <button
                type="button"
                onClick={() => { setLocalQuery(""); setSuggestionsOpen(false); setSelectedId(null); navigate({ q: "" }); }}
                className="rounded-md p-0.5 text-slate-400 transition-colors hover:text-slate-600"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          {/* Medicine autocomplete dropdown */}
          {suggestionsOpen && medicineSuggestions.length > 0 && (
            <div className="absolute left-0 right-0 top-full z-[1100] mt-1.5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
              {medicineSuggestions.map((name) => (
                <button
                  key={name}
                  type="button"
                  onMouseDown={(e) => {
                    // onMouseDown fires before onBlur so the click is captured
                    e.preventDefault();
                    applySuggestion(name);
                  }}
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-slate-700 transition-colors hover:bg-teal-50 hover:text-teal-700"
                >
                  <Pill className="size-3.5 shrink-0 text-slate-400" />
                  {name}
                </button>
              ))}
            </div>
          )}
        </form>

        {/* Right — Hamburger + Navigation drawer */}
        <div className="flex shrink-0 items-center justify-end">
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-10 rounded-xl border border-slate-200 bg-white shadow-sm hover:bg-slate-50"
                />
              }
            >
              <Menu className="size-4" />
              <span className="sr-only">{t("patient.discover.menu")}</span>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 px-5 py-6">
              <SheetHeader>
                <SheetTitle className="sr-only">{t("patient.nav.navigation")}</SheetTitle>
                <SheetDescription className="sr-only">{t("patient.nav.webAria")}</SheetDescription>
              </SheetHeader>
              <SidebarDrawerContent
                patient={patient ?? { name: "LOCATOMED", email: "" }}
                onNavigate={() => setMenuOpen(false)}
              />
            </SheetContent>
          </Sheet>
        </div>
      </header>

      {/* ══════════════════════════════════════════════════
          MAP — fills remaining height
      ══════════════════════════════════════════════════ */}
      <div className="relative flex-1 overflow-hidden">
        {/* Full map */}
        <div className="absolute inset-0">
          <DiscoverMapLeaflet
            view={view}
            hospitals={filteredHospitals}
            pharmacies={visiblePharmacies}
            selectedId={selectedId}
            nearestId={view === "pharmacies" ? nearestQualifiedPharmacy?.id ?? null : null}
            userLocation={userLocation}
            locationAccuracyM={locationAccuracyM}
            radiusKm={view === "pharmacies" ? effectivePharmacyRadiusKm : localRadiusKm}
            directionTarget={directionTarget}
            sheetHeightVh={selectedPharmacy ? (sheetExpanded ? 85 : 35) : 0}
            onSelect={setSelectedId}
            onZoomRadiusChange={handleMapZoomRadiusChange}
          />
        </div>

        {/* ── Category chips + type filter overlay ── */}
        <div className="pointer-events-none absolute inset-x-0 top-3 z-[900] flex justify-start px-3">
          <div className="pointer-events-auto flex flex-wrap items-center gap-2">
            {/* Hôpitaux */}
            <button
              type="button"
              onClick={() => handleViewSwitch("hospitals")}
              className={cn(
                "flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium shadow-md transition-all",
                view === "hospitals"
                  ? "border-teal-500 bg-teal-500 text-white"
                  : "border-transparent bg-white/95 text-slate-700 hover:bg-white"
              )}
            >
              <Building2 className="size-4" />
              {t("patient.discover.hospitals")}
            </button>

            {/* Pharmacies */}
            <button
              type="button"
              onClick={() => handleViewSwitch("pharmacies")}
              className={cn(
                "flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium shadow-md transition-all",
                view === "pharmacies"
                  ? "border-teal-500 bg-teal-500 text-white"
                  : "border-transparent bg-white/95 text-slate-700 hover:bg-white"
              )}
            >
              <Pill className="size-4" />
              {t("patient.discover.pharmacies")}
            </button>

            {/* Type sub-filter — Hôpitaux only */}
            {view === "hospitals" && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setRadiusOpen(false);
                    setPharmacyFilterOpen(false);
                    setTypeOpen((open) => !open);
                  }}
                  className={cn(
                    "flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium shadow-md transition-all",
                    selectedType
                      ? "border-teal-400 bg-white text-teal-700 ring-1 ring-teal-300"
                      : "border-transparent bg-white/95 text-slate-700 hover:bg-white"
                  )}
                >
                  {activeTypeLabel}
                  <ChevronDown
                    className={cn(
                      "size-3.5 transition-transform duration-200",
                      typeOpen && "rotate-180"
                    )}
                  />
                </button>

                {typeOpen && (
                  <div className="absolute left-0 top-full z-10 mt-1.5 min-w-[160px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
                    {HOSPITAL_TYPES.map((ht) => (
                      <button
                        key={ht.value}
                        type="button"
                        onClick={() => handleTypeSelect(ht.value)}
                        className={cn(
                          "flex w-full items-center px-4 py-2.5 text-sm transition-colors",
                          selectedType === ht.value
                            ? "bg-teal-50 font-semibold text-teal-700"
                            : "text-slate-700 hover:bg-slate-50"
                        )}
                      >
                        {ht.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Pharmacy sub-filter — Pharmacies only */}
            {view === "pharmacies" && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setTypeOpen(false);
                    setRadiusOpen(false);
                    setPharmacyFilterOpen((open) => !open);
                  }}
                  className={cn(
                    "flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium shadow-md transition-all",
                    localPharmacyFilter !== "all"
                      ? "border-teal-400 bg-white text-teal-700 ring-1 ring-teal-300"
                      : "border-transparent bg-white/95 text-slate-700 hover:bg-white"
                  )}
                >
                  {activePharmacyLabel}
                  <ChevronDown
                    className={cn(
                      "size-3.5 transition-transform duration-200",
                      pharmacyFilterOpen && "rotate-180"
                    )}
                  />
                </button>

                {pharmacyFilterOpen && (
                  <div className="absolute left-0 top-full z-10 mt-1.5 min-w-[220px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
                    {PHARMACY_FILTERS.map((filter) => (
                      <button
                        key={filter.value}
                        type="button"
                        onClick={() => handlePharmacyFilterSelect(filter.value)}
                        className={cn(
                          "flex w-full items-center px-4 py-2.5 text-left text-sm transition-colors",
                          localPharmacyFilter === filter.value
                            ? "bg-teal-50 font-semibold text-teal-700"
                            : "text-slate-700 hover:bg-slate-50"
                        )}
                      >
                        {filter.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Radius selector button — Both views */}
            {
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setTypeOpen(false);
                    setPharmacyFilterOpen(false);
                    setRadiusOpen((open) => !open);
                  }}
                  className={cn(
                    "flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium shadow-md transition-all",
                    localRadiusKm > 0
                      ? "border-teal-400 bg-white text-teal-700 ring-1 ring-teal-300"
                      : "border-transparent bg-white/95 text-slate-700 hover:bg-white"
                  )}
                >
                  {t("patient.discover.radius")}: {activeRadiusLabel}
                  <ChevronDown
                    className={cn(
                      "size-3.5 transition-transform duration-200",
                      radiusOpen && "rotate-180"
                    )}
                  />
                </button>

                {radiusOpen && (
                  <div className="absolute left-0 top-full z-10 mt-1.5 min-w-[180px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
                    {RADIUS_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => handleRadiusSelect(option.value)}
                        className={cn(
                          "flex w-full items-center px-4 py-2.5 text-left text-sm transition-colors",
                          localRadiusKm === option.value
                            ? "bg-teal-50 font-semibold text-teal-700"
                            : "text-slate-700 hover:bg-slate-50"
                        )}
                      >
                        {option.labelKey ? t(option.labelKey) : option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            }
          </div>
        </div>

        {/* ── Results count badge (only when sheet is closed) ── */}
        {!sheetOpen && (
          <div className="absolute bottom-6 left-3 z-[850] flex flex-col gap-2">
            <div className="pointer-events-none flex items-center gap-1.5 rounded-full border border-slate-200 bg-white/95 px-3 py-1.5 text-xs text-slate-700 shadow-md backdrop-blur-sm">
              <MapPin className="size-3 text-teal-600" />
              {`${points.length} ${points.length !== 1 ? t("patient.discover.results") : t("patient.discover.result")}`}
            </div>

            {view === "pharmacies" && nearestQualifiedPharmacy && (
              <button
                type="button"
                onClick={() => setSelectedId(nearestQualifiedPharmacy.id)}
                className="pointer-events-auto flex items-center gap-1.5 rounded-full border border-teal-200 bg-white/95 px-3 py-1.5 text-xs text-teal-700 shadow-md backdrop-blur-sm transition-colors hover:bg-teal-50"
              >
                <Pill className="size-3" />
                {t("patient.discover.closest")}: {nearestQualifiedPharmacy.name} · {formatDistance(nearestQualifiedPharmacy.distanceKm)}
              </button>
            )}

            {view === "pharmacies" && (
              <div className="pointer-events-none rounded-full border border-slate-200 bg-white/95 px-3 py-1.5 text-[11px] text-slate-500 shadow-md backdrop-blur-sm">
                {locationSource === "device"
                  ? `${t("patient.discover.livePosition")}${locationAccuracyM ? ` (±${Math.round(locationAccuracyM)}m)` : ""} · ${t("patient.discover.radius")} ${effectivePharmacyRadiusKm} km`
                  : locationDenied
                    ? `${t("patient.discover.deniedLocation")} · ${t("patient.discover.radius")} ${effectivePharmacyRadiusKm} km`
                    : `${t("patient.discover.fallbackLocation")} · ${t("patient.discover.radius")} ${effectivePharmacyRadiusKm} km`}
              </div>
            )}
          </div>
        )}

        {/* Close dropdowns on outside click */}
        {(typeOpen || pharmacyFilterOpen || radiusOpen || suggestionsOpen) && (
          <div
            className="fixed inset-0 z-[5]"
            onClick={() => {
              setTypeOpen(false);
              setPharmacyFilterOpen(false);
              setRadiusOpen(false);
              setSuggestionsOpen(false);
            }}
          />
        )}

        {/* ══════════════════════════════════════════════════
            HOSPITAL BOTTOM SHEET — legacy full-height slide-up
        ══════════════════════════════════════════════════ */}
        {selectedHospital && (
          <div
            className={cn(
              "absolute bottom-0 left-0 right-0 z-[1000] rounded-t-[28px] bg-white shadow-[0_-8px_40px_rgba(0,0,0,0.18)] transition-transform duration-300 ease-out",
              sheetOpen ? "translate-y-0" : "translate-y-full"
            )}
            style={dragY > 0 ? { transform: `translateY(${dragY}px)`, transition: "none" } : undefined}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* Drag handle */}
            <div className="flex cursor-grab justify-center pb-2 pt-3 active:cursor-grabbing">
              <div className="h-1.5 w-12 rounded-full bg-slate-200" />
            </div>

            {/* Card header */}
            <div className="px-4 pb-3 pt-1">
              <div className="overflow-hidden rounded-2xl border border-teal-100 bg-gradient-to-br from-teal-50 to-white shadow-sm">
                <div
                  className="h-1.5 w-full"
                  style={{ background: "linear-gradient(90deg,#3b82f6,#6366f1)" }}
                />
                <div className="flex items-start justify-between gap-3 p-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-teal-100">
                      <Building2 className="size-5 text-teal-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[15px] font-bold leading-snug text-slate-900 truncate">
                        {selectedHospital.name}
                      </p>
                      <p className="mt-0.5 text-[12px] text-slate-500 truncate">
                        {selectedHospital.address}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        <span className="inline-flex items-center gap-1 rounded-full bg-teal-100 px-2.5 py-0.5 text-[11px] font-semibold text-teal-700">
                          <Building2 className="size-2.5" />
                          {selectedHospital.type === "chu"
                            ? "CHU"
                            : selectedHospital.type === "public"
                            ? t("patient.discover.typePublic")
                            : t("patient.discover.typePrivate")}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedId(null)}
                    className="shrink-0 rounded-full bg-slate-100 p-1.5 text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-600"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Detail rows */}
            <div className="space-y-1 px-4 pb-2">
              {selectedHospital.address && (
                <div className="flex items-start gap-3 rounded-xl px-1 py-2">
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-slate-100">
                    <MapPin className="size-3.5 text-slate-500" />
                  </div>
                  <span className="mt-0.5 text-[13px] text-slate-700 leading-snug">{selectedHospital.address}</span>
                </div>
              )}
              {selectedHospital.phone && (
                <div className="flex items-center gap-3 rounded-xl px-1 py-2">
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-slate-100">
                    <Phone className="size-3.5 text-slate-500" />
                  </div>
                  <a href={`tel:${selectedHospital.phone}`} className="text-[13px] text-teal-600 hover:underline">
                    {selectedHospital.phone}
                  </a>
                </div>
              )}
              {selectedHospital.specialties && selectedHospital.specialties.length > 0 && (
                <div className="flex items-start gap-3 rounded-xl px-1 py-2">
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-slate-100">
                    <Stethoscope className="size-3.5 text-slate-500" />
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {selectedHospital.specialties.slice(0, 5).map((s) => (
                      <span key={s} className="rounded-full bg-teal-50 px-2.5 py-0.5 text-[11px] font-medium text-teal-700">
                        {s}
                      </span>
                    ))}
                    {selectedHospital.specialties.length > 5 && (
                      <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] text-slate-500">
                        +{selectedHospital.specialties.length - 5}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-3 px-4 pb-7 pt-3">
              <button
                type="button"
                onClick={handleShowRouteInMap}
                className="flex items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-semibold text-white shadow-md transition-opacity hover:opacity-90 active:opacity-80"
                style={{ background: "linear-gradient(135deg,#3b82f6,#6366f1)" }}
              >
                <Navigation className="size-4" />
                {t("patient.discover.directions")}
              </button>
              <Link
                href={bookingUrl}
                className="flex items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-semibold text-white shadow-md transition-opacity hover:opacity-90 active:opacity-80"
                style={{ background: "linear-gradient(135deg,#059669,#10b981)" }}
              >
                <Calendar className="size-4" />
                {t("patient.discover.book")}
              </Link>
              <Link
                href={detailUrl}
                className="col-span-2 flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 active:bg-slate-200"
              >
                {t("patient.discover.fullDetails")}
              </Link>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════
            PHARMACY BOTTOM SHEET — PWA compact (35 / 85vh)
        ══════════════════════════════════════════════════ */}
        {selectedPharmacy && (
          <PharmacyBottomSheet
            pharmacy={selectedPharmacy}
            committedQuery={committedQuery}
            medicineAvailableInPharmacy={medicineAvailableInPharmacy}
            isExpanded={sheetExpanded}
            onExpand={() => setSheetExpanded(true)}
            onCollapse={() => setSheetExpanded(false)}
            onClose={() => { setSelectedId(null); setSheetExpanded(false); }}
            onNavigate={handleShowRouteInMap}
          />
        )}
      </div>
    </div>
  );
}
