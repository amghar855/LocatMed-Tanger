"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

export async function updatePatientProfile(formData: FormData) {
  const session = await requireRole("patient");

  const fullName = (formData.get("fullName") as string | null)?.trim();
  const phone = (formData.get("phone") as string | null)?.trim() || null;

  if (!fullName || fullName.length < 2) {
    return { error: "Le nom complet est requis (min. 2 caractères)." };
  }

  await db
    .update(users)
    .set({ fullName, phone })
    .where(eq(users.id, session.user.id));

  revalidatePath("/patient/profile");
  return { success: true };
}
