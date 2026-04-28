"use server";
import { loginWithRole } from "@/lib/auth/login";

export async function loginPharmacistAction(formData: FormData) {
  return loginWithRole(formData, "pharmacist");
}
