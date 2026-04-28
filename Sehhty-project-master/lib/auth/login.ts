/**
 * lib/auth/login.ts — shared role-checked login utility
 *
 * Checks DB role BEFORE creating a session so we can return a clear error
 * when the user logs in at the wrong role's URL.
 */
"use server";

import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { loginSchema } from "@/lib/schemas/auth";
import { signIn } from "@/lib/auth";
import { AuthError } from "next-auth";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { ROLE_DASHBOARD, type Role } from "@/lib/auth/guards";

const ROLE_LABELS: Record<Role, string> = {
  patient: "patient",
  hospital_admin: "administrateur hospitalier",
  doctor: "médecin",
  pharmacist: "pharmacien",
};

export async function loginWithRole(
  formData: FormData,
  expectedRole: Role
): Promise<{ error?: string; success?: boolean; redirectTo?: string }> {
  const raw = {
    email: formData.get("email"),
    password: formData.get("password"),
  };

  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { email, password } = parsed.data;

  // 1. Look up user
  const user = await db.query.users.findFirst({
    where: eq(users.email, email),
    columns: { id: true, role: true, passwordHash: true },
  });

  if (!user) {
    return { error: "Email ou mot de passe incorrect" };
  }

  // 2. Role mismatch — explicit, friendly error
  if (user.role !== expectedRole) {
    return {
      error: `Ce compte n'est pas un compte ${ROLE_LABELS[expectedRole]}`,
    };
  }

  // 3. Password check
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return { error: "Email ou mot de passe incorrect" };
  }

  // 4. Create session
  try {
    await signIn("credentials", { email, password, redirect: false });
  } catch (err) {
    if (err instanceof AuthError) {
      return { error: "Email ou mot de passe incorrect" };
    }
    throw err;
  }

  return { success: true, redirectTo: ROLE_DASHBOARD[expectedRole] };
}
