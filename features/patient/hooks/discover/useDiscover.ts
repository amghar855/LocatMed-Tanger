import { useEffect, useState } from "react";
import { HospitalDiscover, PharmacyDiscover } from "@/features/patient/types/discover";

export function useDiscover(view: "hospitals" | "pharmacies") {
  const [hospitals, setHospitals] = useState<HospitalDiscover[]>([]);
  const [pharmacies, setPharmacies] = useState<PharmacyDiscover[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    // TODO: Fetch real data from service
    setTimeout(() => {
      if (view === "hospitals") {
        setHospitals([]); // Placeholder
      } else {
        setPharmacies([]); // Placeholder
      }
      setLoading(false);
    }, 500);
  }, [view]);

  return { hospitals, pharmacies, loading };
}
