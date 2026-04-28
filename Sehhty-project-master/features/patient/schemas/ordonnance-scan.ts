import { z } from "zod";

export const ordonnanceUploadMetaSchema = z.object({
  fileName: z.string().min(1, "Fichier requis"),
  mimeType: z.string().min(1, "Type de fichier invalide"),
  size: z.number().positive(),
});

export function validateOrdonnanceUpload(meta: z.infer<typeof ordonnanceUploadMetaSchema>) {
  const parsed = ordonnanceUploadMetaSchema.safeParse(meta);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Entrée invalide" };
  }

  const allowed = ["application/pdf", "image/png", "image/jpeg", "image/jpg", "image/webp"];
  if (!allowed.includes(parsed.data.mimeType)) {
    return { ok: false as const, error: "Formats autorisés: PDF, PNG, JPG, WEBP" };
  }

  const maxSizeBytes = 5 * 1024 * 1024;
  if (parsed.data.size > maxSizeBytes) {
    return { ok: false as const, error: "Le fichier dépasse 5MB" };
  }

  return { ok: true as const, data: parsed.data };
}
