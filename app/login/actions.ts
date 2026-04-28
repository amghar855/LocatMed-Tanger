"use server";

import { signIn } from "@/lib/auth";
import { loginSchema } from "@/lib/schemas/auth";
import { AuthError } from "next-auth";

export async function loginAction(formData: FormData) {
  const raw = {
    email: formData.get("email"),
    password: formData.get("password"),
  };

  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirect: false,
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return { error: "Email ou mot de passe incorrect" };
    }
    throw err;
  }

  // Return role so client can redirect
  return { success: true };
}
