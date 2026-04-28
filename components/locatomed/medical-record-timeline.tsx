import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Pill } from "lucide-react";

interface MedicalRecordTimelineProps {
  records: Array<{
    id: string;
    diagnosis: string;
    notes: string;
    createdAt: Date;
    doctor: {
      fullName: string;
    };
    prescriptions: Array<{
      medicineId: string;
      medicineName: string;
      dosage: string;
      duration: string;
    }>;
  }>;
}

export function MedicalRecordTimeline({ records }: MedicalRecordTimelineProps) {
  if (records.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-8">
        Aucun dossier médical pour ce patient
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {records.map((record) => (
        <Card key={record.id}>
          <CardHeader>
            <div className="flex items-start justify-between gap-2">
              <CardTitle className="text-lg">{record.diagnosis}</CardTitle>
              <Badge variant="outline" className="shrink-0">
                {new Date(record.createdAt).toLocaleDateString("fr-FR")}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="h-4 w-4" />
              <span>Dr. {record.doctor.fullName}</span>
            </div>

            {record.notes && (
              <div>
                <p className="text-sm font-medium mb-1">Notes :</p>
                <p className="text-sm text-muted-foreground">{record.notes}</p>
              </div>
            )}

            {record.prescriptions.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Pill className="h-4 w-4" />
                  Prescriptions :
                </p>
                <div className="space-y-2">
                  {record.prescriptions.map((p, idx) => (
                    <div key={idx} className="text-sm bg-muted p-2 rounded">
                      <p className="font-medium">{p.medicineName}</p>
                      <p className="text-muted-foreground">
                        {p.dosage} — {p.duration}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
