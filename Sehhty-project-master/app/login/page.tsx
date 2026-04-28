import { redirect } from "next/navigation";
// Old unified login removed — each role has its own login page now.
export default function OldLogin() {
  redirect("/");
}
