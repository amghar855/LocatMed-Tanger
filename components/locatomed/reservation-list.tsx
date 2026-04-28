"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { updateReservationStatus, deleteReservation } from "@/lib/actions/reservation-actions";
import type { ReservationStatus } from "@/lib/actions/reservation-actions";
import { useRouter } from "next/navigation";
import { Phone, Trash2 } from "lucide-react";

interface Reservation {
  id: number;
  citizenName: string;
  citizenPhone: string;
  status: string;
  createdAt: Date | null;
  medicineName: string;
}

interface ReservationListProps {
  initialReservations: Reservation[];
}

const TABS: { label: string; value: ReservationStatus | "all" }[] = [
  { label: "Toutes", value: "all" },
  { label: "En attente", value: "pending" },
  { label: "Confirmées", value: "confirmed" },
  { label: "Collectées", value: "collected" },
  { label: "Annulées", value: "cancelled" },
];

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: "bg-amber-500/20 text-amber-400 border-amber-500/40",
    confirmed: "bg-teal-500/20 text-teal-400 border-teal-500/40",
    collected: "bg-green-500/20 text-green-400 border-green-500/40",
    cancelled: "bg-red-500/20 text-red-400 border-red-500/40",
  };
  const label: Record<string, string> = {
    pending: "En attente",
    confirmed: "Confirmée",
    collected: "Collectée",
    cancelled: "Annulée",
  };
  return (
    <Badge className={map[status] ?? ""}>
      {label[status] ?? status}
    </Badge>
  );
}

function ReservationRow({ res }: { res: Reservation }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function act(action: () => Promise<{ success?: boolean; error?: string } | undefined>) {
    startTransition(async () => {
      const result = await action();
      if (result?.error) toast.error(result.error);
      else router.refresh();
    });
  }

  return (
    <tr className="border-b transition-colors hover:bg-muted/20">
      <td className="px-4 py-3">
        <p className="text-sm font-medium">{res.medicineName}</p>
      </td>
      <td className="px-4 py-3">
        <p className="text-sm">{res.citizenName}</p>
      </td>
      <td className="px-4 py-3">
        <a
          href={`tel:${res.citizenPhone}`}
          className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          <Phone className="h-3 w-3" />
          {res.citizenPhone}
        </a>
      </td>
      <td className="px-4 py-3 text-xs text-muted-foreground">
        {res.createdAt ? new Date(res.createdAt).toLocaleDateString("fr-FR") : "—"}
      </td>
      <td className="px-4 py-3">
        <StatusBadge status={res.status} />
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1">
          {res.status === "pending" && (
            <Button
              size="xs"
              variant="outline"
              disabled={isPending}
              onClick={() => act(() => updateReservationStatus(res.id, "confirmed"))}
            >
              Confirmer
            </Button>
          )}
          {res.status === "confirmed" && (
            <Button
              size="xs"
              variant="outline"
              disabled={isPending}
              onClick={() => act(() => updateReservationStatus(res.id, "collected"))}
            >
              Collectée
            </Button>
          )}
          {(res.status === "pending" || res.status === "confirmed") && (
            <Button
              size="xs"
              variant="outline"
              disabled={isPending}
              onClick={() => act(() => updateReservationStatus(res.id, "cancelled"))}
            >
              Annuler
            </Button>
          )}
          <Button
            size="icon-xs"
            variant="ghost"
            disabled={isPending}
            onClick={() => act(() => deleteReservation(res.id))}
          >
            <Trash2 className="h-3.5 w-3.5 text-destructive" />
          </Button>
        </div>
      </td>
    </tr>
  );
}

export function ReservationList({ initialReservations }: ReservationListProps) {
  const [tab, setTab] = useState<ReservationStatus | "all">("all");

  const filtered =
    tab === "all" ? initialReservations : initialReservations.filter((r) => r.status === tab);

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex flex-wrap gap-1 overflow-x-auto border-b pb-3">
        {TABS.map((t) => {
          const count =
            t.value === "all"
              ? initialReservations.length
              : initialReservations.filter((r) => r.status === t.value).length;
          return (
            <button
              key={t.value}
              onClick={() => setTab(t.value)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                tab === t.value
                  ? "bg-cyan-600 text-white"
                  : "text-muted-foreground hover:bg-cyan-50 hover:text-cyan-900"
              }`}
            >
              {t.label}
              <span className="ml-1.5 text-xs opacity-70">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div className="rounded-lg border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/30">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Médicament</th>
              <th className="px-4 py-3 text-left font-medium">Nom</th>
              <th className="px-4 py-3 text-left font-medium">Téléphone</th>
              <th className="px-4 py-3 text-left font-medium">Date</th>
              <th className="px-4 py-3 text-left font-medium">Statut</th>
              <th className="px-4 py-3 text-left font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                  Aucune réservation.
                </td>
              </tr>
            ) : (
              filtered.map((res) => <ReservationRow key={res.id} res={res} />)
            )}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted-foreground">{filtered.length} réservation{filtered.length !== 1 ? "s" : ""}</p>
    </div>
  );
}
