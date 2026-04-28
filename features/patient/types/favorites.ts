export type FavoriteHospitalItem = {
  id: number;
  hospitalId: string;
  hospitalName: string;
  hospitalType: "public" | "private" | "chu";
  address: string;
  specialties: string[] | null;
  createdAt: Date;
};
