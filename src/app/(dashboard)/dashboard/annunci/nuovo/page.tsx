"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Card, { CardContent, CardHeader } from "@/components/ui/Card";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";

interface Breed {
  id: string;
  name_it: string;
}

export default function NuovoAnnuncioPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [breeds, setBreeds] = useState<Breed[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [breedId, setBreedId] = useState("");
  const [description, setDescription] = useState("");
  const [litterDate, setLitterDate] = useState("");
  const [availablePuppies, setAvailablePuppies] = useState("");
  const [gender, setGender] = useState("");
  const [priceOnRequest, setPriceOnRequest] = useState(false);
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [asDraft, setAsDraft] = useState(false);

  useEffect(() => {
    async function loadBreeds() {
      const supabase = createClient();
      if (!supabase) return;
      const { data } = await supabase
        .from("breeds")
        .select("id, name_it")
        .order("name_it");
      if (data) setBreeds(data);
    }
    loadBreeds();
  }, []);

  async function save(status: "attivo" | "bozza") {
    if (!user) return;
    if (!title.trim()) { setError("Il titolo è obbligatorio."); return; }
    if (!breedId) { setError("Seleziona la razza."); return; }

    setSaving(true);
    setAsDraft(status === "bozza");
    setError(null);

    const supabase = createClient();
    if (!supabase) { setSaving(false); return; }

    const { data: bp } = await (supabase as any)
      .from("breeder_profiles")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!bp) {
      setError("Profilo allevatore non trovato. Completa prima il tuo profilo.");
      setSaving(false);
      return;
    }

    const payload: Record<string, unknown> = {
      breeder_id: bp.id,
      title: title.trim(),
      description: description.trim() || null,
      status,
      breed_id: breedId,
      litter_date: litterDate || null,
      available_puppies: availablePuppies ? parseInt(availablePuppies) : null,
      gender_available: gender || null,
      price_on_request: priceOnRequest,
      price_min: !priceOnRequest && priceMin ? parseInt(priceMin) : null,
      price_max: !priceOnRequest && priceMax ? parseInt(priceMax) : null,
    };

    const { error: insertError } = await (supabase as any)
      .from("listings")
      .insert(payload);

    if (insertError) {
      setError("Errore durante il salvataggio. Riprova.");
      setSaving(false);
      return;
    }

    router.push("/dashboard/annunci");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    save("attivo");
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/dashboard/annunci"
          className="text-sm text-primary hover:underline flex items-center gap-1 mb-2"
        >
          <ArrowLeft className="h-3 w-3" />
          Torna alle cucciolate
        </Link>
        <h1 className="text-2xl font-bold">Nuova Cucciolata</h1>
        <p className="text-muted-foreground">
          Crea una nuova cucciolata per i tuoi cuccioli
        </p>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive text-sm px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-6">
        <Card>
          <CardHeader>
            <h2 className="font-semibold">Informazioni Cucciolata</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="Titolo annuncio *"
              placeholder="Es. Cuccioli di Labrador Retriever disponibili"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <Select
              label="Razza *"
              id="breed"
              placeholder="Seleziona la razza"
              value={breedId}
              onChange={(e) => setBreedId(e.target.value)}
              options={breeds.map((b) => ({ value: b.id, label: b.name_it }))}
            />
            <div>
              <label className="block text-sm font-medium mb-1">
                Descrizione
              </label>
              <textarea
                rows={5}
                placeholder="Descrivi la cucciolata, i genitori, le caratteristiche..."
                className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="font-semibold">Dettagli</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="Data di nascita"
                type="date"
                id="litter_date"
                value={litterDate}
                onChange={(e) => setLitterDate(e.target.value)}
              />
              <Input
                label="Cuccioli disponibili"
                type="number"
                min={0}
                placeholder="Es. 4"
                id="available_puppies"
                value={availablePuppies}
                onChange={(e) => setAvailablePuppies(e.target.value)}
              />
              <Select
                label="Sesso disponibile"
                id="gender"
                placeholder="Seleziona"
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                options={[
                  { value: "maschio", label: "Solo maschi" },
                  { value: "femmina", label: "Solo femmine" },
                  { value: "entrambi", label: "Maschi e femmine" },
                ]}
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm cursor-pointer mb-3">
                <input
                  type="checkbox"
                  checked={priceOnRequest}
                  onChange={(e) => setPriceOnRequest(e.target.checked)}
                  className="rounded"
                />
                Prezzo su richiesta
              </label>
              {!priceOnRequest && (
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Prezzo minimo (EUR)"
                    type="number"
                    placeholder="1500"
                    id="price_min"
                    value={priceMin}
                    onChange={(e) => setPriceMin(e.target.value)}
                  />
                  <Input
                    label="Prezzo massimo (EUR)"
                    type="number"
                    placeholder="2000"
                    id="price_max"
                    value={priceMax}
                    onChange={(e) => setPriceMax(e.target.value)}
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            type="button"
            disabled={saving}
            onClick={() => save("bozza")}
          >
            {saving && asDraft ? "Salvataggio..." : "Salva come Bozza"}
          </Button>
          <Button type="submit" disabled={saving}>
            {saving && !asDraft ? "Pubblicazione..." : "Pubblica Annuncio"}
          </Button>
        </div>
      </form>
    </div>
  );
}
