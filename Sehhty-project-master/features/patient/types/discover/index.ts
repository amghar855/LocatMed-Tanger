// Types for discover feature
export interface HospitalDiscover {
  id: string;
  name: string;
  type: "public" | "private" | "chu";
  specialties: string[] | null;
  lat: number;
  lng: number;
  address: string;
  phone: string | null;
}

export interface PharmacyDiscover {
  id: string;
  name: string;
  lat: number;
  lng: number;
  address: string | null;
  isOnDuty: boolean;
  neighborhood: string | null;
  openingHours: string | null;
  availableMedicines: string[];
  availableIngredients: string[];
}
