import { useEffect, useState } from "react";

export function usePatientDashboard() {
  // Placeholder for fetching dashboard data
  const [data, setData] = useState({
    upcomingReservation: null,
    favoritesCount: 0,
    reservationsCount: 0,
  });

  useEffect(() => {
    // TODO: Fetch real data from API/service
    setData({
      upcomingReservation: null,
      favoritesCount: 0,
      reservationsCount: 0,
    });
  }, []);

  return data;
}
