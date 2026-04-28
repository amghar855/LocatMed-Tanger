"use server";

import { requireRole } from "@/lib/auth/guards";
import {
  validateMedicineBroadcastInput,
  validateMedicineSearchInput,
} from "@/features/patient/schemas/medicine-search";
import {
  createBroadcastNotificationRequestsForMedicine,
  searchMedicinesWithAvailability,
} from "@/features/patient/services/medicine-search";

export async function searchMedicinesAction(input: { query: string }) {
  await requireRole("patient");

  const checked = validateMedicineSearchInput(input);
  if (!checked.ok) {
    return { error: checked.error };
  }

  try {
    const result = await searchMedicinesWithAvailability(checked.data.query);
    return { success: true, data: result };
  } catch {
    return { error: "Recherche indisponible pour le moment" };
  }
}

export async function requestMedicineBroadcastAction(input: { medicineId: string }) {
  const session = await requireRole("patient");

  const checked = validateMedicineBroadcastInput(input);
  if (!checked.ok) {
    return { error: checked.error };
  }

  try {
    const result = await createBroadcastNotificationRequestsForMedicine({
      medicineId: checked.data.medicineId,
      patientUserId: session.user.id,
      fallbackEmail: session.user.email,
    });

    if ("error" in result) {
      return { error: result.error };
    }

    return { success: true, data: result };
  } catch {
    return { error: "Impossible d'envoyer la demande pour le moment" };
  }
}
