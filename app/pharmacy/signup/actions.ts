"use server";

import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

import { signIn } from "@/lib/auth";
import { db } from "@/lib/db";
import { pharmacies, users } from "@/lib/db/schema";
import { pharmacySignupSchema } from "@/lib/schemas/auth";

const normalizeKey = (value: string) => value.trim().replace(/\s+/g, " ").toLowerCase();

export async function signupPharmacistAction(formData: FormData) {
  const raw = {
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    phone: formData.get("phone") || undefined,
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
    pharmacyName: formData.get("pharmacyName"),
    pharmacyAddress: formData.get("pharmacyAddress"),
    pharmacyNeighborhood: formData.get("pharmacyNeighborhood"),
    city: formData.get("city"),
    openingHours: formData.get("openingHours"),
    isOnDuty: formData.get("isOnDuty"),
    latitude: formData.get("latitude"),
    longitude: formData.get("longitude"),
  };

  const parsed = pharmacySignupSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const {
    fullName,
    email,
    phone,
    password,
    pharmacyName,
    pharmacyAddress,
    pharmacyNeighborhood,
    city,
    openingHours,
    isOnDuty,
    latitude,
    longitude,
  } = parsed.data;

  const existingUser = await db.query.users.findFirst({ where: eq(users.email, email) });
  if (existingUser) return { error: "Un compte avec cet email existe déjà" };

  const existingPharmacies = await db
    .select({ name: pharmacies.name, address: pharmacies.address })
    .from(pharmacies);

  const pharmacyAlreadyExists = existingPharmacies.some(
    (pharmacy) =>
      normalizeKey(pharmacy.name) === normalizeKey(pharmacyName) &&
      normalizeKey(pharmacy.address ?? "") === normalizeKey(pharmacyAddress),
  );

  if (pharmacyAlreadyExists) {
    return { error: "Une pharmacie avec ce nom et cette adresse existe déjà" };
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const pharmacyId = crypto.randomUUID();

  try {
    await db.transaction(async (tx) => {
      await tx.insert(pharmacies).values({
        id: pharmacyId,
        name: pharmacyName,
        lat: latitude ?? 0,
        lng: longitude ?? 0,
        address: pharmacyAddress,
        city,
        neighborhood: pharmacyNeighborhood,
        isOnDuty,
        openingHours,
      });

      await tx.insert(users).values({
        id: crypto.randomUUID(),
        email,
        passwordHash,
        role: "pharmacist",
        fullName,
        phone: phone ?? null,
        specialty: null,
        hospitalId: null,
        pharmacyId,
        createdBy: null,
        createdAt: new Date(),
      });
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("users.email")) {
      return { error: "Un compte avec cet email existe déjà" };
    }
    return { error: "Impossible de créer la pharmacie pour le moment" };
  }

  try {
    await signIn("credentials", { email, password, redirect: false });
  } catch {
    return { error: "Compte créé. Veuillez vous connecter." };
  }

  return { success: true };
}
