"use server";

import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

import { signIn } from "@/lib/auth";
import { db } from "@/lib/db";
import { hospitals, users } from "@/lib/db/schema";
import { hospitalAdminSignupSchema } from "@/lib/schemas/auth";

const normalizeKey = (value: string) => value.trim().replace(/\s+/g, " ").toLowerCase();

export async function signupHospitalAdminAction(formData: FormData) {
  const raw = {
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    phone: formData.get("phone") || undefined,
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
    hospitalName: formData.get("hospitalName"),
    hospitalType: formData.get("hospitalType"),
    hospitalAddress: formData.get("hospitalAddress"),
    city: formData.get("city"),
    hospitalPhone: formData.get("hospitalPhone") || undefined,
    specialties: formData.get("specialties"),
    latitude: formData.get("latitude"),
    longitude: formData.get("longitude"),
  };

  const parsed = hospitalAdminSignupSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const {
    fullName,
    email,
    phone,
    password,
    hospitalName,
    hospitalType,
    hospitalAddress,
    city,
    hospitalPhone,
    specialties,
    latitude,
    longitude,
  } = parsed.data;

  const existingUser = await db.query.users.findFirst({ where: eq(users.email, email) });
  if (existingUser) return { error: "Un compte avec cet email existe déjà" };

  const existingHospitals = await db
    .select({ name: hospitals.name, address: hospitals.address })
    .from(hospitals);

  const hospitalAlreadyExists = existingHospitals.some(
    (hospital) =>
      normalizeKey(hospital.name) === normalizeKey(hospitalName) &&
      normalizeKey(hospital.address ?? "") === normalizeKey(hospitalAddress),
  );

  if (hospitalAlreadyExists) {
    return { error: "Un établissement avec ce nom et cette adresse existe déjà" };
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const hospitalId = crypto.randomUUID();

  try {
    await db.transaction(async (tx) => {
      await tx.insert(hospitals).values({
        id: hospitalId,
        name: hospitalName,
        type: hospitalType,
        lat: latitude ?? 0,
        lng: longitude ?? 0,
        address: hospitalAddress,
        city,
        phone: hospitalPhone ?? null,
        specialties: specialties ?? null,
      });

      await tx.insert(users).values({
        id: crypto.randomUUID(),
        email,
        passwordHash,
        role: "hospital_admin",
        fullName,
        phone: phone ?? null,
        specialty: null,
        hospitalId,
        pharmacyId: null,
        createdBy: null,
        createdAt: new Date(),
      });
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("users.email")) {
      return { error: "Un compte avec cet email existe déjà" };
    }
    return { error: "Impossible de créer cet établissement pour le moment" };
  }

  try {
    await signIn("credentials", { email, password, redirect: false });
  } catch {
    return { error: "Compte créé. Veuillez vous connecter." };
  }

  return { success: true };
}
