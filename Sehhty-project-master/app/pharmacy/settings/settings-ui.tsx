"use client";

import { useTransition, useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { toggleGardeStatus } from "@/lib/actions/pharmacy-stock-actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Building2, Clock, User } from "lucide-react";

export interface PharmacySettingsData {
  pharmacy: {
    name: string;
    address: string | null;
    city: string;
    neighborhood: string | null;
    openingHours: string | null;
    isOnDuty: boolean;
  };
  admin: {
    fullName: string;
    email: string;
  };
}

function GardeToggle({ initialValue }: { initialValue: boolean }) {
  const [isOnDuty, setIsOnDuty] = useState(initialValue);
  const [isDirty, setIsDirty] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSave() {
    startTransition(async () => {
      await toggleGardeStatus(isOnDuty);
      toast.success(isOnDuty ? "Pharmacie marquée de garde" : "Statut de garde désactivé");
      setIsDirty(false);
      router.refresh();
    });
  }

  return (
    <div className="rounded-lg border p-4 space-y-3">
      <div className="flex items-start gap-3">
        <input
          id="isOnDuty"
          type="checkbox"
          checked={isOnDuty}
          onChange={(e) => { setIsOnDuty(e.target.checked); setIsDirty(true); }}
          className="mt-1 h-4 w-4"
        />
        <div className="space-y-1">
          <Label htmlFor="isOnDuty" className="cursor-pointer">Pharmacie de Garde</Label>
          <p className="text-xs text-muted-foreground">
            Activé = marqueur doré sur la carte de recherche.
          </p>
        </div>
      </div>
      {isDirty && (
        <Button size="sm" onClick={handleSave} disabled={isPending}>
          {isPending ? "Sauvegarde…" : "Sauvegarder"}
        </Button>
      )}
    </div>
  );
}

function Field({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="mt-0.5 flex items-center gap-1.5">
        {icon}
        <p className="text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}

export function PharmacySettingsUI({ pharmacy, admin }: PharmacySettingsData) {
  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-cyan-200/70 bg-gradient-to-br from-cyan-50 via-background to-teal-50 p-6">
        <div className="flex flex-wrap items-center gap-2">
          <Badge className="bg-cyan-600 text-white hover:bg-cyan-600">Paramètres pharmacie</Badge>
          {pharmacy.isOnDuty && (
            <Badge className="border-amber-500/40 bg-amber-500/20 text-amber-500 hover:bg-amber-500/20">
              DE GARDE
            </Badge>
          )}
        </div>
        <h1 className="mt-3 text-3xl font-bold tracking-tight">Paramètres</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Gérez votre profil pharmacien et les informations de votre officine.
        </p>
      </section>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-base">Informations de la Pharmacie</CardTitle>
            </div>
            <CardDescription>Données enregistrées</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field label="Nom" value={pharmacy.name} />
            <Field label="Ville" value={pharmacy.city} />
            {pharmacy.address && <Field label="Adresse" value={pharmacy.address} />}
            {pharmacy.neighborhood && <Field label="Quartier" value={pharmacy.neighborhood} />}
            {pharmacy.openingHours && (
              <Field
                label="Horaires"
                value={pharmacy.openingHours}
                icon={<Clock className="h-3.5 w-3.5 text-muted-foreground" />}
              />
            )}
            <div className="pt-2">
              <p className="text-xs text-muted-foreground mb-2">Statut de garde</p>
              <GardeToggle initialValue={pharmacy.isOnDuty} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-base">Votre Profil</CardTitle>
            </div>
            <CardDescription>Informations personnelles</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field label="Nom" value={admin.fullName} />
            <Field label="Email" value={admin.email} />
            <Field label="Rôle" value="Pharmacien" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
