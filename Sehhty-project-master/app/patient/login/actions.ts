"use server";
import { loginWithRole } from "@/lib/auth/login";

export async function loginPatientAction(formData: FormData) {
  return loginWithRole(formData, "patient");
}
