export type DashboardAppointmentStatus = "upcoming" | "completed" | "canceled";

export interface DashboardUpcomingReservation {
  id: string;
  hospitalName: string;
  doctorName: string;
  specialty: string;
  datetime: Date;
  status: DashboardAppointmentStatus;
}

export interface PatientDashboardData {
  upcomingReservation: DashboardUpcomingReservation | null;
  favoritesCount: number;
  reservationsCount: number;
  upcomingCount: number;
  completedCount: number;
  canceledCount: number;
}
