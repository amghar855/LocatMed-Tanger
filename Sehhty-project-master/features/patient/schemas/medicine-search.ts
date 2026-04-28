import { z } from "zod";

export const medicineSearchInputSchema = z.object({
  query: z
    .string()
    .trim()
    .min(2, "Saisissez au moins 2 caracteres")
    .max(100, "Recherche trop longue"),
});

export const medicineBroadcastInputSchema = z.object({
  medicineId: z.string().trim().min(1, "Medicament invalide"),
});

export function validateMedicineSearchInput(input: z.infer<typeof medicineSearchInputSchema>) {
  const parsed = medicineSearchInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false as const,
      error: parsed.error.issues[0]?.message ?? "Recherche invalide",
    };
  }

  return { ok: true as const, data: parsed.data };
}

export function validateMedicineBroadcastInput(
  input: z.infer<typeof medicineBroadcastInputSchema>
) {
  const parsed = medicineBroadcastInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false as const,
      error: parsed.error.issues[0]?.message ?? "Demande invalide",
    };
  }

  return { ok: true as const, data: parsed.data };
}
