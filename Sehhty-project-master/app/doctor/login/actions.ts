"use server";
import { loginWithRole } from "@/lib/auth/login";

export async function loginDoctorAction(formData: FormData) {
  return loginWithRole(formData, "doctor");
}
