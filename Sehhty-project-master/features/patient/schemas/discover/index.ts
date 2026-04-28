import { z } from "zod";

export const DiscoverHospitalFilterSchema = z.object({
  specialty: z.string().optional(),
  type: z.enum(["public", "private", "chu"]).optional(),
});

export const DiscoverPharmacyFilterSchema = z.object({
  // Placeholder for future filters
});
