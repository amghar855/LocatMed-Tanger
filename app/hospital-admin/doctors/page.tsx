import { requireRole } from "@/lib/auth/guards";
import { getAllDoctors } from "@/lib/actions/hospital-admin-actions";
import HospitalAdminNav from "@/components/locatomed/hospital-admin-nav";
import { DoctorList } from "@/components/locatomed/doctor-list";
import AddDoctorDialog from "./add-doctor-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Stethoscope, UsersRound } from "lucide-react";

export default async function DoctorsPage() {
  const session = await requireRole("hospital_admin");
  const doctors = await getAllDoctors();

  return (
    <>
      <HospitalAdminNav userName={session.user.name ?? ""} active="doctors" />
      <div className="min-h-screen md:pl-72">
      <div className="mx-auto w-full max-w-6xl space-y-5 p-4 sm:p-6">
        <div className="rounded-2xl border border-teal-200/70 bg-gradient-to-br from-teal-50 via-background to-teal-50 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Médecins</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Gérez les médecins de votre hôpital et consultez leur activité.
              </p>
            </div>
            <AddDoctorDialog />
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Card className="border-teal-100 bg-white/80">
              <CardContent className="flex items-center gap-3 pt-4">
                <div className="rounded-lg bg-teal-100 p-2 text-teal-700">
                  <UsersRound className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Médecins enregistrés</p>
                  <p className="text-xl font-semibold leading-none">{doctors.length}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-teal-100 bg-white/80">
              <CardContent className="flex items-center gap-3 pt-4">
                <div className="rounded-lg bg-teal-100 p-2 text-teal-700">
                  <Stethoscope className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Spécialités distinctes</p>
                  <p className="text-xl font-semibold leading-none">
                    {new Set(doctors.map((doctor) => doctor.specialty).filter(Boolean)).size}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <DoctorList initialDoctors={doctors} />
      </div>
      </div>
    </>
  );
}
