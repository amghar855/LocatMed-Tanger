import Link from "next/link";
import { LogOut } from "lucide-react";

type Props = {
  /** Name shown in greeting, e.g. "Fatima Zahra Alami" */
  userName: string;
  /** Short role label, e.g. "Patient", "Médecin" */
  roleLabel: string;
};

/**
 * Shared top nav for all role dashboards.
 * "Se déconnecter" navigates to GET /logout, which calls signOut() and
 * redirects to /. Because the session cookie is cleared by then, proxy.ts
 * sees req.auth === null at "/" and renders the landing page instead of
 * bouncing back to the dashboard.
 */
export default function DashboardNav({ userName, roleLabel }: Props) {
  return (
    <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <img
            src="/logo-locatomed.png"
            alt="LocatMed"
            className="h-10 w-auto object-contain"
          />
          <span className="hidden rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground sm:inline">
            {roleLabel}
          </span>
        </div>

        <div className="flex items-center gap-4">
          <span className="hidden text-sm text-muted-foreground sm:block truncate max-w-[180px]">
            {userName}
          </span>
          <Link
            href="/logout"
            className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <LogOut className="h-4 w-4" />
            <span>Se déconnecter</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
