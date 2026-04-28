"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { MapPin, Clock, Phone, Navigation } from "lucide-react";
import {
  createReservation,
  createNotificationRequest,
  type PharmacyWithStock,
} from "@/lib/actions/medicine-search-actions";

interface PharmacyCardProps {
  pharmacy: PharmacyWithStock;
  medicineId: string;
  medicineName: string;
  isSelected?: boolean;
  onClick?: () => void;
}

function StatusBadge({ status }: { status: PharmacyWithStock["status"] }) {
  if (status === "available")
    return <Badge className="bg-green-500/20 text-green-400 border-green-500/40">Disponible</Badge>;
  if (status === "low_stock")
    return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/40">Stock Faible</Badge>;
  return <Badge className="bg-red-500/20 text-red-400 border-red-500/40">Rupture de Stock</Badge>;
}

function ReservationModal({
  pharmacy,
  medicineId,
  medicineName,
}: {
  pharmacy: PharmacyWithStock;
  medicineId: string;
  medicineName: string;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await createReservation({
        pharmacyId: pharmacy.pharmacyId,
        medicineId,
        citizenName: name,
        citizenPhone: phone,
      });
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success("Réservation envoyée ! La pharmacie vous contactera.");
        setOpen(false);
        setName("");
        setPhone("");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button size="sm" className="flex-1">
            Réserver
          </Button>
        }
      />
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Réserver {medicineName}</DialogTitle>
          <DialogDescription>
            à {pharmacy.pharmacyName}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="res-name">Nom complet</Label>
            <Input
              id="res-name"
              placeholder="Fatima Zahra"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="res-phone">Téléphone</Label>
            <Input
              id="res-phone"
              type="tel"
              placeholder="+212 6XX XXX XXX"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Envoi…" : "Confirmer la réservation"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function NotifyModal({
  pharmacy,
  medicineId,
  medicineName,
}: {
  pharmacy: PharmacyWithStock;
  medicineId: string;
  medicineName: string;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await createNotificationRequest({
        pharmacyId: pharmacy.pharmacyId,
        medicineId,
        email: email || undefined,
        phoneNumber: phone || undefined,
      });
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success("Vous serez notifié quand ce médicament sera disponible.");
        setOpen(false);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button size="sm" variant="outline" className="flex-1">
            Me Notifier
          </Button>
        }
      />
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Me notifier</DialogTitle>
          <DialogDescription>
            Soyez averti dès que {medicineName} sera disponible à {pharmacy.pharmacyName}.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="notif-email">Email</Label>
            <Input
              id="notif-email"
              type="email"
              placeholder="vous@exemple.ma"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notif-phone">Téléphone</Label>
            <Input
              id="notif-phone"
              type="tel"
              placeholder="+212 6XX XXX XXX"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <p className="text-xs text-muted-foreground">Au moins un des deux champs est requis.</p>
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Envoi…" : "M'inscrire"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function PharmacyCard({
  pharmacy,
  medicineId,
  medicineName,
  isSelected,
  onClick,
}: PharmacyCardProps) {
  const directionsUrl = `https://www.openstreetmap.org/directions?from=&to=${pharmacy.lat}%2C${pharmacy.lng}`;

  return (
    <Card
      className={`cursor-pointer transition-all ${isSelected ? "ring-2 ring-primary" : "hover:ring-1 hover:ring-border"}`}
      onClick={onClick}
    >
      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-semibold text-sm leading-tight">{pharmacy.pharmacyName}</p>
            {pharmacy.isOnDuty && (
              <Badge className="mt-1 text-xs bg-amber-500/20 text-amber-400 border-amber-500/40">
                DE GARDE
              </Badge>
            )}
          </div>
          <StatusBadge status={pharmacy.status} />
        </div>

        {/* Details */}
        <div className="space-y-1 text-xs text-muted-foreground">
          {pharmacy.address && (
            <div className="flex items-center gap-1.5">
              <MapPin className="h-3 w-3 shrink-0" />
              <span>{pharmacy.address}</span>
            </div>
          )}
          {pharmacy.openingHours && (
            <div className="flex items-center gap-1.5">
              <Clock className="h-3 w-3 shrink-0" />
              <span>{pharmacy.openingHours}</span>
            </div>
          )}
        </div>

        {/* Price + qty */}
        {pharmacy.quantity > 0 && (
          <div className="flex items-center gap-3 text-sm">
            <span className="font-semibold">{pharmacy.price.toFixed(2)} MAD</span>
            <span className="text-muted-foreground text-xs">· {pharmacy.quantity} en stock</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          {pharmacy.status !== "out_of_stock" ? (
            <ReservationModal
              pharmacy={pharmacy}
              medicineId={medicineId}
              medicineName={medicineName}
            />
          ) : (
            <NotifyModal
              pharmacy={pharmacy}
              medicineId={medicineId}
              medicineName={medicineName}
            />
          )}
          <a
            href={directionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
          >
            <Button size="sm" variant="outline">
              <Navigation className="h-3.5 w-3.5" />
            </Button>
          </a>
        </div>
      </CardContent>
    </Card>
  );
}
