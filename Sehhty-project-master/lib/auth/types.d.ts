import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "patient" | "hospital_admin" | "doctor" | "pharmacist";
    } & DefaultSession["user"];
  }

  interface JWT {
    uid?: string;
    role?: "patient" | "hospital_admin" | "doctor" | "pharmacist";
  }
}
