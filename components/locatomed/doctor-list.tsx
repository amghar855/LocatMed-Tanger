"use client";

import { useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { buttonVariants } from "@/components/ui/button";
import { MoreHorizontal, Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface Doctor {
  id: string;
  fullName: string;
  email: string;
  specialty: string | null;
  createdAt: Date | null;
}

interface DoctorListProps {
  initialDoctors: Doctor[];
}

export function DoctorList({ initialDoctors }: DoctorListProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredDoctors = initialDoctors.filter(
    (doctor) =>
      doctor.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doctor.email.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="space-y-4">
      <Card className="border-teal-100 bg-white/80">
        <CardContent className="pt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher par nom ou email..."
              className="h-10 pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {filteredDoctors.length === 0 ? (
        <div className="rounded-xl border border-dashed py-12 text-center">
          <p className="text-muted-foreground">
            {searchQuery
              ? "Aucun médecin trouvé pour cette recherche."
              : "Aucun médecin pour le moment."}
          </p>
          {!searchQuery && (
            <Link
              href="/hospital-admin/doctors/new"
              className={cn(buttonVariants({ variant: "default" }), "mt-4 inline-flex")}
            >
              Ajouter votre premier médecin
            </Link>
          )}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border/70 bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Spécialité</TableHead>
                <TableHead>Date d&apos;ajout</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDoctors.map((doctor) => (
                <TableRow key={doctor.id}>
                  <TableCell className="font-medium">{doctor.fullName}</TableCell>
                  <TableCell>{doctor.email}</TableCell>
                  <TableCell>{doctor.specialty ?? "—"}</TableCell>
                  <TableCell>
                    {doctor.createdAt
                      ? new Date(doctor.createdAt).toLocaleDateString("fr-FR")
                      : "—"}
                  </TableCell>
                  <TableCell>
                    <Badge className="bg-teal-600 text-white hover:bg-teal-600">Actif</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        className={cn(
                          buttonVariants({ variant: "ghost", size: "icon" }),
                          "h-8 w-8",
                        )}
                        aria-label="Actions"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Link
                            href={`/hospital-admin/doctors/${doctor.id}`}
                            className="w-full cursor-pointer"
                          >
                            Voir Détails
                          </Link>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <p className="text-sm text-muted-foreground">
        {filteredDoctors.length} médecin
        {filteredDoctors.length !== 1 ? "s" : ""} trouvé
        {filteredDoctors.length !== 1 ? "s" : ""}
      </p>
    </div>
  );
}
