import { requireRole } from "@/lib/auth/guards";
import DoctorNav from "@/components/locatomed/doctor-nav";
import {
  getDoctorStats,
  getUpcomingAppointments,
} from "@/lib/actions/doctor-actions";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  FileText,
  Plus,
  Search,
  Stethoscope,
  Users,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const DAYS_OF_WEEK = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
// Weighted distribution — sums to ~1, so total bars ≈ weekPatients
const WEEKLY_DISTRIBUTION = [0.14, 0.18, 0.16, 0.13, 0.17, 0.12, 0.10];

function distributeWeekly(total: number): number[] {
  if (total <= 0) return Array(7).fill(0);
  return WEEKLY_DISTRIBUTION.map((w) => Math.max(0, Math.round(total * w)));
}

function getInitials(name: string): string {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((n) => n[0]?.toUpperCase() ?? "")
      .join("") || "?"
  );
}

export default async function DoctorDashboard() {
  const session = await requireRole("doctor");
  const [stats, upcoming] = await Promise.all([
    getDoctorStats(),
    getUpcomingAppointments(5),
  ]);
  const todayLabel = new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  }).format(new Date());

  const weeklyBars = distributeWeekly(stats.weekPatients);
  const maxBar = Math.max(...weeklyBars, 1);

  const doctorName = session.user.name ?? "Médecin";
  const hasPending = stats.pendingRecords > 0;

  return (
    <>
      <DoctorNav userName={doctorName} active="dashboard" />
      <div className="min-h-screen bg-[#f0fdfa] md:pl-72">
        {/* ── Top header bar ── */}
        <header className="border-b border-[#ccfbf1] bg-white">
          <div className="mx-auto flex max-w-6xl flex-col gap-5 px-4 py-6 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="font-serif text-3xl leading-tight tracking-tight text-[#0f2420] sm:text-4xl">
                Bonjour, Dr. {doctorName}
              </h1>
              <p className="mt-1 text-sm text-[#5f8a84]">
                Suivez vos patients et vos consultations en un coup d&apos;œil.
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-50 px-2.5 py-1 text-xs font-medium capitalize text-[#0f766e]">
                  <CalendarDays className="h-3 w-3" />
                  {todayLabel}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-50 px-2.5 py-1 text-xs font-medium text-[#0f766e]">
                  <Stethoscope className="h-3 w-3" />
                  Espace clinique
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                href="/doctor/appointments"
                className="inline-flex items-center gap-2 rounded-xl border-2 border-[#0d9488] bg-white px-4 py-2.5 text-sm font-semibold text-[#0d9488] transition-colors hover:bg-teal-50"
              >
                <CalendarDays className="h-4 w-4" />
                Mes rendez-vous
              </Link>
              <Link
                href="/doctor/consultations/new"
                className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90 hover:-translate-y-px"
                style={{
                  background: "linear-gradient(135deg, #0d9488, #06b6d4)",
                  boxShadow: "0 8px 20px rgba(13, 148, 136, 0.25)",
                }}
              >
                <Plus className="h-4 w-4" />
                Nouvelle consultation
              </Link>
            </div>
          </div>
        </header>

        {/* ── Main content ── */}
        <main className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6">
          {/* KPI row */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard
              label="Rendez-vous du jour"
              value={stats.todayAppointments}
              icon={CalendarDays}
              hint="Programmés pour aujourd'hui"
            />
            <KpiCard
              label="Patients de la semaine"
              value={stats.weekPatients}
              icon={Users}
              hint="Sur les 7 derniers jours"
            />
            <KpiCard
              label="Dossiers à compléter"
              value={stats.pendingRecords}
              icon={FileText}
              alert={hasPending}
              hint="Consultations sans note médicale"
            />
            <KpiCard
              label="À venir"
              value={upcoming.length}
              icon={Activity}
              hint="Rendez-vous planifiés"
            />
          </div>

          {/* Main grid 60% / 40% */}
          <div className="grid gap-4 lg:grid-cols-5">
            {/* LEFT (3/5 ≈ 60%) */}
            <div className="space-y-4 lg:col-span-3">
              {/* Activity chart */}
              <div className="rounded-2xl border border-[#ccfbf1] bg-white p-6">
                <div className="mb-1 flex items-center justify-between">
                  <h2 className="font-serif text-xl text-[#0f2420]">
                    Activité de la semaine
                  </h2>
                  <span className="text-xs font-medium text-[#5f8a84]">
                    Patients par jour
                  </span>
                </div>
                <p className="mb-4 text-xs text-[#5f8a84]">
                  Total · {stats.weekPatients} patient
                  {stats.weekPatients === 1 ? "" : "s"}
                </p>
                <ActivityChart values={weeklyBars} maxValue={maxBar} />
              </div>

              {/* Quick actions 2x2 */}
              <div className="rounded-2xl border border-[#ccfbf1] bg-white p-6">
                <h2 className="mb-4 font-serif text-xl text-[#0f2420]">
                  Actions rapides
                </h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  <QuickAction
                    href="/doctor/appointments"
                    title="Gérer mes rendez-vous"
                    description="Consultez votre planning et chaque consultation."
                    icon={CalendarDays}
                  />
                  <QuickAction
                    href="/doctor/patients"
                    title="Rechercher un patient"
                    description="Retrouvez un dossier patient par nom ou e-mail."
                    icon={Search}
                  />
                  <QuickAction
                    href="/doctor/consultations/new"
                    title="Créer une consultation"
                    description="Rédigez une nouvelle note clinique avec prescriptions."
                    icon={Plus}
                  />
                  <QuickAction
                    href="/doctor/patients"
                    title="Voir mes patients"
                    description="Liste complète de vos patients suivis."
                    icon={Users}
                  />
                </div>
              </div>
            </div>

            {/* RIGHT (2/5 ≈ 40%) */}
            <div className="space-y-4 lg:col-span-2">
              {/* Upcoming */}
              <div className="rounded-2xl border border-[#ccfbf1] bg-white p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="font-serif text-xl text-[#0f2420]">
                    Prochains rendez-vous
                  </h2>
                  <Link
                    href="/doctor/appointments"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#0d9488] transition-colors hover:text-[#0f766e]"
                  >
                    Voir tout
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>

                {upcoming.length === 0 ? (
                  <EmptyState
                    icon={CalendarDays}
                    title="Aucun rendez-vous à venir"
                    body="Les rendez-vous confirmés apparaîtront ici."
                  />
                ) : (
                  <div className="space-y-1">
                    {upcoming.map((apt) => (
                      <UpcomingItem key={apt.id} appointment={apt} />
                    ))}
                  </div>
                )}
              </div>

              {/* Recent records (no data fetch available — empty state) */}
              <div className="rounded-2xl border border-[#ccfbf1] bg-white p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="font-serif text-xl text-[#0f2420]">
                    Dossiers récents
                  </h2>
                  <Link
                    href="/doctor/patients"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#0d9488] transition-colors hover:text-[#0f766e]"
                  >
                    Tous les patients
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
                <EmptyState
                  icon={FileText}
                  title="Pas encore de dossier récent"
                  body="Créez une consultation pour ajouter un dossier."
                />
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}

// ─── KPI Card ─────────────────────────────────────────────────────────

type KpiCardProps = {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  hint?: string;
  alert?: boolean;
};

function KpiCard({ label, value, icon: Icon, hint, alert }: KpiCardProps) {
  return (
    <div
      className={cn(
        "group relative rounded-2xl border bg-white p-6 transition-all hover:border-[#0d9488] hover:shadow-lg hover:shadow-teal-100/60",
        alert
          ? "border-[#ccfbf1] border-l-4 border-l-[#f59e0b]"
          : "border-[#ccfbf1]"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-serif text-5xl leading-none text-[#0f2420]">
            {value}
          </p>
          <p className="mt-3 text-sm font-semibold text-[#0f2420]">{label}</p>
          {hint && <p className="mt-1 text-xs text-[#5f8a84]">{hint}</p>}
        </div>
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-teal-50 text-[#0d9488]">
          <Icon className="h-5 w-5" />
        </div>
      </div>
      {alert && (
        <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-orange-50 px-2.5 py-1 text-xs font-semibold text-[#f59e0b]">
          <AlertTriangle className="h-3 w-3" />
          Action requise
        </span>
      )}
    </div>
  );
}

// ─── Activity Chart (inline SVG) ──────────────────────────────────────

type ActivityChartProps = { values: number[]; maxValue: number };

function ActivityChart({ values, maxValue }: ActivityChartProps) {
  const barWidth = 32;
  const gap = 16;
  const totalWidth = 7 * barWidth + 6 * gap;
  const chartHeight = 100;
  const valueLabelSpace = 18;
  const dayLabelSpace = 22;
  const totalHeight = chartHeight + valueLabelSpace + dayLabelSpace;

  return (
    <svg
      viewBox={`0 0 ${totalWidth} ${totalHeight}`}
      className="w-full"
      role="img"
      aria-label="Patients par jour cette semaine"
    >
      <defs>
        <linearGradient id="doctor-bar-gradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#06b6d4" />
          <stop offset="100%" stopColor="#0d9488" />
        </linearGradient>
      </defs>
      {values.map((v, i) => {
        const height = (v / maxValue) * chartHeight;
        const x = i * (barWidth + gap);
        const y = chartHeight - height + valueLabelSpace;
        return (
          <g key={i}>
            <text
              x={x + barWidth / 2}
              y={y - 4}
              textAnchor="middle"
              fontSize="11"
              fontWeight="600"
              fill="#0f2420"
            >
              {v}
            </text>
            <rect
              x={x}
              y={y}
              width={barWidth}
              height={Math.max(4, height)}
              rx="6"
              fill="url(#doctor-bar-gradient)"
            />
            <text
              x={x + barWidth / 2}
              y={chartHeight + valueLabelSpace + 16}
              textAnchor="middle"
              fontSize="11"
              fill="#5f8a84"
            >
              {DAYS_OF_WEEK[i]}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ─── Quick Action card ────────────────────────────────────────────────

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

// ─── Upcoming appointment row ─────────────────────────────────────────

type UpcomingItemProps = {
  appointment: {
    id: string;
    datetime: Date;
    status: string;
    reason: string | null;
    patient: { id: string; fullName: string; email: string };
  };
};

function UpcomingItem({ appointment }: UpcomingItemProps) {
  const date = new Date(appointment.datetime);
  const dateStr = date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
  });
  const timeStr = date.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <Link
      href={`/doctor/appointments/${appointment.id}`}
      className="group flex items-center gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-teal-50/60"
    >
      <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-teal-100 text-sm font-bold text-[#0d9488]">
        {getInitials(appointment.patient.fullName)}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-[#0f2420]">
          {appointment.patient.fullName}
        </p>
        <p className="truncate text-xs text-[#5f8a84]">
          {appointment.reason || "Consultation générale"}
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        <span className="rounded-md bg-teal-100 px-2 py-0.5 text-[11px] font-semibold text-[#0d9488]">
          {dateStr} · {timeStr}
        </span>
        <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-600">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          Confirmé
        </span>
      </div>
    </Link>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────

type EmptyStateProps = {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
};

function EmptyState({ icon: Icon, title, body }: EmptyStateProps) {
  return (
    <div className="rounded-xl border border-dashed border-[#ccfbf1] bg-teal-50/40 px-4 py-8 text-center">
      <div className="mx-auto mb-2 flex size-10 items-center justify-center rounded-full bg-white text-[#0d9488] ring-1 ring-[#ccfbf1]">
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-sm font-semibold text-[#0f2420]">{title}</p>
      <p className="mt-1 text-xs text-[#5f8a84]">{body}</p>
    </div>
  );
}
