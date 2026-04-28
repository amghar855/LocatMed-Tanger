import { redirect } from "next/navigation";
// Old unified signup removed — each role has its own signup page now.
export default function OldSignup() {
  redirect("/");
}
