"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, MapPin } from "lucide-react";
import { regioni } from "@/data/regioni";

interface Suggestion {
  label: string;
  type: "breed" | "breeder";
  href: string;
  q?: string; // per le razze, passa il q alla pagina allevatori
}

interface SearchFormProps {
  initialQ?: string;
  showRegion?: boolean;
  preserveParams?: Record<string, string>;
}

export default function SearchForm({ initialQ = "", showRegion = true, preserveParams }: SearchFormProps) {
  const router = useRouter();
  const [q, setQ] = useState(initialQ);
  const [region, setRegion] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(-1);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchSuggestions = useCallback(async (value: string) => {
    if (value.trim().length < 2) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(value)}`);
      const data = await res.json();
      const results: Suggestion[] = [
        ...(data.breeds ?? []).map((b: { name_it: string; slug: string }) => ({
          label: b.name_it,
          type: "breed" as const,
          href: `/allevatori?q=${encodeURIComponent(b.name_it)}${region ? `&region=${encodeURIComponent(region)}` : ""}`,
          q: b.name_it,
        })),
        ...(data.breeders ?? []).map((b: { kennel_name: string; slug: string }) => ({
          label: b.kennel_name,
          type: "breeder" as const,
          href: `/allevatori/${b.slug}`,
        })),
      ];
      setSuggestions(results);
      setOpen(results.length > 0);
      setHighlighted(-1);
    } finally {
      setLoading(false);
    }
  }, [region]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(q), 250);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [q, fetchSuggestions]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSelect(s: Suggestion) {
    setQ(s.label);
    setOpen(false);
    router.push(s.href);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlighted((h) => Math.min(h + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlighted((h) => Math.max(h - 1, -1));
    } else if (e.key === "Enter" && highlighted >= 0) {
      e.preventDefault();
      handleSelect(suggestions[highlighted]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setOpen(false);
    const urlParams = new URLSearchParams(preserveParams);
    if (q) urlParams.set("q", q); else urlParams.delete("q");
    if (region) urlParams.set("region", region);
    router.push(`/allevatori?${urlParams.toString()}`);
  }

  const breeds = suggestions.filter((s) => s.type === "breed");
  const breeders = suggestions.filter((s) => s.type === "breeder");

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-2xl p-2 flex flex-col sm:flex-row gap-2 max-w-2xl mx-auto shadow-md border border-border mb-8"
    >
      <div className="flex-1 flex items-center gap-2 px-4 relative" ref={containerRef}>
        <Search className="h-5 w-5 text-muted-foreground shrink-0" />
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          placeholder="Cerca per razza o allevamento..."
          autoComplete="off"
          className="w-full py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none bg-transparent text-sm"
        />

        {open && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-border rounded-xl shadow-lg z-50 overflow-hidden text-left">
            {breeds.length > 0 && (
              <>
                <p className="px-4 pt-3 pb-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Razze</p>
                {breeds.map((s, i) => (
                  <button
                    key={s.label}
                    type="button"
                    onMouseDown={() => handleSelect(s)}
                    className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                      i === highlighted ? "bg-primary text-white" : "text-foreground hover:bg-muted"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </>
            )}
            {breeders.length > 0 && (
              <>
                <p className={`px-4 pb-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide ${breeds.length > 0 ? "pt-2 border-t border-border mt-1" : "pt-3"}`}>
                  Allevatori
                </p>
                {breeders.map((s, i) => (
                  <button
                    key={s.label}
                    type="button"
                    onMouseDown={() => handleSelect(s)}
                    className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                      breeds.length + i === highlighted ? "bg-primary text-white" : "text-foreground hover:bg-muted"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </>
            )}
          </div>
        )}
      </div>

      {showRegion && (
        <div className="flex items-center gap-2 px-4 border-t sm:border-t-0 sm:border-l border-border">
          <MapPin className="h-5 w-5 text-muted-foreground shrink-0" />
          <select
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className="py-2.5 text-foreground bg-transparent focus:outline-none text-sm w-full"
          >
            <option value="">Tutta Italia</option>
            {regioni.map((r) => (
              <option key={r.slug} value={r.nome}>{r.nome}</option>
            ))}
          </select>
        </div>
      )}

      <button
        type="submit"
        className="w-full sm:w-auto whitespace-nowrap bg-primary text-white rounded-xl px-6 py-2.5 text-sm font-medium hover:bg-primary/90 transition-colors"
      >
        Cerca
      </button>
    </form>
  );
}
