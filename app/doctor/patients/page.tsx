"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Search, User } from "lucide-react";
import { searchPatients } from "@/lib/actions/doctor-actions";
import Link from "next/link";
import DoctorNav from "@/components/locatomed/doctor-nav";
import { cn } from "@/lib/utils";

interface Patient {
  id: string;
  fullName: string;
  email: string;
}

export default function PatientSearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Patient[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSearch() {
    if (query.trim().length < 2) return;
    setLoading(true);
    try {
      const patients = await searchPatients(query.trim());
      setResults(patients);
      setSearched(true);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") handleSearch();
  }

  return (
    <>
      <DoctorNav userName="Médecin" active="patients" />

      <div className="min-h-screen md:pl-72">
        <div className="mx-auto w-full max-w-5xl space-y-6 p-4 sm:p-6">
          <section className="rounded-2xl border border-teal-200/70 bg-gradient-to-br from-teal-50 via-background to-cyan-50 p-6">
            <h1 className="text-3xl font-bold tracking-tight">Rechercher un patient</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Trouvez un patient par nom ou e-mail pour accéder à son dossier.
            </p>
          </section>

          <div className="rounded-2xl border bg-background p-4 sm:p-5 space-y-5">
            {/* Search bar */}
            <div className="flex gap-2">
              <Input
                placeholder="Nom ou email du patient..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1"
              />
              <Button
                onClick={handleSearch}
                disabled={query.trim().length < 2 || loading}
                className="bg-teal-600 text-white hover:bg-teal-700"
              >
                <Search className="h-4 w-4 mr-2" />
                {loading ? "Recherche..." : "Rechercher"}
              </Button>
            </div>

            {/* Results */}
            {searched && (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  {results.length} résultat{results.length !== 1 ? "s" : ""} trouvé
                  {results.length !== 1 ? "s" : ""}
                </p>

                {results.length === 0 ? (
                  <Card>
                    <CardContent className="py-8 text-center text-muted-foreground">
                      Aucun patient trouvé
                    </CardContent>
                  </Card>
                ) : (
                  results.map((p) => (
                    <Card key={p.id}>
                      <CardContent className="p-4 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <User className="h-5 w-5 text-muted-foreground shrink-0" />
                          <div className="min-w-0">
                            <p className="font-medium truncate">{p.fullName}</p>
                            <p className="text-sm text-muted-foreground truncate">
                              {p.email}
                            </p>
                          </div>
                        </div>
                        <Link
                          href={`/doctor/patients/${p.id}`}
                          className={cn(
                            buttonVariants({ variant: "outline", size: "sm" })
                          )}
                        >
                          Voir dossier
                        </Link>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
