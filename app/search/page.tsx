"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PharmacyCard } from "@/components/locatomed/pharmacy-card";
import {
  searchMedicines,
  findPharmaciesWithStock,
} from "@/lib/actions/medicine-search-actions";
import type { PharmacyWithStock } from "@/lib/actions/medicine-search-actions";
import { Search, Pill, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

// Map is client-only (Leaflet needs window)
const PharmacyMap = dynamic(() => import("@/components/locatomed/pharmacy-map"), { ssr: false });

type Medicine = Awaited<ReturnType<typeof searchMedicines>>[number];

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Medicine[]>([]);
  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null);
  const [pharmacies, setPharmacies] = useState<PharmacyWithStock[]>([]);
  const [selectedPharmacyId, setSelectedPharmacyId] = useState<string | null>(null);
  const [loadingSearch, startSearch] = useTransition();
  const [loadingStock, startStock] = useTransition();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced autocomplete
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }
    debounceRef.current = setTimeout(() => {
      startSearch(async () => {
        const results = await searchMedicines(query);
        setSuggestions(results);
      });
    }, 250);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  function selectMedicine(med: Medicine) {
    setSelectedMedicine(med);
    setQuery(med.name);
    setSuggestions([]);
    setSelectedPharmacyId(null);

    startStock(async () => {
      const results = await findPharmaciesWithStock(med.id);
      setPharmacies(results);
    });
  }

  function clearSelection() {
    setSelectedMedicine(null);
    setQuery("");
    setSuggestions([]);
    setPharmacies([]);
    setSelectedPharmacyId(null);
  }

  const inStockCount = pharmacies.filter((p) => p.status !== "out_of_stock").length;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-black/5 shadow-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 h-16">
          <div className="flex items-center gap-4">
            <Link href="/" className="p-2 hover:bg-black/5 rounded-full transition-colors flex items-center justify-center">
              <ArrowLeft className="h-5 w-5 text-gray-700" />
            </Link>
            <Link href="/" className="flex items-center">
              <img
                src="/logo-locatomed.png"
                alt="LocatMed"
                className="h-12 w-auto object-contain"
              />
            </Link>
          </div>
          <span className="text-gray-500 font-medium text-sm hidden sm:block">Trouver un médicament</span>
        </div>
      </header>

      {/* Main Dashboard Layout */}
      <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-[#0f1113]">
        {/* Left: Map Area */}
        <div className="flex-1 relative">
          <PharmacyMap
            pharmacies={pharmacies}
            selectedId={selectedPharmacyId}
            onSelect={setSelectedPharmacyId}
          />

          {/* Floating Search Bar (Top Center) */}
          <div className="absolute top-8 left-1/2 -translate-x-1/2 z-[400] w-full max-w-xl px-4">
            <SearchBox
              query={query}
              setQuery={(q) => {
                setQuery(q);
                if (selectedMedicine && q !== selectedMedicine.name) clearSelection();
              }}
              suggestions={suggestions}
              onSelect={selectMedicine}
              isLoading={loadingSearch}
              large={!selectedMedicine}
            />
          </div>

          {/* Emergency SOS Button (Bottom Right) */}
          <button className="absolute bottom-8 right-8 z-[400] bg-red-600 hover:bg-red-500 text-white px-6 py-3 rounded-full flex items-center gap-2 font-black uppercase text-xs tracking-widest shadow-[0_0_30px_rgba(220,38,38,0.4)] transition-all hover:scale-105 active:scale-95">
            <div className="h-2 w-2 rounded-full bg-white animate-pulse" />
            Emergency SOS
          </button>
        </div>

        {/* Right: Dark Sidebar */}
        <div className="w-[450px] bg-[#0f1113] border-l border-white/5 flex flex-col">
          {/* Sidebar Header */}
          <div className="p-6 border-b border-white/5 bg-[#1A1D1F]/50">
            {selectedMedicine ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black text-teal-500 uppercase tracking-widest">Current Search</p>
                    <h2 className="text-3xl font-black text-white tracking-tighter">{selectedMedicine.name}</h2>
                    <p className="text-xs font-bold text-gray-500">{selectedMedicine.activeIngredient}</p>
                  </div>
                  <div className="h-12 w-12 rounded-2xl bg-teal-500/10 flex items-center justify-center">
                    <Pill className="h-6 w-6 text-teal-500" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Badge variant="outline" className="bg-white/5 border-white/10 text-gray-400 text-[10px] font-bold">
                    {inStockCount} Found
                  </Badge>
                  <Badge variant="outline" className="bg-white/5 border-white/10 text-gray-400 text-[10px] font-bold">
                    Tanger Region
                  </Badge>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto">
                  <Search className="h-8 w-8 text-gray-600" />
                </div>
                <p className="text-gray-400 font-bold uppercase text-xs tracking-widest">Select a medicine to see results</p>
              </div>
            )}
          </div>

          {/* Sidebar Content (Results List) */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
            {loadingStock ? (
              <div className="py-20 text-center space-y-4">
                <div className="h-10 w-10 border-4 border-teal-500/20 border-t-teal-500 rounded-full animate-spin mx-auto" />
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Syncing Stock Data...</p>
              </div>
            ) : pharmacies.length === 0 && selectedMedicine ? (
              <div className="py-20 text-center space-y-4 px-8">
                <p className="text-white font-bold">No pharmacies found</p>
                <p className="text-xs text-gray-500">We couldn't find any stock for this medicine in Tanger at the moment.</p>
              </div>
            ) : (
              pharmacies.map((p) => (
                <PharmacyCard
                  key={p.pharmacyId}
                  pharmacy={p}
                  medicineId={selectedMedicine?.id || ""}
                  medicineName={selectedMedicine?.name || ""}
                  isSelected={selectedPharmacyId === p.pharmacyId}
                  onClick={() => setSelectedPharmacyId(p.pharmacyId)}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Search box sub-component ─────────────────────────────────────────────────

function SearchBox({
  query,
  setQuery,
  suggestions,
  onSelect,
  isLoading,
  large,
}: {
  query: string;
  setQuery: (q: string) => void;
  suggestions: Medicine[];
  onSelect: (med: Medicine) => void;
  isLoading: boolean;
  large?: boolean;
}) {
  return (
    <div className={`relative ${large ? "mx-auto max-w-xl w-full" : "w-full"}`}>
      <div className="relative group">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-6 w-6 text-gray-400 transition-colors group-focus-within:text-teal-500" />
        <Input
          placeholder="Rechercher un médicament (ex: Doliprane)..."
          className={cn(
            "pl-14 transition-all duration-500 border-white/40 bg-white/60 backdrop-blur-xl",
            "focus:border-teal-500/50 focus:ring-[12px] focus:ring-teal-500/5",
            large
              ? "h-20 text-xl rounded-[2rem] shadow-2xl hover:shadow-teal-500/10 placeholder:text-gray-300"
              : "h-14 rounded-2xl shadow-lg shadow-black/5"
          )}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus={large}
        />
        {isLoading && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <div className="h-4 w-4 border-2 border-teal-500/20 border-t-teal-500 rounded-full animate-spin" />
          </div>
        )}
      </div>

      {suggestions.length > 0 && (
        <div className="absolute z-30 mt-1 w-full rounded-lg border bg-popover shadow-lg overflow-hidden">
          {suggestions.map((med) => (
            <button
              key={med.id}
              className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-accent transition-colors"
              onClick={() => onSelect(med)}
            >
              <Pill className="h-4 w-4 mt-0.5 text-primary shrink-0" />
              <div>
                <p className="text-sm font-medium">{med.name}</p>
                <p className="text-xs text-muted-foreground">{med.activeIngredient}</p>
              </div>
              {med.isGeneric && (
                <Badge variant="secondary" className="ml-auto text-xs shrink-0">
                  Générique
                </Badge>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
