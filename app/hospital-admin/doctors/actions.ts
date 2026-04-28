"use server";

import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { addDoctorSchema } from "@/lib/schemas/auth";
import { requireRole } from "@/lib/auth/guards";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

export async function addDoctorAction(formData: FormData) {
  const session = await requireRole("hospital_admin");

  // Fetch admin's full record to get their hospitalId
  const admin = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
    columns: { hospitalId: true },
  });

  if (!admin?.hospitalId) {
    return { error: "Votre compte n'est pas lié à un hôpital" };
  }

  const raw = {
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    tempPassword: formData.get("tempPassword"),
    specialty: formData.get("specialty"),
  };

  const parsed = addDoctorSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const data = parsed.data;

  const existing = await db.query.users.findFirst({
    where: eq(users.email, data.email),
  });
  if (existing) {
    return { error: "Un compte avec cet email existe déjà" };
  }

  const passwordHash = await bcrypt.hash(data.tempPassword, 10);

  await db.insert(users).values({
    id: crypto.randomUUID(),
    email: data.email,
    passwordHash,
    role: "doctor",
    fullName: data.fullName,
    phone: null,
    specialty: data.specialty,
    hospitalId: admin.hospitalId,
    pharmacyId: null,
    createdBy: session.user.id,
    createdAt: new Date(),
  });

  return { success: true, email: data.email, tempPassword: data.tempPassword };
}
