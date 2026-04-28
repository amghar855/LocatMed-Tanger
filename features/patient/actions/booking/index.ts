import { requireRole } from "@/lib/auth/guards";
import { getReservations, createReservation } from "@/features/patient/services/booking";
import { BookingFormSchema } from "@/features/patient/schemas/booking";

export async function getPatientReservations(patientId: string) {
  await requireRole("patient");
  const reservations = await getReservations(patientId);
  return { ok: true, data: reservations };
}

export async function bookReservation(input: any) {
  const session = await requireRole("patient");
  const parsed = BookingFormSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Invalid input" };
  }
  return await createReservation(session.user.id, parsed.data);
}
