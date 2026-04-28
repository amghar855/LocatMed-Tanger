import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Calendar, Clock, User } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface AppointmentCardProps {
  appointment: {
    id: string;
    datetime: Date;
    status: string;
    patient: {
      fullName: string;
      email: string;
    };
  };
}

const STATUS_COLORS: Record<string, string> = {
  scheduled: "bg-teal-500 hover:bg-teal-500",
  completed: "bg-green-500 hover:bg-green-500",
  cancelled: "bg-red-500 hover:bg-red-500",
};

const STATUS_LABELS: Record<string, string> = {
  scheduled: "Prévu",
  completed: "Terminé",
  cancelled: "Annulé",
};

export function AppointmentCard({ appointment }: AppointmentCardProps) {
  const date = new Date(appointment.datetime);
  const timeStr = date.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const dateStr = date.toLocaleDateString("fr-FR");

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-2 flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="font-medium truncate">
                {appointment.patient.fullName}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {dateStr}
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {timeStr}
              </div>
            </div>
            <Badge
              className={
                STATUS_COLORS[appointment.status] ??
                "bg-gray-500 hover:bg-gray-500"
              }
            >
              {STATUS_LABELS[appointment.status] ?? appointment.status}
            </Badge>
          </div>
          <Link
            href={`/doctor/appointments/${appointment.id}`}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            Voir
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
