"use server";
import { loginWithRole } from "@/lib/auth/login";

export async function loginHospitalAdminAction(formData: FormData) {
  return loginWithRole(formData, "hospital_admin");
}
