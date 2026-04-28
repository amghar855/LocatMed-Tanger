export interface MedicinePharmacyAvailability {
  pharmacyId: string;
  pharmacyName: string;
  address: string | null;
  neighborhood: string | null;
  lat: number;
  lng: number;
  isOnDuty: boolean;
  medicineName: string;
  quantity: number;
  stockStatus: "in_stock" | "low_stock" | "out_of_stock";
  price: number;
}

export interface ExtractedMedicineResult {
  inputName: string;
  matchedMedicineId: string | null;
  matchedMedicineName: string | null;
  activeIngredient: string | null;
  dosageForm: string | null;
  ppm: number | null;
  confidence: number;
  availability: MedicinePharmacyAvailability[];
}

export interface OrdonnanceScanResult {
  fileName: string;
  extractedMedicines: ExtractedMedicineResult[];
  unmatchedInputs: string[];
}
