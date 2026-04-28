"use server";

import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { signIn } from "@/lib/auth";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

const schema = z
  .object({
    fullName: z.string().min(2, "Nom complet requis"),
    email: z.string().email("Email invalide"),
    phone: z.string().optional(),
    password: z.string().min(8, "Minimum 8 caractères"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  });

export async function signupPatientAction(formData: FormData) {
  const raw = {
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    phone: formData.get("phone") || undefined,
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  };

  const parsed = schema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { fullName, email, phone, password } = parsed.data;

  const existing = await db.query.users.findFirst({ where: eq(users.email, email) });
  if (existing) return { error: "Un compte avec cet email existe déjà" };

  await db.insert(users).values({
    id: crypto.randomUUID(),
    email,
    passwordHash: await bcrypt.hash(password, 10),
    role: "patient",
    fullName,
    phone: phone ?? null,
    specialty: null,
    hospitalId: null,
    pharmacyId: null,
    createdBy: null,
    createdAt: new Date(),
  });

  try {
    await signIn("credentials", { email, password, redirect: false });
  } catch {
    return { error: "Compte créé. Veuillez vous connecter." };
  }

  return { success: true };
}
