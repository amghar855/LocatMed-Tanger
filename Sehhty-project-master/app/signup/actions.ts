"use server";

import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { signupSchema } from "@/lib/schemas/auth";
import { signIn } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

export async function signupAction(formData: FormData) {
  const raw = {
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
    role: formData.get("role"),
    phone: formData.get("phone") || undefined,
    hospitalId: formData.get("hospitalId") || undefined,
    pharmacyId: formData.get("pharmacyId") || undefined,
  };

  const parsed = signupSchema.safeParse(raw);
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

  const passwordHash = await bcrypt.hash(data.password, 10);

  await db.insert(users).values({
    id: crypto.randomUUID(),
    email: data.email,
    passwordHash,
    role: data.role,
    fullName: data.fullName,
    phone: data.phone ?? null,
    specialty: null,
    hospitalId: data.hospitalId ?? null,
    pharmacyId: data.pharmacyId ?? null,
    createdBy: null,
    createdAt: new Date(),
  });

  try {
    await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false,
    });
  } catch {
    return {
      error:
        "Compte créé, mais la connexion automatique a échoué. Veuillez vous connecter.",
    };
  }

  return { success: true };
}
