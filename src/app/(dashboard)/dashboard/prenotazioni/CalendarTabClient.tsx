"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Plus, Ban, Trash2, Loader2 } from "lucide-react";
import Card, { CardContent } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import ManualBookingModal from "./ManualBookingModal";
import BlockDatesModal from "./BlockDatesModal";

interface BoardingLite {
  id: string;
  name: string;
  capacity: number;
}

interface Block {
  id: string;
  boarding_id: string;
  date_from: string;
  date_to: string;
  reason: string | null;
}

interface DayInfo {
  day: string;
  occupied: number;
  capacity: number;
  is_blocked: boolean;
}

interface Props {
  boardings: BoardingLite[];
}

const ITALIAN_MONTHS = [
  "Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno",
  "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre",
];
const ITALIAN_DAYS_SHORT = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];

function ymd(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

export default function CalendarTabClient({ boardings }: Props) {
  const [boardingId, setBoardingId] = useState<string>(boardings[0]?.id ?? "");
  const boarding = boardings.find((b) => b.id === boardingId);

  const today = new Date();
  const [cursor, setCursor] = useState(new Date(today.getFullYear(), today.getMonth(), 1));

  const [days, setDays] = useState<DayInfo[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showManual, setShowManual] = useState(false);
  const [showBlock, setShowBlock] = useState(false);

  // Range del mese: dal 1° al 1° del mese successivo
  const monthFrom = useMemo(() => ymd(cursor), [cursor]);
  const monthTo = useMemo(() => {
    const d = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
    return ymd(d);
  }, [cursor]);

  useEffect(() => {
    if (!boardingId) return;
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [rA, rB] = await Promise.all([
          fetch(
            `/api/bookings/availability?boarding_id=${boardingId}&from=${monthFrom}&to=${monthTo}`
          ),
          fetch(`/api/boarding-blocks?boarding_id=${boardingId}`),
        ]);
        const jA = await rA.json().catch(() => ({}));
        const jB = await rB.json().catch(() => ({}));
        if (cancelled) return;
        if (!rA.ok) {
          setError(jA.error || "Errore caricamento disponibilità");
          return;
        }
        setDays(jA.days || []);
        setBlocks(jB.blocks || []);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [boardingId, monthFrom, monthTo]);

  const reload = () => {
    // Trigger refetch
    setCursor(new Date(cursor));
  };

  function prevMonth() {
    setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1));
  }
  function nextMonth() {
    setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1));
  }

  async function deleteBlock(id: string) {
    if (!confirm("Eliminare questo blocco?")) return;
    const res = await fetch(`/api/boarding-blocks/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      alert(j.error || "Errore durante l'eliminazione");
      return;
    }
    reload();
  }

  // Costruisci la griglia mensile (settimane partono da lunedì)
  const grid = useMemo(() => {
    if (days.length === 0) return [] as (DayInfo | null)[][];
    const firstDay = new Date(cursor);
    const startOffset = (firstDay.getDay() + 6) % 7; // lunedì = 0
    const cells: (DayInfo | null)[] = [];
    for (let i = 0; i < startOffset; i++) cells.push(null);
    for (const d of days) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);
    const weeks: (DayInfo | null)[][] = [];
    for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
    return weeks;
  }, [days, cursor]);

  if (boardings.length === 0) {
    return null;
  }

  return (
    <div className="space-y-5">
      {/* Header con selettore pensione + azioni */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          {boardings.length > 1 && (
            <select
              value={boardingId}
              onChange={(e) => setBoardingId(e.target.value)}
              className="px-3 py-2 border border-border rounded-lg text-sm bg-white"
            >
              {boardings.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          )}
          {boarding && (
            <span className="text-xs text-muted-foreground">
              Capienza: <strong className="text-foreground">{boarding.capacity}</strong> cani
            </span>
          )}
        </div>

        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" onClick={() => setShowBlock(true)}>
            <Ban className="h-4 w-4" />
            Blocca date
          </Button>
          <Button onClick={() => setShowManual(true)}>
            <Plus className="h-4 w-4" />
            Aggiungi prenotazione
          </Button>
        </div>
      </div>

      {/* Mese corrente */}
      <div className="flex items-center justify-between">
        <button
          onClick={prevMonth}
          className="p-2 rounded-lg hover:bg-muted transition-colors"
          aria-label="Mese precedente"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h2 className="font-serif text-xl">
          {ITALIAN_MONTHS[cursor.getMonth()]} {cursor.getFullYear()}
        </h2>
        <button
          onClick={nextMonth}
          className="p-2 rounded-lg hover:bg-muted transition-colors"
          aria-label="Mese successivo"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded p-3">
          {error}
        </div>
      )}

      {/* Calendario */}
      <Card>
        <CardContent className="p-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {/* Header giorni della settimana */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {ITALIAN_DAYS_SHORT.map((d) => (
                  <div
                    key={d}
                    className="text-xs font-medium text-muted-foreground text-center py-1"
                  >
                    {d}
                  </div>
                ))}
              </div>

              {/* Celle */}
              <div className="grid grid-cols-7 gap-1">
                {grid.flat().map((cell, idx) => {
                  if (!cell) {
                    return <div key={`empty-${idx}`} className="aspect-square" />;
                  }
                  const dayNum = parseInt(cell.day.slice(8, 10), 10);
                  const cap = cell.capacity || 1;
                  const ratio = cell.occupied / cap;
                  let bg = "bg-emerald-50 border-emerald-200 text-emerald-900";
                  let label = "Libero";
                  if (cell.is_blocked) {
                    bg = "bg-slate-200 border-slate-300 text-slate-700";
                    label = "Bloccato";
                  } else if (cell.occupied >= cap) {
                    bg = "bg-red-100 border-red-300 text-red-900";
                    label = "Pieno";
                  } else if (ratio >= 0.75) {
                    bg = "bg-amber-50 border-amber-300 text-amber-900";
                    label = "Quasi pieno";
                  }
                  const isPast = new Date(cell.day + "T23:59") < new Date(today.toDateString());
                  return (
                    <div
                      key={cell.day}
                      className={`aspect-square border rounded-lg p-1.5 flex flex-col justify-between text-xs ${bg} ${
                        isPast ? "opacity-50" : ""
                      }`}
                      title={`${cell.day} — ${label} (${cell.occupied}/${cap})`}
                    >
                      <div className="font-semibold text-sm">{dayNum}</div>
                      {cell.is_blocked ? (
                        <div className="text-[10px] font-medium uppercase tracking-tight">
                          Blocco
                        </div>
                      ) : (
                        <div className="text-[11px] tabular-nums">
                          {cell.occupied}/{cap}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Legenda */}
              <div className="flex flex-wrap gap-4 text-xs mt-4 pt-3 border-t border-border">
                <Legend color="bg-emerald-100 border-emerald-300" label="Libero" />
                <Legend color="bg-amber-100 border-amber-300" label="Quasi pieno" />
                <Legend color="bg-red-200 border-red-400" label="Pieno" />
                <Legend color="bg-slate-200 border-slate-400" label="Bloccato" />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Lista blocchi attivi */}
      {blocks.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold mb-3">Date bloccate (attive e future)</h3>
            <ul className="space-y-2">
              {blocks.map((b) => (
                <li
                  key={b.id}
                  className="flex items-center justify-between gap-3 text-sm border border-border rounded-lg p-3"
                >
                  <div>
                    <div className="font-medium">
                      {b.date_from} → {b.date_to}
                    </div>
                    {b.reason && (
                      <div className="text-xs text-muted-foreground mt-0.5">{b.reason}</div>
                    )}
                  </div>
                  <button
                    onClick={() => deleteBlock(b.id)}
                    className="p-1.5 text-muted-foreground hover:text-red-600 transition-colors"
                    aria-label="Elimina blocco"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Modali */}
      {showManual && boardingId && (
        <ManualBookingModal
          boardingId={boardingId}
          onClose={() => setShowManual(false)}
          onCreated={() => {
            setShowManual(false);
            reload();
          }}
        />
      )}
      {showBlock && boardingId && (
        <BlockDatesModal
          boardingId={boardingId}
          onClose={() => setShowBlock(false)}
          onCreated={() => {
            setShowBlock(false);
            reload();
          }}
        />
      )}
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div className="inline-flex items-center gap-1.5">
      <span className={`inline-block w-3 h-3 rounded border ${color}`} />
      <span className="text-muted-foreground">{label}</span>
    </div>
  );
}
