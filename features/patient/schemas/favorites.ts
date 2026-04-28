import { z } from "zod";

export const favoriteHospitalInputSchema = z.object({
  hospitalId: z.string().min(1, "Hospital id is required"),
});
