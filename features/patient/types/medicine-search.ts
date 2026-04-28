export type StockStatus = "in_stock" | "low_stock" | "out_of_stock";

export interface MedicinePharmacyAvailability {
  pharmacyId: string;
  pharmacyName: string;
  neighborhood: string | null;
  address: string | null;
  lat: number;
  lng: number;
  quantity: number;
  stockStatus: StockStatus;
  isOnDuty: boolean;
  price: number;
}

export interface MedicineSearchItem {
  medicineId: string;
  medicineName: string;
  activeIngredient: string;
  dosageForm: string | null;
  ppm: number | null;
  pharmacies: MedicinePharmacyAvailability[];
}

export interface MedicineSearchResponse {
  query: string;
  items: MedicineSearchItem[];
}
