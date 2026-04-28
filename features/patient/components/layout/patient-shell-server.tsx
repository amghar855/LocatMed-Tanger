import type { ReactNode } from "react";
import { auth } from "@/lib/auth";
import { PatientShell } from "./patient-shell";

export async function PatientShellServer({ children }: { children: ReactNode }) {
  const session = await auth();
  const patient =
    session?.user?.name && session?.user?.email
      ? { name: session.user.name, email: session.user.email }
      : undefined;

  return <PatientShell patient={patient}>{children}</PatientShell>;
}
