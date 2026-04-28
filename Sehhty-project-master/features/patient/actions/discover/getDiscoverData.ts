import { requireRole } from "@/lib/auth/guards";
import { getHospitalsForDiscover, getPharmaciesForDiscover } from "@/features/patient/services/discover";

export async function getDiscoverData(view: "hospitals" | "pharmacies") {
  await requireRole("patient");
  if (view === "hospitals") {
    const hospitals = await getHospitalsForDiscover();
    return { ok: true, data: hospitals };
  } else {
    const pharmacies = await getPharmaciesForDiscover();
    return { ok: true, data: pharmacies };
  }
}
