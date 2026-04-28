"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/guards";
import { BookingFormSchema } from "@/features/patient/schemas/booking";
import { cancelReservation, createReservation } from "@/features/patient/services/booking";

export async function bookReservationAction(formData: FormData) {
  const session = await requireRole("patient");

  const parsed = BookingFormSchema.safeParse({
    hospitalId: formData.get("hospitalId"),
    specialty: formData.get("specialty"),
    doctorId: formData.get("doctorId"),
    date: formData.get("date"),
    time: formData.get("time"),
    reason: formData.get("reason") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide" };
  }

  const result = await createReservation(session.user.id, parsed.data);
  if (!result.ok) {
    return { error: result.error ?? "Impossible de créer la réservation" };
  }

  revalidatePath("/patient/dashboard");
  revalidatePath("/patient/reservations");
  return { success: true };
}

export async function cancelReservationAction(formData: FormData) {
  const session = await requireRole("patient");
  const reservationId = String(formData.get("reservationId") ?? "").trim();

  if (!reservationId) {
    return { error: "Réservation introuvable" };
  }

  await cancelReservation(session.user.id, reservationId);
  revalidatePath("/patient/dashboard");
  revalidatePath("/patient/reservations");
  return { success: true };
}
