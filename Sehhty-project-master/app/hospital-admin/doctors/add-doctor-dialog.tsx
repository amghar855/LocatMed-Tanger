"use client";

import { useTransition, useState } from "react";
import { addDoctorAction } from "./actions";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Plus } from "lucide-react";

const SPECIALTIES = [
  "Médecine générale",
  "Cardiologie",
  "Dermatologie",
  "Gynécologie",
  "Neurologie",
  "Ophtalmologie",
  "Orthopédie",
  "Pédiatrie",
  "Psychiatrie",
  "Radiologie",
  "Urologie",
];

export default function AddDoctorDialog() {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await addDoctorAction(formData);
      if (result?.error) {
        toast.error(result.error);
      } else if (result?.success) {
        toast.success(
          `Médecin ajouté — login\u00a0: ${result.email} / mot de passe\u00a0: ${result.tempPassword}`,
          { duration: 10000 }
        );
        setOpen(false);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={
        <Button className="bg-teal-600 text-white hover:bg-teal-700">
          <Plus className="mr-2 h-4 w-4" />
          Ajouter un médecin
        </Button>
      } />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Ajouter un médecin</DialogTitle>
          <DialogDescription>
            Le médecin pourra se connecter immédiatement avec le mot de passe temporaire.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2 rounded-xl border border-teal-100 bg-teal-50/50 p-3">
            <Label htmlFor="fullName">Nom complet</Label>
            <Input
              id="fullName"
              name="fullName"
              placeholder="Dr. Amine Benjelloun"
              required
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
            />
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
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Création…" : "Créer le compte"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
