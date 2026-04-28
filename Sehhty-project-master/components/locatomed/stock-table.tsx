"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { updateStockQuantity } from "@/lib/actions/pharmacy-stock-actions";
import { calcStatus, type StockStatus } from "@/lib/stock-utils";
import { AddStockDialog } from "@/components/locatomed/add-stock-dialog";
import { useRouter } from "next/navigation";

interface StockItem {
  stockId: number;
  medicineId: string;
  medicineName: string;
  activeIngredient: string;
  dosageForm: string | null;
  quantity: number;
  price: number;
  minThreshold: number;
  status: StockStatus;
}

interface StockTableProps {
  initialStock: StockItem[];
}

function StatusBadge({ status }: { status: StockStatus }) {
  if (status === "available")
    return <Badge className="bg-green-500/20 text-green-400 border-green-500/40 text-xs">Disponible</Badge>;
  if (status === "low_stock")
    return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/40 text-xs">Stock Faible</Badge>;
  return <Badge className="bg-red-500/20 text-red-400 border-red-500/40 text-xs">Rupture</Badge>;
}

function StockRow({ item }: { item: StockItem }) {
  const [qty, setQty] = useState(item.quantity);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const previewStatus = calcStatus(qty, item.minThreshold);
  const isDirty = qty !== item.quantity;

  function save() {
    startTransition(async () => {
      const result = await updateStockQuantity(item.stockId, qty);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success(`Stock mis à jour — ${item.medicineName}`);
        router.refresh();
      }
    });
  }

  return (
    <tr className="border-b transition-colors hover:bg-muted/30">
      <td className="px-4 py-3">
        <p className="text-sm font-medium">{item.medicineName}</p>
        <p className="text-xs text-muted-foreground">{item.activeIngredient}</p>
        {item.dosageForm && (
          <p className="text-xs text-muted-foreground">{item.dosageForm}</p>
        )}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min={0}
            value={qty}
            onChange={(e) => setQty(Math.max(0, parseInt(e.target.value) || 0))}
            className="h-8 w-20 text-center"
          />
          {isDirty && (
            <Button size="sm" onClick={save} disabled={isPending} className="h-8 px-3 text-xs">
              {isPending ? "…" : "Sauv."}
            </Button>
          )}
        </div>
      </td>
      <td className="px-4 py-3 text-sm">{item.minThreshold}</td>
      <td className="px-4 py-3">
        <StatusBadge status={previewStatus} />
      </td>
      <td className="px-4 py-3 text-sm">{item.price.toFixed(2)} MAD</td>
    </tr>
  );
}

export function StockTable({ initialStock }: StockTableProps) {
  const [query, setQuery] = useState("");

  const filtered = initialStock.filter(
    (s) =>
      s.medicineName.toLowerCase().includes(query.toLowerCase()) ||
      s.activeIngredient.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un médicament…"
            className="pl-8"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <AddStockDialog />
      </div>

      <div className="rounded-lg border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/30">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Médicament</th>
              <th className="px-4 py-3 text-left font-medium">Quantité</th>
              <th className="px-4 py-3 text-left font-medium">Seuil min.</th>
              <th className="px-4 py-3 text-left font-medium">Statut</th>
              <th className="px-4 py-3 text-left font-medium">Prix</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                  Aucun médicament trouvé.
                </td>
              </tr>
            ) : (
              filtered.map((item) => <StockRow key={item.stockId} item={item} />)
            )}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted-foreground">{filtered.length} médicament{filtered.length !== 1 ? "s" : ""}</p>
    </div>
  );
}
