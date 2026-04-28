/**
 * proxy.ts — role-based route protection & redirects (Next.js 16)
 *
 * Public auth paths: /[role]/login and /[role]/signup
 * Protected paths:   everything else under /patient /hospital-admin /doctor /pharmacy
 *
 * Dashboard map:
 *   patient        → /patient
 *   hospital_admin → /hospital-admin
 *   doctor         → /doctor
 *   pharmacist     → /pharmacy
 */
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

type Role = "patient" | "hospital_admin" | "doctor" | "pharmacist";

const DASHBOARD: Record<Role, string> = {
  patient: "/patient/dashboard",
  hospital_admin: "/hospital-admin",
  doctor: "/doctor",
  pharmacist: "/pharmacy",
};

// /patient/login, /patient/signup, /hospital-admin/login, etc. are public
function isPublicAuthPath(pathname: string): boolean {
  return pathname.endsWith("/login") || pathname.endsWith("/signup");
}

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;
  const role = session?.user?.role as Role | undefined;

  const isRoleRoot =
    pathname.startsWith("/patient") ||
    pathname.startsWith("/hospital-admin") ||
    pathname.startsWith("/doctor") ||
    pathname.startsWith("/pharmacy");

  const isProtected = isRoleRoot && !isPublicAuthPath(pathname);
  const isRoleAuthPage = isRoleRoot && isPublicAuthPath(pathname);

  // ── Authenticated user on a login/signup page or at root → go to dashboard
  // "Just logged out" case: GET /logout calls signOut(), which clears the
  // session cookie before redirecting here. req.auth is then null, so this
  // branch is never reached and the landing page renders normally.
  if (session && role && (isRoleAuthPage || pathname === "/")) {
    return NextResponse.redirect(new URL(DASHBOARD[role], req.url));
  }

  // ── Unauthenticated user trying to reach a protected page → role-specific login
  if (!session && isProtected) {
    if (pathname.startsWith("/patient"))
      return NextResponse.redirect(new URL("/patient/login", req.url));
    if (pathname.startsWith("/hospital-admin"))
      return NextResponse.redirect(new URL("/hospital-admin/login", req.url));
    if (pathname.startsWith("/doctor"))
      return NextResponse.redirect(new URL("/doctor/login", req.url));
    if (pathname.startsWith("/pharmacy"))
      return NextResponse.redirect(new URL("/pharmacy/login", req.url));
  }

  if (!session || !role) return;
  const home = DASHBOARD[role];

  // ── Cross-role access guard
  if (pathname.startsWith("/patient") && !isPublicAuthPath(pathname) && role !== "patient")
    return NextResponse.redirect(new URL(home, req.url));
  if (pathname.startsWith("/hospital-admin") && !isPublicAuthPath(pathname) && role !== "hospital_admin")
    return NextResponse.redirect(new URL(home, req.url));
  if (pathname.startsWith("/doctor") && !isPublicAuthPath(pathname) && role !== "doctor")
    return NextResponse.redirect(new URL(home, req.url));
  if (pathname.startsWith("/pharmacy") && !isPublicAuthPath(pathname) && role !== "pharmacist")
    return NextResponse.redirect(new URL(home, req.url));
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
