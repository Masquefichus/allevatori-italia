"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Card, { CardContent, CardHeader } from "@/components/ui/Card";
import ImageUpload from "@/components/ui/ImageUpload";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { DOG_TITLES, HEALTH_SCREENING_TYPES } from "@/lib/constants";

interface BreedingDog {
  id: string;
  name: string;
  call_name: string | null;
  sex: "maschio" | "femmina";
  breed_id: string | null;
  affisso: string | null;
}

interface Breed {
  id: string;
  name_it: string;
}

interface PuppyForm {
  name: string;
  sex: "maschio" | "femmina";
  color: string;
  status: "disponibile" | "prenotato" | "venduto";
  photo_url: string;
  price: string;
  price_on_request: boolean;
  microchip_number: string;
  notes: string;
}

export default function NuovaCucciolataPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [dogs, setDogs] = useState<BreedingDog[]>([]);
  const [allBreeds, setAllBreeds] = useState<Breed[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [motherId, setMotherId] = useState("");
  const [fatherId, setFatherId] = useState("");
  const [isExternalFather, setIsExternalFather] = useState(false);
  const [externalFatherName, setExternalFatherName] = useState("");
  const [externalFatherKennel, setExternalFatherKennel] = useState("");
  const [externalFatherBreedId, setExternalFatherBreedId] = useState("");
  const [externalFatherColor, setExternalFatherColor] = useState("");
  const [externalFatherPedigree, setExternalFatherPedigree] = useState("");
  const [externalFatherPhoto, setExternalFatherPhoto] = useState("");
  const [externalFatherTitles, setExternalFatherTitles] = useState<string[]>([]);
  const [externalFatherScreenings, setExternalFatherScreenings] = useState<Record<string, string>>({});
  const [litterDate, setLitterDate] = useState("");
  const [pedigreeIncluded, setPedigreeIncluded] = useState(true);
  const [vaccinated, setVaccinated] = useState(false);
  const [microchipped, setMicrochipped] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [puppies, setPuppies] = useState<PuppyForm[]>([]);

  useEffect(() => {
    if (!user) return;
    async function load() {
      const supabase = createClient();
      if (!supabase) return;

      const { data: bp } = await (supabase as any)
        .from("breeder_profiles")
        .select("id")
        .eq("user_id", user!.id)
        .single();

      if (bp) {
        const { data: dogRows } = await (supabase as any)
          .from("breeding_dogs")
          .select("id, name, call_name, affisso, sex, breed_id")
          .eq("breeder_id", bp.id)
          .order("sort_order");
        setDogs(dogRows || []);
      }

      const { data: breedRows } = await supabase.from("breeds").select("id, name_it").order("name_it");
      setAllBreeds(breedRows || []);
    }
    load();
  }, [user]);

  const femmine = dogs.filter((d) => d.sex === "femmina");
  const maschi = dogs.filter((d) => d.sex === "maschio");

  function getLitterName() {
    const mother = dogs.find((d) => d.id === motherId);
    const motherName = mother?.name || "?";
    const fatherName = isExternalFather ? (externalFatherName || "?") : (dogs.find((d) => d.id === fatherId)?.name || "?");
    return `Cucciolata di ${motherName} e ${fatherName}`;
  }

  async function save(status: "attivo" | "bozza") {
    if (!user) return;
    if (!motherId) { setError("Seleziona la madre."); return; }
    if (!isExternalFather && !fatherId) { setError("Seleziona il padre."); return; }
    if (isExternalFather && !externalFatherName.trim()) { setError("Inserisci il nome del padre esterno."); return; }

    setSaving(true);
    setError(null);

    const supabase = createClient();
    if (!supabase) { setSaving(false); return; }
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setSaving(false); return; }

    const mother = dogs.find((d) => d.id === motherId);

    const payload = {
      name: getLitterName(),
      breed_id: mother?.breed_id || null,
      mother_id: motherId,
      father_id: isExternalFather ? null : (fatherId || null),
      is_external_father: isExternalFather,
      external_father_name: isExternalFather ? externalFatherName.trim() || null : null,
      external_father_kennel: isExternalFather ? externalFatherKennel.trim() || null : null,
      external_father_breed_id: isExternalFather ? externalFatherBreedId || null : null,
      external_father_color: isExternalFather ? externalFatherColor.trim() || null : null,
      external_father_pedigree_number: isExternalFather ? externalFatherPedigree.trim() || null : null,
      external_father_photo_url: isExternalFather ? externalFatherPhoto || null : null,
      external_father_titles: isExternalFather ? externalFatherTitles : [],
      external_father_health_screenings: isExternalFather ? externalFatherScreenings : {},
      litter_date: litterDate || null,
      pedigree_included: pedigreeIncluded,
      vaccinated,
      microchipped,
      images,
      status,
      notes: notes.trim() || null,
      puppies: puppies.map((p) => ({
        name: p.name.trim() || null,
        sex: p.sex,
        color: p.color.trim() || null,
        status: p.status,
        photo_url: p.photo_url || null,
        price: p.price ? parseInt(p.price) : null,
        price_on_request: p.price_on_request,
        microchip_number: p.microchip_number.trim() || null,
        notes: p.notes.trim() || null,
      })),
    };

    const res = await fetch("/api/litters", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      setError("Errore durante il salvataggio. Riprova.");
      setSaving(false);
      return;
    }

    router.push("/dashboard/annunci");
  }

  function addPuppy() {
    setPuppies((prev) => [...prev, { name: "", sex: "maschio", color: "", status: "disponibile", photo_url: "", price: "", price_on_request: false, microchip_number: "", notes: "" }]);
  }

  function updatePuppy(idx: number, updates: Partial<PuppyForm>) {
    setPuppies((prev) => prev.map((p, i) => i === idx ? { ...p, ...updates } : p));
  }

  function removePuppy(idx: number) {
    setPuppies((prev) => prev.filter((_, i) => i !== idx));
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/dashboard/annunci" className="text-sm text-primary hover:underline flex items-center gap-1 mb-2">
          <ArrowLeft className="h-3 w-3" /> Torna alle cucciolate
        </Link>
        <h1 className="text-2xl font-bold">Nuova Cucciolata</h1>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive text-sm px-4 py-3 rounded-lg">{error}</div>
      )}

      <div className="space-y-6">
        {/* Parents */}
        <Card>
          <CardHeader><h2 className="font-semibold">Genitori</h2></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Madre *</label>
              <select value={motherId} onChange={(e) => setMotherId(e.target.value)} className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                <option value="">Seleziona fattrice</option>
                {femmine.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium">Padre *</label>
                <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                  <input type="checkbox" checked={isExternalFather} onChange={(e) => { setIsExternalFather(e.target.checked); setFatherId(""); }} className="rounded" />
                  Monta esterna
                </label>
              </div>
              {!isExternalFather ? (
                <select value={fatherId} onChange={(e) => setFatherId(e.target.value)} className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                  <option value="">Seleziona stallone</option>
                  {maschi.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              ) : (
                <div className="space-y-3 p-3 bg-muted/30 rounded-lg border border-border">
                  <div className="grid grid-cols-2 gap-3">
                    <Input label="Nome (con Affisso) *" value={externalFatherName} onChange={(e) => setExternalFatherName(e.target.value)} placeholder="Nome del padre" id="ext-name" />
                    <Input label="Allevamento" value={externalFatherKennel} onChange={(e) => setExternalFatherKennel(e.target.value)} placeholder="Nome allevamento" id="ext-kennel" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Input label="Colore" value={externalFatherColor} onChange={(e) => setExternalFatherColor(e.target.value)} id="ext-color" />
                    <Input label="Pedigree (ROI)" value={externalFatherPedigree} onChange={(e) => setExternalFatherPedigree(e.target.value)} id="ext-ped" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Razza</label>
                    <select value={externalFatherBreedId} onChange={(e) => setExternalFatherBreedId(e.target.value)} className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                      <option value="">Seleziona razza</option>
                      {allBreeds.map((b) => <option key={b.id} value={b.id}>{b.name_it}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Foto</label>
                    <ImageUpload images={externalFatherPhoto ? [externalFatherPhoto] : []} onChange={(imgs) => setExternalFatherPhoto(imgs[0] ?? "")} maxImages={1} folder="litters" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Titoli</label>
                    <div className="flex flex-wrap gap-1.5">
                      {DOG_TITLES.map((t) => (
                        <button key={t} type="button"
                          onClick={() => setExternalFatherTitles((prev) => prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t])}
                          className={`text-xs px-2 py-1 rounded-full border transition-colors ${externalFatherTitles.includes(t) ? "bg-primary text-white border-primary" : "border-border text-muted-foreground hover:border-primary/50"}`}
                        >{t}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Screening sanitari</label>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(HEALTH_SCREENING_TYPES).map(([key, hs]) => (
                        <div key={key}>
                          <label className="text-xs text-muted-foreground">{hs.label}</label>
                          <select
                            value={externalFatherScreenings[key] ?? ""}
                            onChange={(e) => {
                              const updated = { ...externalFatherScreenings };
                              if (e.target.value) updated[key] = e.target.value; else delete updated[key];
                              setExternalFatherScreenings(updated);
                            }}
                            className="w-full border border-border rounded-lg px-2 py-1 text-xs bg-white"
                          >
                            <option value="">--</option>
                            {hs.grades.map((g) => <option key={g} value={g}>{g}</option>)}
                          </select>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
            {(motherId || (isExternalFather ? externalFatherName : fatherId)) && (
              <div className="bg-muted/50 rounded-lg px-3 py-2">
                <p className="text-xs text-muted-foreground">Nome cucciolata</p>
                <p className="text-sm font-medium">{getLitterName()}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Litter details */}
        <Card>
          <CardHeader><h2 className="font-semibold">Dettagli cucciolata</h2></CardHeader>
          <CardContent className="space-y-4">
            <Input label="Data di nascita" type="date" id="litter_date" value={litterDate} onChange={(e) => setLitterDate(e.target.value)} />
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={pedigreeIncluded} onChange={(e) => setPedigreeIncluded(e.target.checked)} className="rounded" /> Pedigree
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={vaccinated} onChange={(e) => setVaccinated(e.target.checked)} className="rounded" /> Vaccinati
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={microchipped} onChange={(e) => setMicrochipped(e.target.checked)} className="rounded" /> Microchippati
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Foto cucciolata</label>
              <ImageUpload images={images} onChange={setImages} maxImages={6} folder="litters" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Note</label>
              <textarea rows={3} className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Note aggiuntive sulla cucciolata" />
            </div>
          </CardContent>
        </Card>

        {/* Puppies */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Cuccioli ({puppies.length})</h2>
              <button type="button" onClick={addPuppy} className="text-sm text-primary hover:underline flex items-center gap-1">
                <Plus className="h-3.5 w-3.5" /> Aggiungi cucciolo
              </button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Numero cuccioli</label>
              <input
                type="number" min={0} max={20}
                value={puppies.length || ""}
                onChange={(e) => {
                  const n = Math.max(0, Math.min(20, parseInt(e.target.value) || 0));
                  setPuppies((prev) => {
                    if (n > prev.length) {
                      const toAdd = Array.from({ length: n - prev.length }, () => ({ name: "", sex: "maschio" as const, color: "", status: "disponibile" as const, photo_url: "", price: "", price_on_request: false, microchip_number: "", notes: "" }));
                      return [...prev, ...toAdd];
                    }
                    return prev.slice(0, n);
                  });
                }}
                placeholder="Es. 6"
                className="w-32 rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            {puppies.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">Inserisci il numero di cuccioli o clicca &quot;Aggiungi cucciolo&quot;.</p>
            )}
            {puppies.map((puppy, idx) => (
              <div key={idx} className="p-3 bg-muted/30 rounded-lg border border-border space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-muted-foreground">Cucciolo {idx + 1}</p>
                  <button type="button" onClick={() => removePuppy(idx)} className="text-red-400 hover:text-red-600"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <Input label="Nome" value={puppy.name} onChange={(e) => updatePuppy(idx, { name: e.target.value })} placeholder="Nome cucciolo" id={`puppy-name-${idx}`} />
                  <div>
                    <label className="block text-sm font-medium mb-1">Sesso *</label>
                    <div className="flex gap-1">
                      {(["maschio", "femmina"] as const).map((s) => (
                        <button key={s} type="button" onClick={() => updatePuppy(idx, { sex: s })}
                          className={`flex-1 text-xs py-2 rounded-lg border transition-colors ${puppy.sex === s ? "bg-primary text-white border-primary" : "border-border text-muted-foreground"}`}
                        >{s === "maschio" ? "Maschio" : "Femmina"}</button>
                      ))}
                    </div>
                  </div>
                  <Input label="Colore" value={puppy.color} onChange={(e) => updatePuppy(idx, { color: e.target.value })} id={`puppy-color-${idx}`} />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Stato</label>
                    <select value={puppy.status} onChange={(e) => updatePuppy(idx, { status: e.target.value as PuppyForm["status"] })} className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                      <option value="disponibile">Disponibile</option>
                      <option value="prenotato">Prenotato</option>
                      <option value="venduto">Venduto</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Prezzo</label>
                    {!puppy.price_on_request && (
                      <input type="number" value={puppy.price} onChange={(e) => updatePuppy(idx, { price: e.target.value })} placeholder="EUR" className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                    )}
                    <label className="flex items-center gap-1.5 text-xs mt-1 cursor-pointer">
                      <input type="checkbox" checked={puppy.price_on_request} onChange={(e) => updatePuppy(idx, { price_on_request: e.target.checked, price: "" })} className="rounded" />
                      Su richiesta
                    </label>
                  </div>
                  <Input label="Microchip" value={puppy.microchip_number} onChange={(e) => updatePuppy(idx, { microchip_number: e.target.value })} id={`puppy-mc-${idx}`} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Foto</label>
                    <ImageUpload images={puppy.photo_url ? [puppy.photo_url] : []} onChange={(imgs) => updatePuppy(idx, { photo_url: imgs[0] ?? "" })} maxImages={1} folder="puppies" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Note</label>
                    <textarea rows={2} className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" value={puppy.notes} onChange={(e) => updatePuppy(idx, { notes: e.target.value })} placeholder="Note sul cucciolo" />
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button variant="outline" type="button" disabled={saving} onClick={() => save("bozza")}>
            {saving ? "Salvataggio..." : "Salva come Bozza"}
          </Button>
          <Button type="button" disabled={saving} onClick={() => save("attivo")}>
            {saving ? "Pubblicazione..." : "Pubblica"}
          </Button>
        </div>
      </div>
    </div>
  );
}
