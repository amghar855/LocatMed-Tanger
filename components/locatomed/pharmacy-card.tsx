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
import { MapPin, Clock, Phone, Navigation, ArrowRight } from "lucide-react";
import {
  createReservation,
  createNotificationRequest,
  type PharmacyWithStock,
} from "@/lib/actions/medicine-search-actions";
import { cn } from "@/lib/utils";

interface PharmacyCardProps {
  pharmacy: PharmacyWithStock;
  medicineId: string;
  medicineName: string;
  isSelected?: boolean;
  onClick?: () => void;
}

function StatusBadge({ status }: { status: PharmacyWithStock["status"] }) {
  if (status === "available")
    return (
      <div className="flex items-center gap-2">
        <div className="h-2 w-2 rounded-full bg-teal-500 animate-pulse shadow-[0_0_8px_rgba(20,184,166,0.8)]" />
        <span className="text-[10px] font-bold text-teal-500 uppercase tracking-wider">Disponible</span>
      </div>
    );
  if (status === "low_stock")
    return (
      <div className="flex items-center gap-2">
        <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
        <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider">Stock Faible</span>
      </div>
    );
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
      <span className="text-[10px] font-bold text-red-500 uppercase tracking-wider">Rupture</span>
    </div>
  );
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
          <Button 
            size="sm" 
            className="flex-1 bg-teal-500 hover:bg-teal-400 text-[#0f2420] font-black uppercase text-[10px] tracking-widest h-10 rounded-xl shadow-[0_0_15px_rgba(20,184,166,0.3)] transition-all hover:shadow-[0_0_25px_rgba(20,184,166,0.5)] active:scale-95"
          >
            Reserve Now
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md bg-white/80 backdrop-blur-2xl border-white/40 shadow-2xl rounded-[2.5rem] p-8">
        <DialogHeader className="space-y-4">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-3xl font-black text-[#0f2420] tracking-tighter">
              Réserver <span className="text-teal-600">{medicineName}</span>
            </DialogTitle>
          </div>
          <DialogDescription className="text-sm font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
            <MapPin className="h-3 w-3" /> {pharmacy.pharmacyName}
          </DialogDescription>
        </DialogHeader>

        <div className="my-6 relative overflow-hidden rounded-2xl h-24 bg-[#0f2420] flex items-center justify-center">
          <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
          {/* Mock Barcode for premium look */}
          <div className="flex gap-1 h-12">
            {[...Array(20)].map((_, i) => (
              <div key={i} className="bg-teal-500/80 w-[2px] h-full" style={{ width: Math.random() * 4 + 1 + 'px' }} />
            ))}
          </div>
          <div className="absolute bottom-2 left-4 flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-teal-500 animate-pulse" />
            <span className="text-[10px] text-teal-500 font-bold uppercase tracking-tighter">Créneaux disponibles : 08:30</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="res-name" className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">Votre Nom</Label>
            <div className="relative">
              <Input
                id="res-name"
                className="h-14 rounded-2xl bg-white/50 border-white/20 focus:bg-white focus:ring-4 focus:ring-teal-500/5 transition-all text-base pl-12"
                placeholder="Ex: Jean Dupont"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">👤</span>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="res-phone" className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">Téléphone</Label>
            <div className="relative">
              <Input
                id="res-phone"
                type="tel"
                className="h-14 rounded-2xl bg-white/50 border-white/20 focus:bg-white focus:ring-4 focus:ring-teal-500/5 transition-all text-base pl-12"
                placeholder="+33 6 00 00 00 00"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">📞</span>
            </div>
          </div>
          <Button 
            type="submit" 
            className="w-full h-16 rounded-[1.5rem] bg-[#0f2420] hover:bg-[#0d9488] text-white text-lg font-black tracking-tighter shadow-xl shadow-teal-500/10 hover:shadow-teal-500/20 transition-all flex items-center justify-center gap-3" 
            disabled={isPending}
          >
            {isPending ? "Traitement..." : (
              <>
                <div className="h-6 w-6 rounded-lg bg-teal-500 flex items-center justify-center">
                  <ArrowRight className="h-4 w-4 text-[#0f2420]" />
                </div>
                Confirmer la réservation
              </>
            )}
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
      className={cn(
        "cursor-pointer transition-all duration-500 transform group relative overflow-hidden",
        "bg-[#1A1D1F] border-white/5 shadow-2xl",
        isSelected 
          ? "ring-2 ring-teal-500 bg-[#23262b] translate-x-1" 
          : "hover:bg-[#23262b] hover:translate-x-1"
      )}
      onClick={onClick}
    >
      <div className="absolute top-0 left-0 w-1 h-full bg-teal-500 opacity-0 group-hover:opacity-100 transition-opacity" />
      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-bold text-base text-white tracking-tight leading-tight group-hover:text-teal-400 transition-colors">
              {pharmacy.pharmacyName}
            </p>
            {pharmacy.isOnDuty && (
              <Badge className="mt-1 text-[9px] font-black bg-amber-500/10 text-amber-500 border-amber-500/20 px-2 py-0">
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
          <div className="flex items-center justify-between gap-3 pt-1">
            <span className="text-xl font-black text-teal-500 tracking-tighter">
              {pharmacy.price.toFixed(2)} <span className="text-[10px] text-gray-500">MAD</span>
            </span>
            <span className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">
              {pharmacy.quantity} IN STOCK
            </span>
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
