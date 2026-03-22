"use client";

import { useState, useEffect } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Card, { CardContent, CardHeader } from "@/components/ui/Card";
import { regioni } from "@/data/regioni";
import { SPECIALIZATIONS, HEALTH_CERTIFICATIONS } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";

interface BreedOption { id: string; name_it: string; slug: string; }

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[àáâã]/g, "a")
    .replace(/[èéêë]/g, "e")
    .replace(/[ìíîï]/g, "i")
    .replace(/[òóôõ]/g, "o")
    .replace(/[ùúûü]/g, "u")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export default function ProfiloPage() {
  const [selectedRegion, setSelectedRegion] = useState("");
  const [selectedBreeds, setSelectedBreeds] = useState<string[]>([]);
  const [breedOptions, setBreedOptions] = useState<BreedOption[]>([]);
  const [selectedSpecs, setSelectedSpecs] = useState<string[]>([]);
  const [selectedCerts, setSelectedCerts] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [existingProfileId, setExistingProfileId] = useState<string | null>(null);

  const [form, setForm] = useState({
    kennel_name: "",
    enci_number: "",
    year_established: "",
    description: "",
    province: "",
    city: "",
    address: "",
    phone: "",
    whatsapp: "",
    email_public: "",
    website: "",
    facebook_url: "",
    instagram_url: "",
  });

  const provinces = selectedRegion
    ? regioni.find((r) => r.nome === selectedRegion)?.province ?? []
    : [];

  // Load breeds from Supabase on mount
  useEffect(() => {
    const loadBreeds = async () => {
      const supabase = createClient();
      if (!supabase) return;
      const { data } = await supabase.from("breeds").select("id,name_it,slug").order("name_it");
      if (data) setBreedOptions(data);
    };
    loadBreeds();
  }, []);

  // Load existing profile on mount
  useEffect(() => {
    const loadProfile = async () => {
      const supabase = createClient();
      if (!supabase) return;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("breeder_profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (data) {
        setExistingProfileId(data.id);
        setForm({
          kennel_name: data.kennel_name ?? "",
          enci_number: data.enci_number ?? "",
          year_established: data.year_established?.toString() ?? "",
          description: data.description ?? "",
          province: data.province ?? "",
          city: data.city ?? "",
          address: data.address ?? "",
          phone: data.phone ?? "",
          whatsapp: data.whatsapp ?? "",
          email_public: data.email_public ?? "",
          website: data.website ?? "",
          facebook_url: data.facebook_url ?? "",
          instagram_url: data.instagram_url ?? "",
        });
        setSelectedRegion(data.region ?? "");
        setSelectedBreeds(data.breed_ids ?? []);
        setSelectedSpecs(data.specializations ?? []);
        setSelectedCerts(data.certifications ?? []);
      }
      setLoadingProfile(false);
    };
    loadProfile();
  }, []);

  const toggleItem = (list: string[], setList: (v: string[]) => void, item: string) => {
    setList(list.includes(item) ? list.filter((i) => i !== item) : [...list, item]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (!form.kennel_name.trim()) {
      setError("Il nome dell'allevamento è obbligatorio.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    if (!supabase) { setError("Supabase non configurato."); setLoading(false); return; }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError("Non autenticato."); setLoading(false); return; }

    const payload = {
      user_id: user.id,
      kennel_name: form.kennel_name.trim(),
      slug: slugify(form.kennel_name.trim()),
      enci_number: form.enci_number || null,
      year_established: form.year_established ? parseInt(form.year_established) : null,
      description: form.description || null,
      region: selectedRegion || null,
      province: form.province || null,
      city: form.city || null,
      address: form.address || null,
      phone: form.phone || null,
      whatsapp: form.whatsapp || null,
      email_public: form.email_public || null,
      website: form.website || null,
      facebook_url: form.facebook_url || null,
      instagram_url: form.instagram_url || null,
      breed_ids: selectedBreeds,
      specializations: selectedSpecs,
      certifications: selectedCerts,
      is_approved: true,
    };

    let err;
    if (existingProfileId) {
      const { error: updateErr } = await supabase
        .from("breeder_profiles")
        .update(payload)
        .eq("id", existingProfileId);
      err = updateErr;
    } else {
      const { data: inserted, error: insertErr } = await supabase
        .from("breeder_profiles")
        .insert(payload)
        .select("id")
        .single();
      err = insertErr;
      if (inserted) setExistingProfileId(inserted.id);
    }

    if (err) {
      setError(err.message);
    } else {
      // Assicura che il ruolo nel profilo utente sia impostato a "breeder"
      await supabase.from("profiles").update({ role: "breeder" }).eq("id", user.id);
      setSuccess(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    setLoading(false);
  };

  if (loadingProfile) {
    return <div className="text-muted-foreground text-sm p-8">Caricamento profilo...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Profilo Allevamento</h1>
        <p className="text-muted-foreground">Gestisci le informazioni del tuo allevamento</p>
      </div>

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-800 text-sm p-4 rounded-lg">
          ✅ Profilo salvato con successo! Il tuo allevamento è ora visibile nella directory.
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-4 rounded-lg">
          ❌ {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <Card>
          <CardHeader><h2 className="font-semibold">Informazioni Base</h2></CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="Nome Allevamento *"
              placeholder="Es. Allevamento Del Sole"
              value={form.kennel_name}
              onChange={(e) => setForm({ ...form, kennel_name: e.target.value })}
              required
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Numero ENCI"
                placeholder="Es. MI-12345"
                value={form.enci_number}
                onChange={(e) => setForm({ ...form, enci_number: e.target.value })}
              />
              <Input
                label="Anno di fondazione"
                type="number"
                placeholder="Es. 2005"
                value={form.year_established}
                onChange={(e) => setForm({ ...form, year_established: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Descrizione</label>
              <textarea
                rows={5}
                placeholder="Descrivi il tuo allevamento..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </CardContent>
        </Card>

        {/* Location */}
        <Card>
          <CardHeader><h2 className="font-semibold">Posizione</h2></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Regione"
                placeholder="Seleziona regione"
                options={regioni.map((r) => ({ value: r.nome, label: r.nome }))}
                value={selectedRegion}
                onChange={(e) => { setSelectedRegion(e.target.value); setForm({ ...form, province: "" }); }}
              />
              <Select
                label="Provincia"
                placeholder="Seleziona provincia"
                options={provinces.map((p) => ({ value: p.nome, label: `${p.nome} (${p.sigla})` }))}
                value={form.province}
                onChange={(e) => setForm({ ...form, province: e.target.value })}
                disabled={!selectedRegion}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Città" placeholder="Es. Monza" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
              <Input label="Indirizzo" placeholder="Es. Via Roma 1" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>
          </CardContent>
        </Card>

        {/* Contacts */}
        <Card>
          <CardHeader><h2 className="font-semibold">Contatti</h2></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Telefono" type="tel" placeholder="+39 02 1234567" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              <Input label="WhatsApp" type="tel" placeholder="+39 333 1234567" value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Email pubblica" type="email" placeholder="info@allevamento.it" value={form.email_public} onChange={(e) => setForm({ ...form, email_public: e.target.value })} />
              <Input label="Sito Web" type="url" placeholder="https://www.allevamento.it" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Facebook" placeholder="URL pagina Facebook" value={form.facebook_url} onChange={(e) => setForm({ ...form, facebook_url: e.target.value })} />
              <Input label="Instagram" placeholder="URL profilo Instagram" value={form.instagram_url} onChange={(e) => setForm({ ...form, instagram_url: e.target.value })} />
            </div>
          </CardContent>
        </Card>

        {/* Breeds */}
        <Card>
          <CardHeader><h2 className="font-semibold">Razze Allevate</h2></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {breedOptions.map((breed) => (
                <label key={breed.id} className="flex items-center gap-2 text-sm cursor-pointer p-2 rounded hover:bg-muted">
                  <input
                    type="checkbox"
                    className="rounded"
                    checked={selectedBreeds.includes(breed.id)}
                    onChange={() => toggleItem(selectedBreeds, setSelectedBreeds, breed.id)}
                  />
                  {breed.name_it}
                </label>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Specializations */}
        <Card>
          <CardHeader><h2 className="font-semibold">Specializzazioni</h2></CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {SPECIALIZATIONS.map((spec) => (
                <label key={spec} className="flex items-center gap-2 text-sm cursor-pointer px-3 py-2 rounded-lg border border-border hover:bg-muted">
                  <input
                    type="checkbox"
                    className="rounded"
                    checked={selectedSpecs.includes(spec)}
                    onChange={() => toggleItem(selectedSpecs, setSelectedSpecs, spec)}
                  />
                  {spec}
                </label>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Health Certs */}
        <Card>
          <CardHeader><h2 className="font-semibold">Certificazioni Sanitarie</h2></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {HEALTH_CERTIFICATIONS.map((cert) => (
                <label key={cert} className="flex items-center gap-2 text-sm cursor-pointer p-2 rounded hover:bg-muted">
                  <input
                    type="checkbox"
                    className="rounded"
                    checked={selectedCerts.includes(cert)}
                    onChange={() => toggleItem(selectedCerts, setSelectedCerts, cert)}
                  />
                  {cert}
                </label>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button variant="outline" type="button" onClick={() => window.history.back()}>Annulla</Button>
          <Button type="submit" isLoading={loading}>
            {existingProfileId ? "Aggiorna Profilo" : "Salva Profilo"}
          </Button>
        </div>
      </form>
    </div>
  );
}
