import { requireRole } from "@/lib/auth/guards";
import { getPatientDashboardData } from "@/features/patient/services/dashboard";
import { PatientDashboardSchema } from "@/features/patient/schemas/dashboard";

export async function getDashboard(patientId: string) {
  await requireRole("patient");
  const data = await getPatientDashboardData(patientId);
  const parsed = PatientDashboardSchema.safeParse(data);
  if (!parsed.success) {
    return { ok: false, error: "Invalid dashboard data" };
  }
  return { ok: true, data: parsed.data };
}
