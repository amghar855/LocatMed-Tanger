import { requireRole } from "@/lib/auth/guards";
import { getPharmacyStock } from "@/lib/actions/pharmacy-stock-actions";
import PharmacyNav from "@/components/locatomed/pharmacy-nav";
import { StockTable } from "@/components/locatomed/stock-table";
import { buttonVariants } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default async function StockPage() {
  const session = await requireRole("pharmacist");
  const stock = await getPharmacyStock();

  return (
    <>
      <PharmacyNav userName={session.user.name ?? ""} active="stock" />
      <div className="min-h-screen md:pl-72">
        <div className="mx-auto w-full max-w-6xl space-y-6 p-4 sm:p-6">
          <Link
            href="/pharmacy"
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "gap-1.5")}
          >
            <ArrowLeft className="h-4 w-4" />
            Tableau de bord
          </Link>

          <section className="rounded-2xl border border-cyan-200/70 bg-gradient-to-br from-cyan-50 via-background to-teal-50 p-6">
            <h1 className="text-3xl font-bold tracking-tight">Gestion du stock</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Mettez à jour les quantités et surveillez les ruptures en temps réel.
            </p>
          </section>

          <div className="rounded-2xl border bg-background p-4 sm:p-5">
            <StockTable initialStock={stock} />
          </div>
        </div>
      </div>
    </>
  );
}
