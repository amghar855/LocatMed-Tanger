export interface Reservation {
  id: string;
  hospitalName: string;
  doctorName: string;
  specialty: string;
  datetime: Date;
  status: "upcoming" | "completed" | "canceled";
}

export interface BookingDoctorOption {
  id: string;
  fullName: string;
  specialty: string;
  hospitalId: string;
  hospitalName: string;
}

export interface BookingHospitalOption {
  id: string;
  name: string;
  type: "public" | "private" | "chu";
}

export interface BookingOptionsData {
  hospitals: BookingHospitalOption[];
  doctors: BookingDoctorOption[];
  specialties: string[];
}
