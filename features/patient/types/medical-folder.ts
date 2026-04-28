export interface MedicalFolderPrescriptionItem {
  medicineId: string;
  medicineName: string;
  dosage: string;
  duration: string;
}

export interface MedicalFolderRecord {
  id: string;
  date: Date;
  diagnosis: string;
  notes: string;
  doctorId: string;
  doctorName: string;
  doctorSpecialty: string | null;
  hospitalName: string | null;
  prescription: MedicalFolderPrescriptionItem[];
}

export interface MedicalFolderDoctorOption {
  id: string;
  fullName: string;
  specialty: string | null;
}

export interface MedicalFolderFilters {
  doctorId?: string;
  from?: Date;
  to?: Date;
}
