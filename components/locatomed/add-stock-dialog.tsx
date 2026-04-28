"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Search, Plus, Pill } from "lucide-react";
import { getMedicinesNotInStock, addStockItem } from "@/lib/actions/pharmacy-stock-actions";

type Medicine = Awaited<ReturnType<typeof getMedicinesNotInStock>>[number];

export function AddStockDialog() {
  const [open, setOpen] = useState(false);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Medicine | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [price, setPrice] = useState("");
  const [minThreshold, setMinThreshold] = useState(5);
  const [loadingMeds, startLoad] = useTransition();
  const [isPending, startSubmit] = useTransition();
  const router = useRouter();

  // Fetch available medicines when dialog opens
  useEffect(() => {
    if (!open) return;
    startLoad(async () => {
      const list = await getMedicinesNotInStock();
      setMedicines(list);
    });
    // Reset form on each open
    setSearch("");
    setSelected(null);
    setQuantity(1);
    setPrice("");
    setMinThreshold(5);
  }, [open]);

  // Pre-fill price from the national PPM when a medicine is selected
  function handleSelect(med: Medicine) {
    setSelected(med);
    setSearch(med.name);
    if (med.ppm && !price) setPrice(med.ppm.toFixed(2));
  }

  const filtered = medicines.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.activeIngredient.toLowerCase().includes(search.toLowerCase()),
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) {
      toast.error("Veuillez sélectionner un médicament.");
      return;
    }
    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      toast.error("Prix invalide.");
      return;
    }

    startSubmit(async () => {
      const result = await addStockItem({
        medicineId: selected.id,
        quantity,
        price: parsedPrice,
        minThreshold,
      });
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success(`${selected.name} ajouté au stock.`);
        setOpen(false);
        router.refresh();
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Ajouter un médicament
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Ajouter un médicament au stock</DialogTitle>
          <DialogDescription>
            Recherchez un médicament du référentiel national et définissez la quantité initiale.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 pt-1">
          {/* Medicine picker */}
          <div className="space-y-2">
            <Label>Médicament</Label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom ou DCI…"
                className="pl-8"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  if (selected && e.target.value !== selected.name) setSelected(null);
                }}
                autoComplete="off"
              />
            </div>

            {/* Dropdown — hidden once a medicine is selected */}
            {!selected && search.length >= 1 && (
              <div className="max-h-48 overflow-y-auto rounded-lg border bg-popover shadow-md">
                {loadingMeds ? (
                  <p className="px-3 py-4 text-center text-sm text-muted-foreground">Chargement…</p>
                ) : filtered.length === 0 ? (
                  <p className="px-3 py-4 text-center text-sm text-muted-foreground">
                    Aucun médicament disponible.
                  </p>
                ) : (
                  filtered.map((med) => (
                    <button
                      key={med.id}
                      type="button"
                      className="flex w-full items-start gap-3 px-3 py-2.5 text-left hover:bg-accent transition-colors"
                      onClick={() => handleSelect(med)}
                    >
                      <Pill className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <div>
                        <p className="text-sm font-medium">{med.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {med.activeIngredient}
                          {med.dosageForm ? ` · ${med.dosageForm}` : ""}
                        </p>
                      </div>
                      {med.ppm && (
                        <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                          {med.ppm.toFixed(2)} MAD
                        </span>
                      )}
                    </button>
                  ))
                )}
              </div>
            )}

            {/* Confirmation chip */}
            {selected && (
              <div className="flex items-center gap-2 rounded-md border bg-muted/40 px-3 py-2">
                <Pill className="h-4 w-4 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{selected.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{selected.activeIngredient}</p>
                </div>
                <button
                  type="button"
                  className="text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => { setSelected(null); setSearch(""); setPrice(""); }}
                >
                  Changer
                </button>
              </div>
            )}
          </div>

          {/* Quantity, price, threshold */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label htmlFor="add-qty">Quantité</Label>
              <Input
                id="add-qty"
                type="number"
                min={0}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(0, parseInt(e.target.value) || 0))}
                className="text-center"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-price">Prix (MAD)</Label>
              <Input
                id="add-price"
                type="number"
                min={0}
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-threshold">Seuil min.</Label>
              <Input
                id="add-threshold"
                type="number"
                min={1}
                value={minThreshold}
                onChange={(e) => setMinThreshold(Math.max(1, parseInt(e.target.value) || 1))}
                className="text-center"
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground -mt-2">
            Le seuil déclenchera l'alerte "Stock Faible" quand la quantité descend en dessous.
          </p>

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
              Annuler
            </Button>
            <Button type="submit" disabled={isPending || !selected}>
              {isPending ? "Ajout…" : "Ajouter au stock"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
