"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/guards";
import { favoriteHospitalInputSchema } from "@/features/patient/schemas/favorites";
import {
  addFavoriteHospitalByPatient,
  removeFavoriteHospitalByPatient,
} from "@/features/patient/services/favorites";

export async function addFavoriteHospitalAction(formData: FormData) {
  const session = await requireRole("patient");

  const parsed = favoriteHospitalInputSchema.safeParse({
    hospitalId: formData.get("hospitalId"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Entrée invalide" };
  }

  const result = await addFavoriteHospitalByPatient(session.user.id, parsed.data.hospitalId);

  if (!result.ok) {
    return { error: result.error };
  }

  revalidatePath("/patient/favorites");
  revalidatePath("/patient/dashboard");
  return { success: true };
}

export async function removeFavoriteHospitalAction(formData: FormData) {
  const session = await requireRole("patient");

  const parsed = favoriteHospitalInputSchema.safeParse({
    hospitalId: formData.get("hospitalId"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Entrée invalide" };
  }

  await removeFavoriteHospitalByPatient(session.user.id, parsed.data.hospitalId);

  revalidatePath("/patient/favorites");
  revalidatePath("/patient/dashboard");
  return { success: true };
}
