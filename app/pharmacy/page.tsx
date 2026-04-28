import { requireRole } from "@/lib/auth/guards";
import {
  getIncomingBroadcastRequests,
  getPharmacyStats,
  getLowStockItems,
} from "@/lib/actions/pharmacy-stock-actions";
import { getReservations } from "@/lib/actions/reservation-actions";
import PharmacyNav from "@/components/locatomed/pharmacy-nav";
import {
  AlertTriangle,
  ArrowRight,
  CalendarCheck,
  ClipboardList,
  MapPin,
  Package,
  Pill,
  Settings,
  ShieldCheck,
  ShieldOff,
  Sparkles,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

// Keep the broadcast fetch alive in case other side effects depend on it,
// even though the new layout doesn't render that section.
void getIncomingBroadcastRequests;

function getInitials(name: string | null | undefined): string {
  if (!name) return "?";
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((n) => n[0]?.toUpperCase() ?? "")
      .join("") || "?"
  );
}

function timeAgo(input: Date | string | null | undefined): string {
  if (!input) return "—";
  const date = input instanceof Date ? input : new Date(input);
  const diffMs = Date.now() - date.getTime();
  if (diffMs < 0) return "à venir";
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "à l'instant";
  if (minutes < 60) return `il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `il y a ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `il y a ${days} j`;
  return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
}

export default async function PharmacyDashboard() {
  const session = await requireRole("pharmacist");
  const [stats, lowStockItems, pendingReservations] = await Promise.all([
    getPharmacyStats(),
    getLowStockItems(5),
    getReservations("pending"),
  ]);
  const todayLabel = new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  }).format(new Date());

  const pharmacy = stats.pharmacy;
  const isOnDuty = pharmacy?.isOnDuty ?? false;
  const userName = session.user.name ?? "Pharmacien";

  // Stock health breakdown
  const total = stats.totalMedicines;
  const lowCount = stats.lowStock;
  const outCount = stats.outOfStock;
  const healthyCount = Math.max(0, total - lowCount - outCount);
  const pct = (n: number) => (total > 0 ? Math.round((n / total) * 100) : 0);
  const healthyPct = pct(healthyCount);
  const lowPct = pct(lowCount);
  const outPct = pct(outCount);

  const subtitle = pharmacy
    ? [pharmacy.name, pharmacy.neighborhood, "Tanger"].filter(Boolean).join(" · ")
    : "Pharmacie non configurée";

  return (
    <>
      <PharmacyNav userName={userName} active="dashboard" />
      <div className="min-h-screen bg-[#f0fdfa] md:pl-72">
        {/* ── Top header bar ── */}
        <header className="border-b border-[#ccfbf1] bg-white">
          <div className="mx-auto flex max-w-6xl flex-col gap-5 px-4 py-6 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="font-serif text-3xl leading-tight tracking-tight text-[#0f2420] sm:text-4xl">
                Bonjour, {userName}
              </h1>
              <p className="mt-1 text-sm text-[#5f8a84]">{subtitle}</p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-50 px-2.5 py-1 text-xs font-medium capitalize text-[#0f766e]">
                  <CalendarCheck className="h-3 w-3" />
                  {todayLabel}
                </span>
                {pharmacy && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-50 px-2.5 py-1 text-xs font-medium text-[#0f766e]">
                    <MapPin className="h-3 w-3" />
                    {pharmacy.name}
                  </span>
                )}
                <GardeBadge isOnDuty={isOnDuty} />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                href="/pharmacy/stock"
                className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-all hover:-translate-y-px hover:opacity-90"
                style={{
                  background: "linear-gradient(135deg, #0d9488, #06b6d4)",
                  boxShadow: "0 8px 20px rgba(13, 148, 136, 0.25)",
                }}
              >
                <Package className="h-4 w-4" />
                Gérer le stock
              </Link>
              <Link
                href="/pharmacy/reservations"
                className="inline-flex items-center gap-2 rounded-xl border-2 border-[#0d9488] bg-white px-4 py-2.5 text-sm font-semibold text-[#0d9488] transition-colors hover:bg-teal-50"
              >
                <ClipboardList className="h-4 w-4" />
                Réservations
              </Link>
            </div>
          </div>
        </header>

        {/* ── Main content ── */}
        <main className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6">
          {/* KPI row */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard
              label="Médicaments en stock"
              value={stats.totalMedicines}
              icon={Pill}
              hint="Références disponibles"
              footer={
                stats.totalMedicines > 30 ? (
                  <FooterPill color="emerald" label="Stock sain" />
                ) : null
              }
            />
            <KpiCard
              label="Stock faible"
              value={stats.lowStock}
              icon={AlertTriangle}
              hint="Sous le seuil minimum"
              tone={stats.lowStock > 0 ? "warning" : "default"}
              valueColor={stats.lowStock > 0 ? "#f59e0b" : undefined}
              badge={
                stats.lowStock > 0 ? (
                  <FooterPill color="orange" label="Attention" icon={AlertTriangle} />
                ) : null
              }
            />
            <KpiCard
              label="Ruptures de stock"
              value={stats.outOfStock}
              icon={XCircle}
              hint="Articles indisponibles"
              tone={stats.outOfStock > 0 ? "danger" : "default"}
              valueColor={stats.outOfStock > 0 ? "#ef4444" : undefined}
              badge={
                stats.outOfStock > 0 ? (
                  <FooterPill color="red" label="Action requise" icon={XCircle} />
                ) : null
              }
            />
            <KpiCard
              label="Réservations en attente"
              value={stats.pendingReservations}
              icon={CalendarCheck}
              hint="Demandes patients à traiter"
              valueColor={stats.pendingReservations > 0 ? "#0d9488" : undefined}
              badge={
                stats.pendingReservations > 0 ? (
                  <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-teal-50 px-2.5 py-1 text-xs font-semibold text-[#0d9488]">
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-400 opacity-75" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-[#0d9488]" />
                    </span>
                    Nouveau
                  </span>
                ) : null
              }
            />
          </div>

          {/* Main grid 60% / 40% */}
          <div className="grid gap-4 lg:grid-cols-5">
            {/* LEFT (3/5 ≈ 60%) */}
            <div className="space-y-4 lg:col-span-3">
              {/* Stock Health Chart */}
              <div className="rounded-2xl border border-[#ccfbf1] bg-white p-6">
                <div className="mb-1 flex items-center justify-between">
                  <h2 className="font-serif text-xl text-[#0f2420]">
                    Santé du stock
                  </h2>
                  <span className="text-xs font-medium text-[#5f8a84]">
                    {total} référence{total === 1 ? "" : "s"}
                  </span>
                </div>
                <p className="mb-5 text-xs text-[#5f8a84]">
                  Répartition de votre stock par état
                </p>
                <div className="space-y-4">
                  <StockBar
                    label="En stock"
                    count={healthyCount}
                    pct={healthyPct}
                    color="#0d9488"
                  />
                  <StockBar
                    label="Stock faible"
                    count={lowCount}
                    pct={lowPct}
                    color="#f59e0b"
                  />
                  <StockBar
                    label="Ruptures"
                    count={outCount}
                    pct={outPct}
                    color="#ef4444"
                  />
                </div>
                <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-[#ccfbf1] pt-4">
                  <LegendDot color="#0d9488" label="En stock" />
                  <LegendDot color="#f59e0b" label="Stock faible" />
                  <LegendDot color="#ef4444" label="Ruptures" />
                </div>
              </div>

              {/* Low stock list */}
              <div className="rounded-2xl border border-[#ccfbf1] bg-white p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="font-serif text-xl text-[#0f2420]">
                    Médicaments à réapprovisionner
                  </h2>
                  <Link
                    href="/pharmacy/stock"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#0d9488] transition-colors hover:text-[#0f766e]"
                  >
                    Voir le stock
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>

                {lowStockItems.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-emerald-200 bg-emerald-50/40 px-4 py-6 text-center">
                    <Sparkles className="mx-auto mb-2 h-6 w-6 text-emerald-600" />
                    <p className="text-sm font-semibold text-emerald-700">
                      Tous les stocks sont suffisants ✓
                    </p>
                    <p className="mt-1 text-xs text-emerald-700/70">
                      Aucune action de réapprovisionnement nécessaire.
                    </p>
                  </div>
                ) : (
                  <ul className="divide-y divide-[#ccfbf1]">
                    {lowStockItems.slice(0, 5).map((item) => (
                      <li
                        key={item.stockId}
                        className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-[#0f2420]">
                            {item.medicineName}
                          </p>
                          <p className="text-xs text-[#5f8a84]">
                            Seuil minimum · {item.minThreshold}
                          </p>
                        </div>
                        <span
                          className={cn(
                            "rounded-md px-2 py-0.5 text-xs font-bold",
                            item.status === "out_of_stock"
                              ? "bg-red-50 text-[#ef4444]"
                              : "bg-orange-50 text-[#f59e0b]"
                          )}
                        >
                          {item.quantity} restant{item.quantity !== 1 ? "s" : ""}
                        </span>
                        <Link
                          href="/pharmacy/stock"
                          className="shrink-0 rounded-lg bg-teal-50 px-3 py-1.5 text-xs font-semibold text-[#0d9488] transition-colors hover:bg-teal-100"
                        >
                          Mettre à jour
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Quick actions 2x2 */}
              <div className="rounded-2xl border border-[#ccfbf1] bg-white p-6">
                <h2 className="mb-4 font-serif text-xl text-[#0f2420]">
                  Actions rapides
                </h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  <QuickAction
                    href="/pharmacy/stock"
                    title="Mettre à jour le stock"
                    description="Ajustez les quantités et ajoutez des références."
                    icon={Package}
                  />
                  <QuickAction
                    href="/pharmacy/reservations"
                    title="Traiter les réservations"
                    description="Confirmez ou annulez les demandes patients."
                    icon={ClipboardList}
                  />
                  <QuickAction
                    href="/pharmacy/settings"
                    title="Paramètres de la pharmacie"
                    description="Mettez à jour vos infos et statut de garde."
                    icon={Settings}
                  />
                  <QuickAction
                    href="/pharmacy/reservations"
                    title="Voir toutes les réservations"
                    description="Historique complet des demandes."
                    icon={CalendarCheck}
                  />
                </div>
              </div>
            </div>

            {/* RIGHT (2/5 ≈ 40%) */}
            <div className="space-y-4 lg:col-span-2">
              {/* Garde status */}
              <GardeCard isOnDuty={isOnDuty} />

              {/* Recent reservations */}
              <div className="rounded-2xl border border-[#ccfbf1] bg-white p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="font-serif text-xl text-[#0f2420]">
                    Réservations récentes
                  </h2>
                  <Link
                    href="/pharmacy/reservations"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#0d9488] transition-colors hover:text-[#0f766e]"
                  >
                    Voir tout
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>

                {pendingReservations.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-[#ccfbf1] bg-teal-50/40 px-4 py-8 text-center">
                    <div className="mx-auto mb-2 flex size-10 items-center justify-center rounded-full bg-white text-[#0d9488] ring-1 ring-[#ccfbf1]">
                      <CalendarCheck className="h-5 w-5" />
                    </div>
                    <p className="text-sm font-semibold text-[#0f2420]">
                      Aucune réservation en attente
                    </p>
                    <p className="mt-1 text-xs text-[#5f8a84]">
                      Les nouvelles demandes apparaîtront ici.
                    </p>
                  </div>
                ) : (
                  <ul className="space-y-1">
                    {pendingReservations.slice(0, 6).map((res) => (
                      <ReservationItem key={res.id} reservation={res} />
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}

// ─── Garde badge (header) ─────────────────────────────────────────────

function GardeBadge({ isOnDuty }: { isOnDuty: boolean }) {
  if (isOnDuty) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
        </span>
        Garde active
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500">
      <span className="h-2 w-2 rounded-full bg-slate-400" />
      Hors garde
    </span>
  );
}

// ─── Garde status card ────────────────────────────────────────────────

function GardeCard({ isOnDuty }: { isOnDuty: boolean }) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border bg-white p-6",
        isOnDuty ? "border-emerald-200" : "border-[#ccfbf1]"
      )}
    >
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-serif text-xl text-[#0f2420]">Statut de garde</h2>
        {isOnDuty ? (
          <ShieldCheck className="h-5 w-5 text-emerald-600" />
        ) : (
          <ShieldOff className="h-5 w-5 text-slate-400" />
        )}
      </div>

      <div className="mb-5 flex items-center gap-3">
        {isOnDuty ? (
          <span className="relative flex h-4 w-4">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-4 w-4 rounded-full bg-emerald-500" />
          </span>
        ) : (
          <span className="h-4 w-4 rounded-full bg-slate-300" />
        )}
        <div>
          <p className="text-base font-bold text-[#0f2420]">
            {isOnDuty ? "Pharmacie de garde" : "Hors garde"}
          </p>
          <p className="mt-0.5 text-xs text-[#5f8a84]">
            {isOnDuty
              ? "Vous êtes visible pour les patients en urgence."
              : "Activez la garde pour apparaître aux patients en dehors des horaires."}
          </p>
        </div>
      </div>

      <Link
        href="/pharmacy/settings"
        className={cn(
          "inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all",
          isOnDuty
            ? "bg-slate-100 text-slate-600 hover:bg-slate-200"
            : "text-white hover:-translate-y-px hover:opacity-90"
        )}
        style={
          isOnDuty
            ? undefined
            : {
                background: "linear-gradient(135deg, #0d9488, #06b6d4)",
                boxShadow: "0 8px 20px rgba(13, 148, 136, 0.25)",
              }
        }
      >
        {isOnDuty ? "Désactiver" : "Activer la garde"}
      </Link>
    </div>
  );
}

// ─── KPI card ─────────────────────────────────────────────────────────

type KpiCardProps = {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  hint?: string;
  tone?: "default" | "warning" | "danger";
  valueColor?: string;
  footer?: React.ReactNode;
  badge?: React.ReactNode;
};

function KpiCard({
  label,
  value,
  icon: Icon,
  hint,
  tone = "default",
  valueColor,
  footer,
  badge,
}: KpiCardProps) {
  const borderClass =
    tone === "warning"
      ? "border-l-4 border-l-[#f59e0b]"
      : tone === "danger"
        ? "border-l-4 border-l-[#ef4444]"
        : "";
  const iconBg =
    tone === "warning"
      ? "bg-orange-50 text-[#f59e0b]"
      : tone === "danger"
        ? "bg-red-50 text-[#ef4444]"
        : "bg-teal-50 text-[#0d9488]";

  return (
    <div
      className={cn(
        "group relative rounded-2xl border border-[#ccfbf1] bg-white p-6 transition-all hover:border-[#0d9488] hover:shadow-lg hover:shadow-teal-100/60",
        borderClass
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p
            className="font-serif text-5xl leading-none"
            style={{ color: valueColor ?? "#0f2420" }}
          >
            {value}
          </p>
          <p className="mt-3 text-sm font-semibold text-[#0f2420]">{label}</p>
          {hint && <p className="mt-1 text-xs text-[#5f8a84]">{hint}</p>}
        </div>
        <div
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-full",
            iconBg
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
      {badge}
      {footer}
    </div>
  );
}

// ─── Footer pill (for KPI cards) ──────────────────────────────────────

function FooterPill({
  color,
  label,
  icon: Icon,
}: {
  color: "emerald" | "orange" | "red";
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  const styles = {
    emerald: "bg-emerald-50 text-emerald-700",
    orange: "bg-orange-50 text-[#f59e0b]",
    red: "bg-red-50 text-[#ef4444]",
  } as const;
  return (
    <span
      className={cn(
        "mt-4 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
        styles[color]
      )}
    >
      {Icon && <Icon className="h-3 w-3" />}
      {label}
    </span>
  );
}

// ─── Stock health bar (horizontal) ────────────────────────────────────

function StockBar({
  label,
  count,
  pct,
  color,
}: {
  label: string;
  count: number;
  pct: number;
  color: string;
}) {
  return (
    <div className="grid grid-cols-[8rem_1fr_3rem] items-center gap-3">
      <span className="text-sm font-medium text-[#0f2420]">{label}</span>
      <div className="h-3 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${Math.max(2, pct)}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-right text-xs font-bold text-[#0f2420]">
        {pct}% <span className="font-normal text-[#5f8a84]">({count})</span>
      </span>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-[#5f8a84]">
      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}

// ─── Quick action card ────────────────────────────────────────────────

type QuickActionProps = {
  href: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
};

function QuickAction({
  href,
  title,
  description,
  icon: Icon,
}: QuickActionProps) {
  return (
    <Link
      href={href}
      className="group flex items-start gap-3 rounded-xl border border-[#ccfbf1] bg-white p-4 transition-all hover:border-[#0d9488] hover:shadow-md hover:shadow-teal-100/60"
    >
      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-[#0d9488] transition-colors group-hover:bg-teal-100">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-[#0f2420]">{title}</p>
        <p className="mt-0.5 text-xs leading-relaxed text-[#5f8a84]">
          {description}
        </p>
      </div>
    </Link>
  );
}

// ─── Reservation list item ────────────────────────────────────────────

type ReservationLite = {
  id: number | string;
  citizenName: string | null;
  citizenPhone: string | null;
  status: string;
  createdAt: Date | string | null;
  medicineName: string;
};

const STATUS_STYLES: Record<
  string,
  { label: string; className: string }
> = {
  pending: {
    label: "En attente",
    className: "bg-orange-50 text-[#f59e0b]",
  },
  confirmed: {
    label: "Confirmée",
    className: "bg-teal-50 text-[#0d9488]",
  },
  collected: {
    label: "Récupérée",
    className: "bg-emerald-50 text-emerald-700",
  },
  cancelled: {
    label: "Annulée",
    className: "bg-slate-100 text-slate-500",
  },
};

function ReservationItem({ reservation }: { reservation: ReservationLite }) {
  const status =
    STATUS_STYLES[reservation.status] ?? STATUS_STYLES.pending;
  const displayName = reservation.citizenName?.trim() || "Anonyme";

  return (
    <li className="flex items-center gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-teal-50/60">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-teal-100 text-sm font-bold text-[#0d9488]">
        {getInitials(displayName)}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-[#0f2420]">
          {displayName}
          {reservation.citizenPhone && (
            <span className="ml-2 text-xs font-normal text-[#5f8a84]">
              · {reservation.citizenPhone}
            </span>
          )}
        </p>
        <p className="truncate text-xs text-[#5f8a84]">
          {reservation.medicineName}
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        <span
          className={cn(
            "rounded-md px-2 py-0.5 text-[11px] font-bold",
            status.className
          )}
        >
          {status.label}
        </span>
        <span className="text-[10px] text-[#5f8a84]">
          {timeAgo(reservation.createdAt)}
        </span>
      </div>
    </li>
  );
}
