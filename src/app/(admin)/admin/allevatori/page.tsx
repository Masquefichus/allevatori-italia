"use client";

import { useState, useEffect } from "react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { Search, CheckCircle, XCircle, MapPin, Calendar } from "lucide-react";

type BreederStatus = "all" | "pending" | "approved";

interface Breeder {
  id: string;
  kennel_name: string;
  region: string | null;
  province: string | null;
  is_approved: boolean;
  created_at: string;
  enci_number: string | null;
  breed_ids: string[] | null;
}

export default function AdminAllevatoriPage() {
  const [filter, setFilter] = useState<BreederStatus>("pending");
  const [search, setSearch] = useState("");
  const [breeders, setBreeders] = useState<Breeder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/breeders")
      .then((r) => r.json())
      .then((data) => setBreeders(data ?? []))
      .finally(() => setLoading(false));
  }, []);

  const filtered = breeders.filter((b) => {
    if (filter === "pending" && b.is_approved) return false;
    if (filter === "approved" && !b.is_approved) return false;
    if (search && !b.kennel_name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleApprove = async (id: string) => {
    await fetch(`/api/admin/breeders`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, is_approved: true }),
    });
    setBreeders((prev) => prev.map((b) => b.id === id ? { ...b, is_approved: true } : b));
  };

  const handleReject = async (id: string) => {
    await fetch(`/api/admin/breeders`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, is_approved: false }),
    });
    setBreeders((prev) => prev.filter((b) => b.id !== id));
  };

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
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Caricamento...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            Nessun allevatore trovato.
          </div>
        ) : (
          filtered.map((breeder) => (
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
                    {(breeder.province || breeder.region) && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {[breeder.province, breeder.region].filter(Boolean).join(", ")}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(breeder.created_at).toLocaleDateString("it-IT")}
                    </span>
                  </div>
                  {breeder.enci_number && (
                    <p className="text-xs text-muted-foreground">ENCI: {breeder.enci_number}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  {!breeder.is_approved && (
                    <>
                      <Button size="sm" className="gap-1" onClick={() => handleApprove(breeder.id)}>
                        <CheckCircle className="h-4 w-4" />
                        Approva
                      </Button>
                      <Button size="sm" variant="destructive" className="gap-1" onClick={() => handleReject(breeder.id)}>
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
          ))
        )}
      </div>
    </div>
  );
}
