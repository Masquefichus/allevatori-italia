"use client";

import { useState } from "react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { Search, Plus, Edit2 } from "lucide-react";
import { razze, gruppiFCI } from "@/data/razze";

export default function AdminRazzePage() {
  const [search, setSearch] = useState("");
  const [groupFilter, setGroupFilter] = useState<number | null>(null);

  const filtered = razze.filter((r) => {
    if (search && !r.name_it.toLowerCase().includes(search.toLowerCase())) return false;
    if (groupFilter !== null && r.group_fci !== groupFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Gestione Razze</h1>
        <Button className="gap-1">
          <Plus className="h-4 w-4" />
          Aggiungi Razza
        </Button>
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

      <p className="text-sm text-muted-foreground">
        {filtered.length} razze trovate
      </p>

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
                <th className="text-left p-4 font-medium text-muted-foreground">Azioni</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((breed) => (
                <tr key={breed.slug} className="border-b border-border hover:bg-muted/50">
                  <td className="p-4">
                    <div>
                      <span className="font-medium">{breed.name_it}</span>
                      {breed.name_en && (
                        <span className="text-xs text-muted-foreground ml-2">({breed.name_en})</span>
                      )}
                    </div>
                  </td>
                  <td className="p-4 text-muted-foreground">
                    {breed.group_fci ? `Gruppo ${breed.group_fci}` : "—"}
                  </td>
                  <td className="p-4">
                    <Badge variant="outline">{breed.size_category}</Badge>
                  </td>
                  <td className="p-4 text-muted-foreground">{breed.origin_country}</td>
                  <td className="p-4">
                    <div className="flex gap-1">
                      {breed.is_italian_breed && <Badge variant="primary">Italiana</Badge>}
                      {breed.is_popular && <Badge variant="secondary">Popolare</Badge>}
                    </div>
                  </td>
                  <td className="p-4">
                    <button className="text-primary hover:underline inline-flex items-center gap-1 text-xs">
                      <Edit2 className="h-3 w-3" />
                      Modifica
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
