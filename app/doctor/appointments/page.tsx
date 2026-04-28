import { requireRole } from "@/lib/auth/guards";
import DoctorNav from "@/components/locatomed/doctor-nav";
import { AppointmentList } from "@/components/locatomed/appointment-list";
import { getAllAppointments } from "@/lib/actions/doctor-actions";

export default async function AppointmentsPage() {
  const session = await requireRole("doctor");
  const appointments = await getAllAppointments();

  return (
    <>
      <DoctorNav userName={session.user.name ?? ""} active="appointments" />

      <div className="min-h-screen md:pl-72">
        <div className="mx-auto w-full max-w-6xl space-y-6 p-4 sm:p-6">
          <section className="rounded-2xl border border-teal-200/70 bg-gradient-to-br from-teal-50 via-background to-cyan-50 p-6">
            <h1 className="text-3xl font-bold tracking-tight">Mes rendez-vous</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Gérez votre planning clinique et le suivi des consultations.
            </p>
          </section>

          <div className="rounded-2xl border bg-background p-4 sm:p-5">
            <AppointmentList appointments={appointments} />
          </div>
        </div>
      </div>
    </>
  );
}
