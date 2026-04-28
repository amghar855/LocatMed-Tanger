import { z } from "zod";

export const patientChatQuestionSchema = z.object({
  question: z
    .string()
    .min(2, "Veuillez saisir une question plus detaillee")
    .max(350, "Question trop longue (max 350 caracteres)"),
});

export function validatePatientChatQuestion(input: z.infer<typeof patientChatQuestionSchema>) {
  const parsed = patientChatQuestionSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false as const,
      error: parsed.error.issues[0]?.message ?? "Question invalide",
    };
  }

  return { ok: true as const, data: parsed.data };
}
