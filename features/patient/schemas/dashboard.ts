import { z } from "zod";

export const PatientDashboardSchema = z.object({
  upcomingReservation: z
    .object({
      id: z.string(),
      hospitalName: z.string(),
      doctorName: z.string(),
      specialty: z.string(),
      date: z.string(),
      time: z.string(),
      status: z.enum(["upcoming", "completed", "canceled"]),
    })
    .nullable(),
  favoritesCount: z.number(),
  reservationsCount: z.number(),
});
