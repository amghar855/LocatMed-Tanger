"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Building2,
  Calendar,
  Check,
  ChevronRight,
  Clock,
  FileText,
  Loader2,
  MapPin,
  Search,
  Stethoscope,
  User,
  ArrowLeft,
  Sparkles,
  X,
} from "lucide-react";
import { bookReservationAction } from "@/app/patient/booking/actions";
import type { BookingDoctorOption, BookingHospitalOption } from "@/features/patient/types/booking";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/components/locatomed/i18n-provider";

type Props = {
  hospitals: BookingHospitalOption[];
  doctors: BookingDoctorOption[];
  specialties: string[];
  initialHospitalId?: string;
};

const HOSPITAL_TYPE_COLORS: Record<string, string> = {
  public: "text-teal-600 bg-teal-50",
  private: "text-teal-600 bg-teal-50",
  chu: "text-teal-700 bg-teal-50",
};

const TIME_SLOTS = [
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
  "11:00", "11:30", "14:00", "14:30", "15:00", "15:30",
  "16:00", "16:30", "17:00", "17:30",
];

export function BookingForm({ hospitals, doctors, specialties, initialHospitalId = "" }: Props) {
  const { t } = useI18n();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const HOSPITAL_TYPE_LABELS = useMemo<Record<string, string>>(
    () => ({
      public: t("patient.booking.typePublic"),
      private: t("patient.booking.typePrivate"),
      chu: t("patient.booking.typeChu"),
    }),
    [t]
  );

  const steps = [
    { n: 1, label: t("patient.booking.steps.establishment") },
    { n: 2, label: t("patient.booking.steps.doctor") },
    { n: 3, label: t("patient.booking.steps.confirmation") },
  ];

  const [step, setStep] = useState(initialHospitalId ? 2 : 1);
  const [hospitalId, setHospitalId] = useState(initialHospitalId);
  const [specialty, setSpecialty] = useState("");
  const [doctorId, setDoctorId] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [reason, setReason] = useState("");
  const [hospitalSearch, setHospitalSearch] = useState("");

  const selectedHospital = hospitals.find((h) => h.id === hospitalId);

  const filteredHospitals = useMemo(() => {
    const q = hospitalSearch.trim().toLowerCase();
    if (!q) return hospitals;
    return hospitals.filter(
      (h) =>
        h.name.toLowerCase().includes(q) ||
        (HOSPITAL_TYPE_LABELS[h.type] ?? "").toLowerCase().includes(q)
    );
  }, [hospitals, hospitalSearch, HOSPITAL_TYPE_LABELS]);

  const filteredSpecialties = useMemo(() => {
    if (!hospitalId) return specialties;
    const hospitalDoctors = doctors.filter((d) => d.hospitalId === hospitalId);
    return [...new Set(hospitalDoctors.map((d) => d.specialty))];
  }, [doctors, hospitalId, specialties]);

  const filteredDoctors = useMemo(
    () =>
      doctors.filter(
        (d) =>
          (hospitalId ? d.hospitalId === hospitalId : true) &&
          (specialty ? d.specialty === specialty : true)
      ),
    [doctors, hospitalId, specialty]
  );

  const selectedDoctor = filteredDoctors.find((d) => d.id === doctorId);

  const today = new Date().toISOString().split("T")[0];

  function handleSubmit() {
    const formData = new FormData();
    formData.set("hospitalId", hospitalId);
    formData.set("specialty", specialty);
    formData.set("doctorId", doctorId);
    formData.set("date", date);
    formData.set("time", time);
    if (reason) formData.set("reason", reason);

    startTransition(async () => {
      const result = await bookReservationAction(formData);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success(t("patient.booking.confirmedSuccess"));
      router.push("/patient/reservations");
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      {/* ── Step progress bar ── */}
      <div className="relative flex items-center justify-between">
        {/* connector line */}
        <div className="absolute inset-x-0 top-4 h-0.5 bg-slate-100">
          <div
            className="h-full bg-teal-500 transition-all duration-500"
            style={{ width: step === 1 ? "0%" : step === 2 ? "50%" : "100%" }}
          />
        </div>

        {steps.map((s) => {
          const done = step > s.n;
          const active = step === s.n;
          return (
            <button
              key={s.n}
              type="button"
              onClick={() => done && setStep(s.n)}
              className="relative flex flex-col items-center gap-1.5"
            >
              <span
                className={cn(
                  "flex size-8 items-center justify-center rounded-full text-xs font-bold ring-2 ring-offset-2 transition-all",
                  done
                    ? "bg-teal-600 text-white ring-teal-600 cursor-pointer"
                    : active
                    ? "bg-teal-600 text-white ring-teal-500"
                    : "bg-white text-slate-400 ring-slate-200"
                )}
              >
                {done ? <Check className="size-3.5" /> : s.n}
              </span>
              <span
                className={cn(
                  "text-[11px] font-medium",
                  active || done ? "text-slate-800" : "text-slate-400"
                )}
              >
                {s.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* ══════ STEP 1 — Hospital ══════ */}
      {step === 1 && (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">{t("patient.booking.chooseEstablishment")}</h2>
            <p className="mt-0.5 text-sm text-slate-500">
              {t("patient.booking.chooseEstablishmentDescription")}
            </p>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={hospitalSearch}
              onChange={(e) => setHospitalSearch(e.target.value)}
              placeholder={t("patient.booking.searchHospital")}
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-10 text-sm text-slate-800 placeholder:text-slate-400 focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-100"
            />
            {hospitalSearch && (
              <button
                type="button"
                onClick={() => setHospitalSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="size-4" />
              </button>
            )}
          </div>

          {filteredHospitals.length === 0 ? (
            <div className="rounded-2xl bg-slate-50 py-10 text-center">
              <Building2 className="mx-auto size-7 text-slate-300" />
              <p className="mt-2 text-sm text-slate-500">{t("patient.booking.noEstablishment")}</p>
              <button
                type="button"
                onClick={() => setHospitalSearch("")}
                className="mt-1 text-xs font-medium text-teal-600 hover:underline"
              >
                {t("patient.booking.clearSearch")}
              </button>
            </div>
          ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {filteredHospitals.map((h) => {
              const typeCls = HOSPITAL_TYPE_COLORS[h.type] ?? "text-slate-600 bg-slate-100";
              return (
                <button
                  key={h.id}
                  type="button"
                  onClick={() => {
                    setHospitalId(h.id);
                    setSpecialty("");
                    setDoctorId("");
                    setStep(2);
                  }}
                  className={cn(
                    "group flex flex-col items-start gap-3 rounded-2xl border-2 p-4 text-left transition-all",
                    hospitalId === h.id
                      ? "border-teal-500 bg-teal-50/60"
                      : "border-slate-100 bg-white hover:border-teal-200 hover:bg-teal-50/30"
                  )}
                >
                  <div className="flex w-full items-start justify-between gap-2">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-teal-50">
                      <Building2 className="size-5 text-teal-600" />
                    </div>
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                        typeCls
                      )}
                    >
                      {HOSPITAL_TYPE_LABELS[h.type] ?? h.type}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{h.name}</p>
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
                      <MapPin className="size-3" /> Tanger
                    </p>
                  </div>
                  <span className="flex items-center gap-1 text-xs font-medium text-teal-600 opacity-0 transition-opacity group-hover:opacity-100">
                    {t("patient.booking.select")} <ChevronRight className="size-3" />
                  </span>
                </button>
              );
            })}
          </div>
          )}
        </div>
      )}

      {/* ══════ STEP 2 — Specialty + Doctor ══════ */}
      {step === 2 && (
        <div className="space-y-5">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">{t("patient.booking.chooseDoctor")}</h2>
              <p className="mt-0.5 flex items-center gap-1.5 text-sm text-slate-500">
                <Building2 className="size-3.5 text-teal-600" />
                {selectedHospital?.name}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setStep(1)}
              className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700"
            >
              <ArrowLeft className="size-3.5" /> {t("patient.booking.back")}
            </button>
          </div>

          {/* Specialty pills */}
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-slate-400">
              {t("patient.booking.specialty")}
            </p>
            <div className="flex flex-wrap gap-2">
              {filteredSpecialties.map((sp) => (
                <button
                  key={sp}
                  type="button"
                  onClick={() => {
                    setSpecialty(sp);
                    setDoctorId("");
                  }}
                  className={cn(
                    "rounded-full border px-4 py-1.5 text-sm font-medium transition-all",
                    specialty === sp
                      ? "border-teal-500 bg-teal-500 text-white"
                      : "border-slate-200 bg-white text-slate-700 hover:border-teal-300 hover:text-teal-700"
                  )}
                >
                  {sp}
                </button>
              ))}
            </div>
          </div>

          {/* Doctor cards */}
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-slate-400">
              {t("patient.booking.doctorAvailable")}
            </p>
            {filteredDoctors.length === 0 ? (
              <div className="rounded-2xl bg-slate-50 py-8 text-center">
                <Stethoscope className="mx-auto size-7 text-slate-300" />
                <p className="mt-2 text-sm text-slate-500">
                  {t("patient.booking.noDoctor")}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredDoctors.map((doc) => (
                  <button
                    key={doc.id}
                    type="button"
                    onClick={() => {
                      setDoctorId(doc.id);
                      if (!specialty) setSpecialty(doc.specialty);
                    }}
                    className={cn(
                      "group flex w-full items-center gap-4 rounded-2xl border-2 p-4 text-left transition-all",
                      doctorId === doc.id
                        ? "border-teal-500 bg-teal-50/60"
                        : "border-slate-100 bg-white hover:border-teal-200 hover:bg-slate-50"
                    )}
                  >
                    {/* Avatar */}
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-teal-400 text-sm font-bold text-white shadow-sm">
                      {doc.fullName.split(" ").slice(0, 2).map((w) => w[0]).join("")}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900">{doc.fullName}</p>
                      <p className="flex items-center gap-1 text-xs text-slate-500">
                        <Stethoscope className="size-3" />
                        {doc.specialty}
                      </p>
                    </div>
                    {doctorId === doc.id ? (
                      <span className="flex size-6 items-center justify-center rounded-full bg-teal-600 text-white">
                        <Check className="size-3.5" />
                      </span>
                    ) : (
                      <ChevronRight className="size-4 text-slate-300 group-hover:text-teal-500" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            disabled={!doctorId}
            onClick={() => setStep(3)}
            className="w-full rounded-2xl bg-teal-600 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {t("patient.booking.continue")}
          </button>
        </div>
      )}

      {/* ══════ STEP 3 — Date / Time / Confirm ══════ */}
      {step === 3 && (
        <div className="space-y-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">{t("patient.booking.chooseSlot")}</h2>
              <p className="mt-0.5 text-sm text-slate-500">
                {t("patient.booking.chooseSlotDescription")}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setStep(2)}
              className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700"
            >
              <ArrowLeft className="size-3.5" /> {t("patient.booking.back")}
            </button>
          </div>

          {/* Summary card */}
          <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-4">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-teal-400 text-sm font-bold text-white">
              {selectedDoctor?.fullName.split(" ").slice(0, 2).map((w) => w[0]).join("")}
            </div>
            <div>
              <p className="font-semibold text-slate-900">{selectedDoctor?.fullName}</p>
              <p className="text-xs text-slate-500">
                {selectedDoctor?.specialty} · {selectedHospital?.name}
              </p>
            </div>
          </div>

          {/* Date picker */}
          <div>
            <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-slate-400">
              <Calendar className="size-3.5" /> {t("patient.booking.date")}
            </p>
            <input
              type="date"
              value={date}
              min={today}
              onChange={(e) => setDate(e.target.value)}
              className="form-select"
              required
            />
          </div>

          {/* Time slot grid */}
          <div>
            <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-slate-400">
              <Clock className="size-3.5" /> {t("patient.booking.time")}
            </p>
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
              {TIME_SLOTS.map((slot) => (
                <button
                  key={slot}
                  type="button"
                  onClick={() => setTime(slot)}
                  className={cn(
                    "rounded-xl border py-2 text-sm font-medium transition-all",
                    time === slot
                      ? "border-teal-500 bg-teal-500 text-white"
                      : "border-slate-200 bg-white text-slate-700 hover:border-teal-300 hover:text-teal-700"
                  )}
                >
                  {slot}
                </button>
              ))}
            </div>
          </div>

          {/* Reason */}
          <div>
            <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-slate-400">
              <FileText className="size-3.5" /> {t("patient.booking.reason")}{" "}
              <span className="normal-case font-normal text-slate-400">({t("patient.booking.optional")})</span>
            </p>
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={t("patient.booking.reasonPlaceholder")}
              maxLength={300}
              className="h-10 rounded-xl border-slate-200"
            />
          </div>

          {/* Confirm button */}
          <button
            type="button"
            disabled={isPending || !date || !time}
            onClick={handleSubmit}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-teal-600 py-3.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                {t("patient.booking.confirming")}
              </>
            ) : (
              <>
                <Sparkles className="size-4" />
                {t("patient.booking.confirm")}
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
