import Link from "next/link";
import type { MedicalFolderRecord } from "@/features/patient/types/medical-folder";

type Props = {
  records: MedicalFolderRecord[];
};

function groupLabel(date: Date) {
  return new Intl.DateTimeFormat("fr-MA", {
    year: "numeric",
    month: "long",
  }).format(date);
}

function dateLabel(date: Date) {
  return new Intl.DateTimeFormat("fr-MA", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

export function MedicalFolderTimeline({ records }: Props) {
  if (records.length === 0) {
    return (
      <div className="rounded-lg border bg-white p-4 text-sm text-gray-600">
        <p>Aucun dossier pour l&apos;instant. Réservez un rendez-vous pour démarrer votre historique.</p>
        <Link href="/patient/booking" className="mt-2 inline-block text-teal-600 underline">
          Aller à la réservation
        </Link>
      </div>
    );
  }

  let currentGroup = "";

  return (
    <div className="space-y-4">
      {records.map((record) => {
        const group = groupLabel(record.date);
        const showGroup = group !== currentGroup;
        if (showGroup) {
          currentGroup = group;
        }

        return (
          <div key={record.id} className="space-y-2">
            {showGroup ? (
              <div className="sticky top-0 z-10 rounded bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                {group}
              </div>
            ) : null}

            <article className="rounded-lg border bg-white p-4">
              <p className="text-xs text-gray-500">{dateLabel(record.date)}</p>
              <h3 className="mt-1 text-base font-semibold">{record.diagnosis}</h3>
              <p className="mt-1 text-sm text-gray-700">
                {record.doctorName}
                {record.doctorSpecialty ? ` • ${record.doctorSpecialty}` : ""}
              </p>
              <p className="text-sm text-gray-600">{record.hospitalName ?? "Hôpital non renseigné"}</p>

              <div className="mt-3 rounded bg-slate-50 p-3 text-sm text-gray-700 whitespace-pre-line">
                {record.notes}
              </div>

              {record.prescription.length > 0 ? (
                <div className="mt-3">
                  <p className="text-xs font-semibold text-slate-700">Prescription</p>
                  <ul className="mt-1 list-disc pl-5 text-sm text-gray-700">
                    {record.prescription.map((item) => (
                      <li key={`${record.id}-${item.medicineId}-${item.dosage}`}>
                        {item.medicineName} — {item.dosage} ({item.duration})
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </article>
          </div>
        );
      })}
    </div>
  );
}
