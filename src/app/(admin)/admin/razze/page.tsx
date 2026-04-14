"use client";

import { useState, useEffect } from "react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { Search } from "lucide-react";
import { gruppiFCI } from "@/data/razze";

interface Breed {
  id: string;
  name_it: string;
  name_en: string | null;
  slug: string;
  group_fci: number | null;
  size_category: string;
  is_italian_breed: boolean;
  origin_country: string | null;
}

export default function AdminRazzePage() {
  const [breeds, setBreeds] = useState<Breed[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [groupFilter, setGroupFilter] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/admin/breeds")
      .then((r) => r.ok ? r.json() : [])
      .then((data) => setBreeds(Array.isArray(data) ? data : []))
      .catch(() => setBreeds([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = breeds.filter((b) => {
    if (search && !b.name_it.toLowerCase().includes(search.toLowerCase())) return false;
    if (groupFilter !== null && b.group_fci !== groupFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Gestione Razze</h1>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Cerca razze..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <select
          value={groupFilter ?? ""}
          onChange={(e) => setGroupFilter(e.target.value ? parseInt(e.target.value) : null)}
          className="px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">Tutti i gruppi FCI</option>
          {Object.entries(gruppiFCI).map(([num, name]) => (
            <option key={num} value={num}>Gruppo {num} - {name}</option>
          ))}
        </select>
      </div>

      {!loading && (
        <p className="text-sm text-muted-foreground">{filtered.length} razze trovate</p>
      )}

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-4 font-medium text-muted-foreground">Razza</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Gruppo FCI</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Taglia</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Origine</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Tag</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground">Caricamento...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground">Nessuna razza trovata.</td>
                </tr>
              ) : (
                filtered.map((breed) => (
                  <tr key={breed.id} className="border-b border-border hover:bg-muted/50">
                    <td className="p-4">
                      <span className="font-medium">{breed.name_it}</span>
                      {breed.name_en && (
                        <span className="text-xs text-muted-foreground ml-2">({breed.name_en})</span>
                      )}
                    </td>
                    <td className="p-4 text-muted-foreground">
                      {breed.group_fci ? `Gruppo ${breed.group_fci}` : "—"}
                    </td>
                    <td className="p-4">
                      <Badge variant="outline">{breed.size_category}</Badge>
                    </td>
                    <td className="p-4 text-muted-foreground">{breed.origin_country ?? "—"}</td>
                    <td className="p-4">
                      {breed.is_italian_breed && <Badge variant="primary">Italiana</Badge>}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
