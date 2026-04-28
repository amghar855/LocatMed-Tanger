"use client";

import { useState } from "react";
import { AppointmentCard } from "@/components/locatomed/appointment-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Appointment {
  id: string;
  datetime: Date;
  status: string;
  patient: {
    fullName: string;
    email: string;
  };
}

interface AppointmentListProps {
  appointments: Appointment[];
}

export function AppointmentList({ appointments }: AppointmentListProps) {
  const [activeTab, setActiveTab] = useState("all");

  const filtered = appointments.filter((a) => {
    if (activeTab === "all") return true;
    return a.status === activeTab;
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const todayRows = filtered.filter((a) => {
    const d = new Date(a.datetime);
    return d >= today && d < tomorrow;
  });

  const otherRows = filtered.filter((a) => {
    const d = new Date(a.datetime);
    return d < today || d >= tomorrow;
  });

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <div className="w-full overflow-x-auto">
        <TabsList variant="line">
          <TabsTrigger value="all">Tous</TabsTrigger>
          <TabsTrigger value="scheduled">Prévus</TabsTrigger>
          <TabsTrigger value="completed">Terminés</TabsTrigger>
          <TabsTrigger value="cancelled">Annulés</TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value={activeTab} className="space-y-6 mt-6">
        {todayRows.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-3">Aujourd&apos;hui</h3>
            <div className="space-y-3">
              {todayRows.map((a) => (
                <AppointmentCard key={a.id} appointment={a} />
              ))}
            </div>
          </div>
        )}

        {otherRows.length > 0 && (
          <div>
            {todayRows.length > 0 && (
              <h3 className="text-lg font-semibold mb-3">Autres</h3>
            )}
            <div className="space-y-3">
              {otherRows.map((a) => (
                <AppointmentCard key={a.id} appointment={a} />
              ))}
            </div>
          </div>
        )}

        {filtered.length === 0 && (
          <p className="text-center text-muted-foreground py-8">
            Aucun rendez-vous
          </p>
        )}
      </TabsContent>
    </Tabs>
  );
}
