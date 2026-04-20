"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";
import { SlidersHorizontal, ChevronDown, ChevronUp, Search } from "lucide-react";
import { X } from "lucide-react";
import Card, { CardContent } from "@/components/ui/Card";
import { gruppiFCI } from "@/data/razze";
import razzeEnriched from "@/data/razze-enriched.json";

const COUNTRY_OPTIONS = [...new Set(razzeEnriched.map((r) => r.origin_country))]
  .sort((a, b) => a.localeCompare(b, "it"));

const SIZE_OPTIONS = [
  { value: "piccola", label: "Piccola" },
  { value: "media", label: "Media" },
  { value: "grande", label: "Grande" },
  { value: "gigante", label: "Gigante" },
];

const COAT_OPTIONS = [
  { value: "corto", label: "Corto" },
  { value: "medio", label: "Medio" },
  { value: "lungo", label: "Lungo" },
  { value: "duro", label: "Duro (Wire)" },
  { value: "riccio", label: "Riccio" },
  { value: "senza_pelo", label: "Senza pelo" },
  { value: "doppio", label: "Doppio" },
];

const USE_OPTIONS = [
  { value: "compagnia", label: "Compagnia" },
  { value: "guardia", label: "Guardia" },
  { value: "caccia", label: "Caccia" },
  { value: "sport", label: "Sport" },
  { value: "pastorizia", label: "Pastorizia" },
  { value: "lavoro", label: "Lavoro" },
  { value: "terapia", label: "Terapia" },
  { value: "slitta", label: "Slitta" },
];

const EXERCISE_OPTIONS = [
  { value: "2", label: "Basso (max 2/5)" },
  { value: "3", label: "Moderato (max 3/5)" },
  { value: "4", label: "Alto (max 4/5)" },
];

export default function BreedFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [searchInput, setSearchInput] = useState(searchParams.get("q") ?? "");

  const currentQ = searchParams.get("q") ?? "";
  const currentSize = searchParams.get("size") ?? "";
  const currentGroup = searchParams.get("group") ?? "";
  const currentCoat = searchParams.get("coat") ?? "";
  const currentApartment = searchParams.get("apartment") === "true";
  const currentFirstTime = searchParams.get("first_time") === "true";
  const currentItalian = searchParams.get("italian") === "true";
  const currentUse = searchParams.get("use") ?? "";
  const currentExerciseMax = searchParams.get("exercise_max") ?? "";
  const currentDroolMax = searchParams.get("drool_max") ?? "";
  const currentAloneMin = searchParams.get("alone_min") ?? "";
  const currentHeatMin = searchParams.get("heat_min") ?? "";
  const currentColdMin = searchParams.get("cold_min") ?? "";
  const currentHeightMin = searchParams.get("height_min") ?? "";
  const currentHeightMax = searchParams.get("height_max") ?? "";
  const currentCountry = searchParams.get("country") ?? "";

  const [heightMinInput, setHeightMinInput] = useState(searchParams.get("height_min") ?? "");
  const [heightMaxInput, setHeightMaxInput] = useState(searchParams.get("height_max") ?? "");

  const applyFilter = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      router.push(`/razze?${params.toString()}`);
    },
    [router, searchParams]
  );

  const toggleFilter = useCallback(
    (key: string, currentValue: boolean) => {
      applyFilter(key, currentValue ? null : "true");
    },
    [applyFilter]
  );

  const hasActiveFilters = currentQ || currentSize || currentGroup || currentCoat || currentApartment || currentFirstTime || currentItalian || currentUse || currentExerciseMax || currentDroolMax || currentAloneMin || currentHeatMin || currentColdMin || currentHeightMin || currentHeightMax || currentCountry;

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
              onClick={() => router.push("/razze")}
              className="text-xs text-primary hover:underline"
            >
              Reimposta
            </button>
          )}
        </div>

        {/* Search */}
        <div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Cerca razza..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  applyFilter("q", searchInput || null);
                }
              }}
              onBlur={() => {
                if (searchInput !== currentQ) {
                  applyFilter("q", searchInput || null);
                }
              }}
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-border text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        {/* Taglia */}
        <div>
          <h4 className="text-sm font-medium mb-2">Taglia</h4>
          <div className="space-y-1.5">
            {SIZE_OPTIONS.map((s) => {
              const sizes = currentSize ? currentSize.split(",") : [];
              const checked = sizes.includes(s.value);
              return (
                <label key={s.value} className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => {
                      const next = checked
                        ? sizes.filter((v) => v !== s.value)
                        : [...sizes, s.value];
                      applyFilter("size", next.length ? next.join(",") : null);
                    }}
                    className="accent-primary rounded"
                  />
                  {s.label}
                </label>
              );
            })}
          </div>
        </div>

        {/* Gruppo FCI */}
        <div>
          <h4 className="text-sm font-medium mb-2">Gruppo FCI</h4>
          <select
            value={currentGroup}
            onChange={(e) => applyFilter("group", e.target.value || null)}
            className="w-full px-3 py-2 rounded-lg border border-border text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">Tutti i gruppi</option>
            {Object.entries(gruppiFCI)
              .sort(([a], [b]) => Number(a) - Number(b))
              .map(([num, name]) => (
                <option key={num} value={num}>
                  {num}. {name}
                </option>
              ))}
          </select>
        </div>

        {/* Tipo mantello */}
        <div>
          <h4 className="text-sm font-medium mb-2">Tipo mantello</h4>
          <select
            value={currentCoat}
            onChange={(e) => applyFilter("coat", e.target.value || null)}
            className="w-full px-3 py-2 rounded-lg border border-border text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">Tutti i tipi</option>
            {COAT_OPTIONS.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>

        {/* Paese di origine */}
        <div>
          <h4 className="text-sm font-medium mb-2">Paese di origine</h4>
          {(() => {
            const selected = currentCountry ? currentCountry.split(",") : [];
            return (
              <>
                <select
                  value=""
                  onChange={(e) => {
                    if (!e.target.value) return;
                    const next = [...selected, e.target.value];
                    applyFilter("country", next.join(","));
                  }}
                  className="w-full px-3 py-2 rounded-lg border border-border text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">
                    {selected.length ? "Aggiungi paese..." : "Tutti i paesi"}
                  </option>
                  {COUNTRY_OPTIONS.filter((c) => !selected.includes(c)).map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                {selected.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {selected.map((c) => (
                      <button
                        key={c}
                        onClick={() => {
                          const next = selected.filter((v) => v !== c);
                          applyFilter("country", next.length ? next.join(",") : null);
                        }}
                        className="flex items-center gap-1 text-xs bg-primary-light text-primary px-2 py-1 rounded-lg hover:bg-primary/10"
                      >
                        {c}
                        <X className="h-3 w-3" />
                      </button>
                    ))}
                  </div>
                )}
              </>
            );
          })()}
        </div>

        {/* Quick toggles */}
        <div>
          <h4 className="text-sm font-medium mb-2">Adatto a</h4>
          <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={currentApartment}
                onChange={() => toggleFilter("apartment", currentApartment)}
                className="accent-primary rounded"
              />
              Vita in appartamento
            </label>
            <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={currentFirstTime}
                onChange={() => toggleFilter("first_time", currentFirstTime)}
                className="accent-primary rounded"
              />
              Primo proprietario
            </label>
            <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={currentItalian}
                onChange={() => toggleFilter("italian", currentItalian)}
                className="accent-primary rounded"
              />
              Solo razze italiane
            </label>
          </div>
        </div>

        {/* Utilizzo */}
        <div>
          <h4 className="text-sm font-medium mb-2">Utilizzo</h4>
          <div className="space-y-1.5">
            {USE_OPTIONS.map((u) => (
              <label key={u.value} className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                <input
                  type="radio"
                  name="use"
                  checked={currentUse === u.value}
                  onChange={() => applyFilter("use", currentUse === u.value ? null : u.value)}
                  className="accent-primary"
                />
                {u.label}
              </label>
            ))}
            {currentUse && (
              <button onClick={() => applyFilter("use", null)} className="text-xs text-primary hover:underline mt-1">
                Rimuovi
              </button>
            )}
          </div>
        </div>

        {/* Advanced filters */}
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
              {/* Exercise needs */}
              <div>
                <h4 className="text-sm font-medium mb-2">Esercizio fisico (max)</h4>
                <div className="space-y-1.5">
                  {EXERCISE_OPTIONS.map((e) => (
                    <label key={e.value} className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                      <input
                        type="radio"
                        name="exercise_max"
                        checked={currentExerciseMax === e.value}
                        onChange={() => applyFilter("exercise_max", currentExerciseMax === e.value ? null : e.value)}
                        className="accent-primary"
                      />
                      {e.label}
                    </label>
                  ))}
                  {currentExerciseMax && (
                    <button onClick={() => applyFilter("exercise_max", null)} className="text-xs text-primary hover:underline mt-1">
                      Rimuovi
                    </button>
                  )}
                </div>
              </div>

              {/* Drooling max */}
              <div>
                <h4 className="text-sm font-medium mb-2">Bava (max)</h4>
                <select
                  value={currentDroolMax}
                  onChange={(e) => applyFilter("drool_max", e.target.value || null)}
                  className="w-full px-3 py-2 rounded-lg border border-border text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Qualsiasi</option>
                  <option value="1">Minima (1/5)</option>
                  <option value="2">Bassa (max 2/5)</option>
                  <option value="3">Moderata (max 3/5)</option>
                </select>
              </div>

              {/* Alone tolerance */}
              <div>
                <h4 className="text-sm font-medium mb-2">Tolleranza solitudine (min)</h4>
                <select
                  value={currentAloneMin}
                  onChange={(e) => applyFilter("alone_min", e.target.value || null)}
                  className="w-full px-3 py-2 rounded-lg border border-border text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Qualsiasi</option>
                  <option value="3">Moderata (min 3/5)</option>
                  <option value="4">Alta (min 4/5)</option>
                </select>
              </div>

              {/* Heat tolerance */}
              <div>
                <h4 className="text-sm font-medium mb-2">Tolleranza al caldo (min)</h4>
                <select
                  value={currentHeatMin}
                  onChange={(e) => applyFilter("heat_min", e.target.value || null)}
                  className="w-full px-3 py-2 rounded-lg border border-border text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Qualsiasi</option>
                  <option value="3">Moderata (min 3/5)</option>
                  <option value="4">Alta (min 4/5)</option>
                </select>
              </div>

              {/* Cold tolerance */}
              <div>
                <h4 className="text-sm font-medium mb-2">Tolleranza al freddo (min)</h4>
                <select
                  value={currentColdMin}
                  onChange={(e) => applyFilter("cold_min", e.target.value || null)}
                  className="w-full px-3 py-2 rounded-lg border border-border text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Qualsiasi</option>
                  <option value="3">Moderata (min 3/5)</option>
                  <option value="4">Alta (min 4/5)</option>
                </select>
              </div>

              {/* Height range */}
              <div>
                <h4 className="text-sm font-medium mb-2">Altezza al garrese (cm)</h4>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={heightMinInput}
                    onChange={(e) => setHeightMinInput(e.target.value)}
                    onBlur={() => applyFilter("height_min", heightMinInput || null)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") applyFilter("height_min", heightMinInput || null);
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-border text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={heightMaxInput}
                    onChange={(e) => setHeightMaxInput(e.target.value)}
                    onBlur={() => applyFilter("height_max", heightMaxInput || null)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") applyFilter("height_max", heightMaxInput || null);
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-border text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
