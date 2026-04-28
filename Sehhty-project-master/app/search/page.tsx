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
      <header className="border-b bg-background/95 backdrop-blur sticky top-0 z-20">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
          <Link href="/" className="flex items-center gap-2 font-bold text-base">
            <ArrowLeft className="h-4 w-4" />
            LOCATOMED
          </Link>
          <span className="text-muted-foreground text-sm hidden sm:block">Trouver un médicament</span>
        </div>
      </header>

      {/* Hero search */}
      {!selectedMedicine && (
        <section className="py-16 px-4 text-center">
          <h1 className="text-3xl font-bold mb-3">Trouvez Vos Médicaments</h1>
          <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
            Recherchez et localisez les pharmacies qui ont vos médicaments en stock
          </p>
          <SearchBox
            query={query}
            setQuery={setQuery}
            suggestions={suggestions}
            onSelect={selectMedicine}
            isLoading={loadingSearch}
            large
          />
        </section>
      )}

      {/* Results */}
      {selectedMedicine && (
        <div className="mx-auto max-w-6xl px-4 py-6 space-y-6">
          {/* Medicine info + search bar */}
          <div className="flex flex-col sm:flex-row sm:items-start gap-4">
            <Card className="flex-1">
              <CardContent className="flex items-start gap-3 p-4">
                <Pill className="h-5 w-5 mt-0.5 text-primary shrink-0" />
                <div>
                  <p className="font-semibold">{selectedMedicine.name}</p>
                  <p className="text-sm text-muted-foreground">{selectedMedicine.activeIngredient}</p>
                  {selectedMedicine.dosageForm && (
                    <p className="text-xs text-muted-foreground">{selectedMedicine.dosageForm}</p>
                  )}
                  {selectedMedicine.ppm && (
                    <p className="text-xs mt-1 font-medium">{selectedMedicine.ppm.toFixed(2)} MAD</p>
                  )}
                </div>
                <div className="ml-auto text-right">
                  <p className="text-sm font-medium text-primary">{inStockCount}</p>
                  <p className="text-xs text-muted-foreground">pharmacie{inStockCount !== 1 ? "s" : ""} en stock</p>
                </div>
              </CardContent>
            </Card>
            <div className="sm:w-72">
              <SearchBox
                query={query}
                setQuery={(q) => { setQuery(q); if (q !== selectedMedicine.name) clearSelection(); }}
                suggestions={suggestions}
                onSelect={selectMedicine}
                isLoading={loadingSearch}
              />
            </div>
          </div>

          {loadingStock ? (
            <div className="py-16 text-center text-muted-foreground">Recherche des pharmacies…</div>
          ) : pharmacies.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground">
              <p className="font-medium">Aucune pharmacie ne stocke ce médicament à Tanger.</p>
              <p className="text-sm mt-1">Essayez un médicament équivalent ou revenez plus tard.</p>
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {/* Map */}
              <div className="h-[480px] rounded-lg overflow-hidden border">
                <PharmacyMap
                  pharmacies={pharmacies}
                  selectedId={selectedPharmacyId}
                  onSelect={setSelectedPharmacyId}
                />
              </div>

              {/* Cards list */}
              <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
                {pharmacies.map((p) => (
                  <PharmacyCard
                    key={p.pharmacyId}
                    pharmacy={p}
                    medicineId={selectedMedicine.id}
                    medicineName={selectedMedicine.name}
                    isSelected={selectedPharmacyId === p.pharmacyId}
                    onClick={() => setSelectedPharmacyId(p.pharmacyId)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
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
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Ex: Doliprane, paracétamol…"
          className={`pl-9 ${large ? "h-12 text-base" : ""}`}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus={large}
        />
        {isLoading && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
            …
          </span>
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
