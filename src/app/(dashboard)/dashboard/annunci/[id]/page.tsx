"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Card, { CardContent, CardHeader } from "@/components/ui/Card";
import { razze } from "@/data/razze";
import { HEALTH_CERTIFICATIONS } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";
import ImageUpload from "@/components/ui/ImageUpload";

export default function ModificaAnnuncioPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [breed, setBreed] = useState("");
  const [description, setDescription] = useState("");
  const [litterDate, setLitterDate] = useState("");
  const [availablePuppies, setAvailablePuppies] = useState("");
  const [gender, setGender] = useState("");
  const [priceOnRequest, setPriceOnRequest] = useState(false);
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [pedigree, setPedigree] = useState(true);
  const [vaccinated, setVaccinated] = useState(false);
  const [microchipped, setMicrochipped] = useState(false);
  const [selectedHealthTests, setSelectedHealthTests] = useState<string[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [status, setStatus] = useState<string>("bozza");

  function toggleHealthTest(cert: string) {
    setSelectedHealthTests((prev) =>
      prev.includes(cert) ? prev.filter((c) => c !== cert) : [...prev, cert]
    );
  }

  // Load existing listing
  useEffect(() => {
    async function loadListing() {
      const supabase = createClient();
      if (!supabase) { setLoading(false); return; }

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) { setLoading(false); return; }

        const { data } = await supabase
          .from("listings")
          .select("*")
          .eq("id", id)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .single() as { data: any };

        if (data) {
          setTitle(data.title || "");
          setBreed(data.breed_id || "");
          setDescription(data.description || "");
          setLitterDate(data.litter_date || "");
          setAvailablePuppies(data.available_puppies?.toString() || "");
          setGender(data.gender_available || "");
          setPriceOnRequest(data.price_on_request || false);
          setPriceMin(data.price_min?.toString() || "");
          setPriceMax(data.price_max?.toString() || "");
          setPedigree(data.pedigree_included ?? true);
          setVaccinated(data.vaccinated || false);
          setMicrochipped(data.microchipped || false);
          setSelectedHealthTests(data.health_tests || []);
          setImages(data.images || []);
          setStatus(data.status || "bozza");
        }
      } catch {}

      setLoading(false);
    }

    loadListing();
  }, [id]);

  async function handleSubmit(e: React.FormEvent, newStatus: "attivo" | "bozza") {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    const supabase = createClient();
    if (!supabase) {
      setMessage({ type: "error", text: "Supabase non configurato." });
      setSaving(false);
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setMessage({ type: "error", text: "Devi effettuare il login." });
        setSaving(false);
        return;
      }

      if (!title.trim()) {
        setMessage({ type: "error", text: "Il titolo è obbligatorio." });
        setSaving(false);
        return;
      }

      const updateData = {
        title: title.trim(),
        breed_id: breed,
        description: description.trim() || null,
        litter_date: litterDate || null,
        available_puppies: availablePuppies ? parseInt(availablePuppies) : null,
        gender_available: gender || null,
        price_on_request: priceOnRequest,
        price_min: !priceOnRequest && priceMin ? parseInt(priceMin) : null,
        price_max: !priceOnRequest && priceMax ? parseInt(priceMax) : null,
        pedigree_included: pedigree,
        vaccinated,
        microchipped,
        health_tests: selectedHealthTests,
        images,
        status: newStatus,
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from("listings") as any)
        .update(updateData)
        .eq("id", id);

      if (error) {
        setMessage({ type: "error", text: `Errore: ${error.message}` });
        setSaving(false);
        return;
      }

      setStatus(newStatus);
      setMessage({
        type: "success",
        text: newStatus === "bozza"
          ? "Bozza salvata con successo!"
          : "Annuncio aggiornato e pubblicato!",
      });

      setTimeout(() => router.push("/dashboard/annunci"), 1500);
    } catch {
      setMessage({ type: "error", text: "Errore di connessione. Riprova." });
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
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
        <h1 className="text-2xl font-bold">Modifica Cucciolata</h1>
        <p className="text-muted-foreground">
          Modifica i dettagli della tua cucciolata
        </p>
      </div>

      {message && (
        <div
          className={`p-4 rounded-lg text-sm font-medium ${
            message.type === "success"
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          {message.text}
        </div>
      )}

      <form onSubmit={(e) => handleSubmit(e, "attivo")} className="space-y-6">
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
              value={breed}
              onChange={(e) => setBreed(e.target.value)}
              options={razze.map((r) => ({
                value: r.slug,
                label: r.name_it,
              }))}
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


        <Card>
          <CardHeader>
            <h2 className="font-semibold">Foto</h2>
          </CardHeader>
          <CardContent>
            <ImageUpload
              images={images}
              onChange={setImages}
              maxImages={6}
              folder="listings"
            />
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          {status === "bozza" && (
            <Button
              variant="outline"
              type="button"
              isLoading={saving}
              onClick={(e) => handleSubmit(e, "bozza")}
            >
              Salva Bozza
            </Button>
          )}
          <Button type="submit" isLoading={saving}>
            {status === "bozza" ? "Pubblica Annuncio" : "Salva Modifiche"}
          </Button>
        </div>
      </form>
    </div>
  );
}
