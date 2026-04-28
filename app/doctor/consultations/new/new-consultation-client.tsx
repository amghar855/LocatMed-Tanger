"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Trash2, Search, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import {
  getPatientById,
  searchMedicines,
  createMedicalRecord,
} from "@/lib/actions/doctor-actions";
import Link from "next/link";
import DoctorNav from "@/components/locatomed/doctor-nav";
import { cn } from "@/lib/utils";

interface Medicine {
  id: string;
  name: string;
  activeIngredient: string;
  dosageForm: string | null;
}

interface PrescriptionItem {
  medicineId: string;
  medicineName: string;
  dosage: string;
  duration: string;
  instructions: string;
}

interface NewConsultationClientProps {
  userName?: string;
}

export default function NewConsultationClient({ userName = "Médecin" }: NewConsultationClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const patientId = searchParams.get("patientId");
  const appointmentId = searchParams.get("appointmentId");

  const [patientName, setPatientName] = useState<string | null>(null);
  const [diagnosis, setDiagnosis] = useState("");
  const [notes, setNotes] = useState("");
  const [medicineQuery, setMedicineQuery] = useState("");
  const [medicineResults, setMedicineResults] = useState<Medicine[]>([]);
  const [prescriptions, setPrescriptions] = useState<PrescriptionItem[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Load patient name
  useEffect(() => {
    if (!patientId) return;
    getPatientById(patientId)
      .then((p) => setPatientName(p.fullName))
      .catch(() => setPatientName(null));
  }, [patientId]);

  // Medicine search with debounce
  const doMedicineSearch = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setMedicineResults([]);
      return;
    }
    const results = await searchMedicines(q.trim());
    setMedicineResults(results);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => doMedicineSearch(medicineQuery), 300);
    return () => clearTimeout(timer);
  }, [medicineQuery, doMedicineSearch]);

  function addMedicine(med: Medicine) {
    if (prescriptions.some((p) => p.medicineId === med.id)) return;
    setPrescriptions((prev) => [
      ...prev,
      {
        medicineId: med.id,
        medicineName: med.name,
        dosage: "",
        duration: "",
        instructions: "",
      },
    ]);
    setMedicineQuery("");
    setMedicineResults([]);
  }

  function removePrescription(medicineId: string) {
    setPrescriptions((prev) => prev.filter((p) => p.medicineId !== medicineId));
  }

  function updatePrescription(
    medicineId: string,
    field: keyof Omit<PrescriptionItem, "medicineId" | "medicineName">,
    value: string
  ) {
    setPrescriptions((prev) =>
      prev.map((p) =>
        p.medicineId === medicineId ? { ...p, [field]: value } : p
      )
    );
  }

  async function handleSubmit() {
    if (!patientId) return;
    if (!diagnosis.trim()) {
      toast.error("Le diagnostic est obligatoire");
      return;
    }
    for (const p of prescriptions) {
      if (!p.dosage.trim() || !p.duration.trim()) {
        toast.error(
          `Remplissez la posologie et la durée pour ${p.medicineName}`
        );
        return;
      }
    }

    setSubmitting(true);
    try {
      await createMedicalRecord({
        patientId,
        appointmentId: appointmentId ?? undefined,
        diagnosis: diagnosis.trim(),
        notes: notes.trim() || undefined,
        prescriptions: prescriptions.map((p) => ({
          medicineId: p.medicineId,
          dosage: p.dosage.trim(),
          duration: p.duration.trim(),
          instructions: p.instructions.trim() || undefined,
        })),
      });

      toast.success("Consultation enregistrée avec succès");

      if (appointmentId) {
        router.push(`/doctor/appointments/${appointmentId}`);
      } else {
        router.push(`/doctor/patients/${patientId}`);
      }
    } catch {
      toast.error("Erreur lors de l'enregistrement");
      setSubmitting(false);
    }
  }

  const backHref = appointmentId
    ? `/doctor/appointments/${appointmentId}`
    : patientId
    ? `/doctor/patients/${patientId}`
    : "/doctor/patients";

  if (!patientId) {
    return (
      <>
        <DoctorNav userName={userName} active="consultations" />
        <div className="min-h-screen md:pl-72">
          <div className="mx-auto w-full max-w-5xl p-4 sm:p-6">
            <Card>
              <CardContent className="space-y-4 py-12 text-center">
                <p className="text-muted-foreground">
                  Veuillez sélectionner un patient
                </p>
                <Link
                  href="/doctor/patients"
                  className={cn(
                    buttonVariants({ variant: "default" }),
                    "bg-teal-600 text-white hover:bg-teal-700"
                  )}
                >
                  Rechercher un patient
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <DoctorNav userName={userName} active="consultations" />

      <div className="min-h-screen md:pl-72">
        <div className="mx-auto w-full max-w-5xl space-y-6 p-4 sm:p-6">
        {/* Back */}
        <Link
          href={backHref}
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Retour
        </Link>

        {/* Header */}
        <section className="rounded-2xl border border-teal-200/70 bg-gradient-to-br from-teal-50 via-background to-cyan-50 p-6">
          <h1 className="text-3xl font-bold tracking-tight">Nouvelle consultation</h1>
          {patientName && (
            <p className="mt-1 text-sm text-muted-foreground">
              Patient : {patientName}
            </p>
          )}
        </section>

        {/* Section 1: Diagnostic */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Diagnostic</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="diagnosis">
                Diagnostic <span className="text-red-500">*</span>
              </Label>
              <Input
                id="diagnosis"
                placeholder="Ex. : Grippe saisonnière"
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (optionnel)</Label>
              <Textarea
                id="notes"
                placeholder="Observations, recommandations..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Section 2: Ordonnance */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ordonnance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Medicine search */}
            <div className="space-y-2">
              <Label htmlFor="medicine-search">Ajouter un médicament</Label>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="medicine-search"
                  placeholder="Rechercher un médicament..."
                  value={medicineQuery}
                  onChange={(e) => setMedicineQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              {medicineResults.length > 0 && (
                <div className="border rounded-md divide-y max-h-48 overflow-y-auto">
                  {medicineResults.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      className="w-full text-left px-3 py-2 hover:bg-muted text-sm"
                      onClick={() => addMedicine(m)}
                    >
                      <span className="font-medium">{m.name}</span>
                      {m.dosageForm && (
                        <span className="text-muted-foreground ml-2">
                          — {m.dosageForm}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Prescription list */}
            {prescriptions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Aucun médicament prescrit
              </p>
            ) : (
              <div className="space-y-4">
                {prescriptions.map((p) => (
                  <div
                    key={p.medicineId}
                    className="border rounded-lg p-4 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium">{p.medicineName}</p>
                      <button
                        type="button"
                        onClick={() => removePrescription(p.medicineId)}
                        className="p-1 rounded hover:bg-muted"
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">
                          Posologie <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          placeholder="Ex. : 2 comprimés"
                          value={p.dosage}
                          onChange={(e) =>
                            updatePrescription(
                              p.medicineId,
                              "dosage",
                              e.target.value
                            )
                          }
                          className="h-8 text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">
                          Durée <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          placeholder="Ex. : 7 jours"
                          value={p.duration}
                          onChange={(e) =>
                            updatePrescription(
                              p.medicineId,
                              "duration",
                              e.target.value
                            )
                          }
                          className="h-8 text-sm"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">
                        Instructions (optionnel)
                      </Label>
                      <Input
                        placeholder="Ex. : Après les repas"
                        value={p.instructions}
                        onChange={(e) =>
                          updatePrescription(
                            p.medicineId,
                            "instructions",
                            e.target.value
                          )
                        }
                        className="h-8 text-sm"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <Button
            variant="outline"
            onClick={() => router.push(backHref)}
            disabled={submitting}
          >
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Enregistrement..." : "Enregistrer la Consultation"}
          </Button>
        </div>
        </div>
      </div>
    </>
  );
}
