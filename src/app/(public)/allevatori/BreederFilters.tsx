"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";
import { SlidersHorizontal, ChevronDown, ChevronUp } from "lucide-react";
import Card, { CardContent } from "@/components/ui/Card";
import { regioni } from "@/data/regioni";

const SIZE_OPTIONS = [
  { value: "piccola", label: "Piccola" },
  { value: "media", label: "Media" },
  { value: "grande", label: "Grande" },
  { value: "gigante", label: "Gigante" },
];

const RATING_OPTIONS = [
  { value: "4", label: "4+ stelle" },
  { value: "3", label: "3+ stelle" },
  { value: "2", label: "2+ stelle" },
];

const AVAILABILITY_OPTIONS = [
  { value: "now", label: "Cuccioli disponibili ora" },
  { value: "expected", label: "Cucciolata prevista" },
  { value: "waitlist", label: "Solo lista d'attesa" },
];

export default function BreederFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showAdvanced, setShowAdvanced] = useState(false);

  const currentRegion = searchParams.get("region") ?? "";
  const currentProvince = searchParams.get("province") ?? "";
  const currentSize = searchParams.get("size") ?? "";
  const currentRating = searchParams.get("rating") ?? "";
  const currentEnci = searchParams.get("enci") === "true";
  const currentFci = searchParams.get("fci") === "true";
  const currentAvailability = searchParams.get("availability") ?? "";
  const currentPedigree = searchParams.get("pedigree") === "true";
  const currentHealth = searchParams.get("health") === "true";
const currentQ = searchParams.get("q") ?? "";
  const currentSort = searchParams.get("sort") ?? "";

  const provincesForRegion = regioni.find((r) => r.nome === currentRegion)?.province ?? [];

  const applyFilter = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      // Reset province when region changes
      if (key === "region") params.delete("province");
      router.push(`/allevatori?${params.toString()}`);
    },
    [router, searchParams]
  );

  const toggleFilter = useCallback(
    (key: string, currentValue: boolean) => {
      applyFilter(key, currentValue ? null : "true");
    },
    [applyFilter]
  );

  const hasActiveFilters = currentRegion || currentProvince || currentSize || currentRating || currentEnci || currentFci || currentAvailability || currentPedigree || currentHealth;

  return (
    <Card>
      <CardContent className="p-5 space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4" />
            Filtri
          </h3>
          {hasActiveFilters && (
            <button
              onClick={() => {
                const params = new URLSearchParams();
                if (currentQ) params.set("q", currentQ);
                if (currentSort) params.set("sort", currentSort);
                router.push(`/allevatori?${params.toString()}`);
              }}
              className="text-xs text-primary hover:underline"
            >
              Reimposta
            </button>
          )}
        </div>

        {/* Regione */}
        <div>
          <h4 className="text-sm font-medium mb-2">Regione</h4>
          <select
            value={currentRegion}
            onChange={(e) => applyFilter("region", e.target.value || null)}
            className="w-full px-3 py-2 rounded-lg border border-border text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">Tutte le regioni</option>
            {regioni.map((r) => (
              <option key={r.slug} value={r.nome}>{r.nome}</option>
            ))}
          </select>
        </div>

        {/* Provincia (cascading) */}
        {currentRegion && provincesForRegion.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2">Provincia</h4>
            <select
              value={currentProvince}
              onChange={(e) => applyFilter("province", e.target.value || null)}
              className="w-full px-3 py-2 rounded-lg border border-border text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Tutte le province</option>
              {provincesForRegion.map((p) => (
                <option key={p.sigla} value={p.nome}>{p.nome}</option>
              ))}
            </select>
          </div>
        )}

        {/* Taglia */}
        <div>
          <h4 className="text-sm font-medium mb-2">Taglia</h4>
          <div className="space-y-1.5">
            {SIZE_OPTIONS.map((s) => (
              <label key={s.value} className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                <input
                  type="radio"
                  name="size"
                  checked={currentSize === s.value}
                  onChange={() => applyFilter("size", currentSize === s.value ? null : s.value)}
                  className="accent-primary"
                />
                {s.label}
              </label>
            ))}
            {currentSize && (
              <button onClick={() => applyFilter("size", null)} className="text-xs text-primary hover:underline mt-1">
                Rimuovi
              </button>
            )}
          </div>
        </div>

        {/* Certificazioni */}
        <div>
          <h4 className="text-sm font-medium mb-2">Certificazioni</h4>
          <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={currentEnci}
                onChange={() => toggleFilter("enci", currentEnci)}
                className="accent-primary rounded"
              />
              Verificato ENCI
            </label>
            <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={currentFci}
                onChange={() => toggleFilter("fci", currentFci)}
                className="accent-primary rounded"
              />
              Affiliato FCI
            </label>
          </div>
        </div>

        {/* Valutazione */}
        <div>
          <h4 className="text-sm font-medium mb-2">Valutazione minima</h4>
          <div className="space-y-1.5">
            {RATING_OPTIONS.map((r) => (
              <label key={r.value} className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                <input
                  type="radio"
                  name="rating"
                  checked={currentRating === r.value}
                  onChange={() => applyFilter("rating", currentRating === r.value ? null : r.value)}
                  className="accent-primary"
                />
                {r.label}
              </label>
            ))}
            {currentRating && (
              <button onClick={() => applyFilter("rating", null)} className="text-xs text-primary hover:underline mt-1">
                Rimuovi
              </button>
            )}
          </div>
        </div>

        {/* Disponibilità */}
        <div>
          <h4 className="text-sm font-medium mb-2">Disponibilità</h4>
          <div className="space-y-1.5">
            {AVAILABILITY_OPTIONS.map((a) => (
              <label key={a.value} className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                <input
                  type="radio"
                  name="availability"
                  checked={currentAvailability === a.value}
                  onChange={() => applyFilter("availability", currentAvailability === a.value ? null : a.value)}
                  className="accent-primary"
                />
                {a.label}
              </label>
            ))}
            {currentAvailability && (
              <button onClick={() => applyFilter("availability", null)} className="text-xs text-primary hover:underline mt-1">
                Rimuovi
              </button>
            )}
          </div>
        </div>

        {/* Advanced filters (expandable) */}
        <div className="border-t border-border pt-4">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center justify-between w-full text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Filtri avanzati
            {showAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>

          {showAdvanced && (
            <div className="mt-4 space-y-4">
              <div>
                <h4 className="text-sm font-medium mb-2">Documentazione</h4>
                <div className="space-y-1.5">
                  <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                    <input
                      type="checkbox"
                      checked={currentPedigree}
                      onChange={() => toggleFilter("pedigree", currentPedigree)}
                      className="accent-primary rounded"
                    />
                    Pedigree ENCI
                  </label>
                  <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                    <input
                      type="checkbox"
                      checked={currentHealth}
                      onChange={() => toggleFilter("health", currentHealth)}
                      className="accent-primary rounded"
                    />
                    Test sanitari eseguiti
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
