import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export type Role = "patient" | "hospital_admin" | "doctor" | "pharmacist";

/** Maps each role to its home dashboard path */
export const ROLE_DASHBOARD: Record<Role, string> = {
  patient: "/patient/dashboard",
  hospital_admin: "/hospital-admin",
  doctor: "/doctor",
  pharmacist: "/pharmacy",
};

/**
 * Call at the top of any Server Component or Server Action.
 * Redirects to /login if no valid session exists.
 */
export async function requireSession() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return session;
}

/**
 * Call at the top of any Server Action or page that is role-specific.
 * Redirects to the caller's own role dashboard if role doesn't match.
 */
export async function requireRole(role: Role) {
  const session = await requireSession();
  if (session.user.role !== role) {
    redirect(ROLE_DASHBOARD[session.user.role as Role] ?? "/login");
  }
  return session;
}
