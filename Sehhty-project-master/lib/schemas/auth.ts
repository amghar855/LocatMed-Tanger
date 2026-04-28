import { z } from "zod";

const requiredText = (message: string) => z.string().trim().min(1, message);

const optionalText = z.preprocess((value: unknown) => {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : undefined;
}, z.string().optional());

const optionalNumber = z.preprocess((value: unknown) => {
  if (value === "" || value === null || value === undefined) return undefined;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : value;
}, z.number().finite().optional());

const listFromText = z.preprocess((value: unknown) => {
  if (typeof value !== "string") return undefined;
  const items = value
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);
  return items.length ? items : undefined;
}, z.array(z.string().min(2, "Valeur invalide")).optional());

export const loginSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(1, "Mot de passe requis"),
});

// Roles available for self-signup (doctors are added by their hospital admin)
export const signupSchema = z
  .object({
    fullName: requiredText("Nom complet requis"),
    email: z.string().trim().toLowerCase().email("Email invalide"),
    password: z.string().min(8, "Minimum 8 caractères"),
    confirmPassword: z.string(),
    role: z.enum(["patient", "hospital_admin", "pharmacist"]),
    phone: optionalText,
    // hospital_admin fields
    hospitalId: z.string().optional(),
    // pharmacist fields
    pharmacyId: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  })
  .refine((data) => data.role !== "hospital_admin" || data.hospitalId, {
    message: "Hôpital requis pour les administrateurs",
    path: ["hospitalId"],
  })
  .refine((data) => data.role !== "pharmacist" || data.pharmacyId, {
    message: "Pharmacie requise pour les pharmaciens",
    path: ["pharmacyId"],
  });

const accountFields = {
  fullName: requiredText("Nom complet requis"),
  email: z.string().trim().toLowerCase().email("Email invalide"),
  phone: optionalText,
  password: z.string().min(8, "Minimum 8 caractères"),
  confirmPassword: z.string(),
};

export const pharmacySignupSchema = z
  .object({
    ...accountFields,
    pharmacyName: requiredText("Nom de la pharmacie requis"),
    pharmacyAddress: requiredText("Adresse de la pharmacie requise"),
    pharmacyNeighborhood: requiredText("Quartier requis"),
    city: requiredText("Ville requise"),
    openingHours: requiredText("Horaires requis"),
    isOnDuty: z.preprocess(
      (value) => value === "on" || value === "true" || value === true,
      z.boolean(),
    ),
    latitude: optionalNumber,
    longitude: optionalNumber,
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  });

export const hospitalAdminSignupSchema = z
  .object({
    ...accountFields,
    hospitalName: requiredText("Nom de votre établissement requis"),
    hospitalType: z.enum(["public", "private", "chu"]),
    hospitalAddress: requiredText("Adresse de votre établissement requise"),
    city: requiredText("Ville requise"),
    hospitalPhone: optionalText,
    specialties: listFromText,
    latitude: optionalNumber,
    longitude: optionalNumber,
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  });

// Schema used by hospital_admin when adding a doctor
export const addDoctorSchema = z.object({
  fullName: z.string().min(2, "Nom complet requis"),
  email: z.string().email("Email invalide"),
  tempPassword: z.string().min(8, "Minimum 8 caractères"),
  specialty: z.string().min(1, "Spécialité requise"),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type PharmacySignupInput = z.infer<typeof pharmacySignupSchema>;
export type HospitalAdminSignupInput = z.infer<typeof hospitalAdminSignupSchema>;
export type AddDoctorInput = z.infer<typeof addDoctorSchema>;
