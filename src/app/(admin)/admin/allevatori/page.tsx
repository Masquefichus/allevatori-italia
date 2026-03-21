"use client";

import { useState } from "react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { Search, CheckCircle, XCircle, MapPin, Calendar } from "lucide-react";

type BreederStatus = "all" | "pending" | "approved";

const demoBreeders = [
  { id: "1", kennel_name: "Allevamento Del Sole", region: "Lazio", province: "Roma", is_approved: false, created_at: "2026-03-15", enci_number: "12345", breeds: ["Cane Corso", "Boxer"] },
  { id: "2", kennel_name: "Cuccioli d'Oro", region: "Toscana", province: "Firenze", is_approved: false, created_at: "2026-03-14", enci_number: "67890", breeds: ["Golden Retriever"] },
  { id: "3", kennel_name: "Pastori del Sud", region: "Puglia", province: "Bari", is_approved: false, created_at: "2026-03-13", enci_number: null, breeds: ["Pastore Maremmano"] },
  { id: "4", kennel_name: "Villa dei Labrador", region: "Veneto", province: "Padova", is_approved: true, created_at: "2026-02-20", enci_number: "11111", breeds: ["Labrador Retriever"] },
  { id: "5", kennel_name: "Lagotto Romagnolo Club", region: "Emilia-Romagna", province: "Bologna", is_approved: true, created_at: "2026-01-10", enci_number: "22222", breeds: ["Lagotto Romagnolo"] },
];

export default function AdminAllevatoriPage() {
  const [filter, setFilter] = useState<BreederStatus>("pending");
  const [search, setSearch] = useState("");

  const filtered = demoBreeders.filter((b) => {
    if (filter === "pending" && b.is_approved) return false;
    if (filter === "approved" && !b.is_approved) return false;
    if (search && !b.kennel_name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Gestione Allevatori</h1>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Cerca allevatori..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="flex gap-2">
          {(["pending", "approved", "all"] as BreederStatus[]).map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                filter === s
                  ? "bg-primary text-white"
                  : "bg-white border border-border hover:bg-muted"
              }`}
            >
              {s === "pending" ? "In attesa" : s === "approved" ? "Approvati" : "Tutti"}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {filtered.map((breeder) => (
          <Card key={breeder.id}>
            <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">{breeder.kennel_name}</h3>
                  <Badge variant={breeder.is_approved ? "success" : "default"}>
                    {breeder.is_approved ? "Approvato" : "In attesa"}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {breeder.province}, {breeder.region}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {breeder.created_at}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Razze:</span>
                  {breeder.breeds.map((b) => (
                    <Badge key={b} variant="outline">{b}</Badge>
                  ))}
                </div>
                {breeder.enci_number && (
                  <p className="text-xs text-muted-foreground">
                    ENCI: {breeder.enci_number}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                {!breeder.is_approved && (
                  <>
                    <Button size="sm" className="gap-1">
                      <CheckCircle className="h-4 w-4" />
                      Approva
                    </Button>
                    <Button size="sm" variant="destructive" className="gap-1">
                      <XCircle className="h-4 w-4" />
                      Rifiuta
                    </Button>
                  </>
                )}
                <Button size="sm" variant="outline">
                  Dettagli
                </Button>
              </div>
            </div>
          </Card>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            Nessun allevatore trovato.
          </div>
        )}
      </div>
    </div>
  );
}
