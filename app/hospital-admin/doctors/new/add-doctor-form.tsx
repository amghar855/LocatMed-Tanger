"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { addDoctorAction } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const SPECIALTIES = [
  "Médecine générale",
  "Cardiologie",
  "Chirurgie générale",
  "Dermatologie",
  "Gynécologie",
  "Maternité",
  "Neurologie",
  "Oncologie",
  "Ophtalmologie",
  "Orthopédie",
  "Pédiatrie",
  "Psychiatrie",
  "Radiologie",
  "Réanimation",
  "Urologie",
];

export default function AddDoctorForm() {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await addDoctorAction(formData);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      if (result?.success) {
        toast.success(
          `Compte créé — login\u00a0: ${result.email} / mot de passe\u00a0: ${result.tempPassword}`,
          { duration: 10000 },
        );
        router.push("/hospital-admin/doctors");
        router.refresh();
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 rounded-xl border border-teal-100 bg-teal-50/50 p-3">
          <Label htmlFor="fullName">Nom complet</Label>
          <Input
            id="fullName"
            name="fullName"
            placeholder="Dr. Amine Benjelloun"
            required
            autoComplete="name"
          />
        </div>
        <div className="space-y-2 rounded-xl border border-teal-100 bg-teal-50/50 p-3">
          <Label htmlFor="email">Email professionnel</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="medecin@hopital.ma"
            required
            autoComplete="email"
          />
        </div>
      </div>

      <div className="space-y-2 rounded-xl border border-teal-100 bg-teal-50/50 p-3">
        <Label htmlFor="specialty">Spécialité</Label>
        <Select name="specialty" required>
          <SelectTrigger id="specialty">
            <SelectValue placeholder="Choisir une spécialité" />
          </SelectTrigger>
          <SelectContent>
            {SPECIALTIES.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2 rounded-xl border border-teal-100 bg-teal-50/50 p-3">
        <Label htmlFor="tempPassword">Mot de passe temporaire</Label>
        <Input
          id="tempPassword"
          name="tempPassword"
          type="text"
          placeholder="min. 8 caractères"
          required
          minLength={8}
        />
        <p className="text-xs text-muted-foreground">
          Communiquez-le au médecin — il pourra le changer après connexion.
        </p>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button
          type="button"
          variant="outline"
          disabled={isPending}
          onClick={() => router.back()}
        >
          Annuler
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Création…" : "Créer le compte"}
        </Button>
      </div>
    </form>
  );
}
