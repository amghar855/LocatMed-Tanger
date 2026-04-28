import { z } from "zod";

export const BookingFormSchema = z.object({
  hospitalId: z.string().min(1),
  specialty: z.string().min(1),
  doctorId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  reason: z.string().max(300).optional(),
});
