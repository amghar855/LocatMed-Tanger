import { useEffect, useState } from "react";
import { Reservation } from "@/features/patient/types/booking";

export function useReservations() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    // TODO: Fetch real reservations from service
    setTimeout(() => {
      setReservations([]); // Placeholder
      setLoading(false);
    }, 500);
  }, []);

  return { reservations, loading };
}
