"use server";

import { requireRole } from "@/lib/auth/guards";
import { validateOrdonnanceUpload } from "@/features/patient/schemas/ordonnance-scan";
import { scanOrdonnanceWithPlaceholder } from "@/features/patient/services/ordonnance-scan";

export async function scanOrdonnanceAction(formData: FormData) {
  await requireRole("patient");

  const file = formData.get("ordonnanceFile");
  if (!(file instanceof File)) {
    return { error: "Fichier manquant" };
  }

  const checked = validateOrdonnanceUpload({
    fileName: file.name,
    mimeType: file.type,
    size: file.size,
  });

  if (!checked.ok) {
    return { error: checked.error };
  }

  const result = await scanOrdonnanceWithPlaceholder(checked.data.fileName);
  return { success: true, data: result };
}
