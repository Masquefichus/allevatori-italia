"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Card, { CardContent, CardHeader } from "@/components/ui/Card";
import { regioni } from "@/data/regioni";
import { SPECIALIZATIONS, HEALTH_CERTIFICATIONS } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";
import { slugify } from "@/lib/utils";
import { razze } from "@/data/razze";
import { getClubsForFciId, type BreedClub } from "@/lib/breed-clubs";

export default function ProfiloPage() {
  const { user, loading: authLoading } = useAuth();
  const [profileId, setProfileId] = useState<string | null>(null);

  // Form fields
  const [kennelName, setKennelName] = useState("");
  const [enciNumber, setEnciNumber] = useState("");
  const [yearEstablished, setYearEstablished] = useState("");
  const [description, setDescription] = useState("");
  const [region, setRegion] = useState("");
  const [province, setProvince] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [emailPublic, setEmailPublic] = useState("");
  const [website, setWebsite] = useState("");
  const [facebookUrl, setFacebookUrl] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [selectedBreeds, setSelectedBreeds] = useState<string[]>([]); // breed slugs
  const [breedSlugToId, setBreedSlugToId] = useState<Record<string, string>>({}); // slug → UUID
  const [allBreeds, setAllBreeds] = useState<{ id: string; slug: string; name_it: string }[]>([]);
  const [breedQuery, setBreedQuery] = useState("");
  const [selectedSpecs, setSelectedSpecs] = useState<string[]>([]);
  const [selectedCerts, setSelectedCerts] = useState<string[]>([]);
  const [affisso, setAffisso] = useState("");
  const [selectedClubs, setSelectedClubs] = useState<string[]>([]);

  // UI state
  const [fetching, setFetching] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const provinces = region
    ? regioni.find((r) => r.nome === region)?.province ?? []
    : [];

  // Load existing profile on mount
  useEffect(() => {
    if (authLoading || !user) return;

    const supabase = createClient();
    if (!supabase) {
      setFetching(false);
      return;
    }

    // Load breed slug→UUID map and existing profile in parallel
    Promise.all([
      supabase.from("breeds").select("id, slug, name_it").order("name_it"),
      supabase.from("breeder_profiles").select("*").eq("user_id", user.id).maybeSingle(),
    ]).then(([breedsRes, profileRes]) => {
      // Build slug→UUID map
      const slugMap: Record<string, string> = {};
      const idToSlug: Record<string, string> = {};
      (breedsRes.data || []).forEach((b: { id: string; slug: string; name_it: string }) => {
        slugMap[b.slug] = b.id;
        idToSlug[b.id] = b.slug;
      });
      setBreedSlugToId(slugMap);
      setAllBreeds(breedsRes.data || []);

      const data = profileRes.data;
      if (data) {
        setProfileId(data.id);
        setKennelName(data.kennel_name || "");
        setEnciNumber(data.enci_number || "");
        setYearEstablished(data.year_established?.toString() || "");
        setDescription(data.description || "");
        setRegion(data.region || "");
        setProvince(data.province || "");
        setCity(data.city || "");
        setAddress(data.address || "");
        setPhone(data.phone || "");
        setWhatsapp(data.whatsapp || "");
        setEmailPublic(data.email_public || "");
        setWebsite(data.website || "");
        setFacebookUrl(data.facebook_url || "");
        setInstagramUrl(data.instagram_url || "");
        // Convert stored UUIDs back to slugs for checkbox state
        setLogoUrl(data.logo_url || "");
        setSelectedBreeds((data.breed_ids || []).map((id: string) => idToSlug[id]).filter(Boolean));
        setSelectedSpecs(data.specializations || []);
        setSelectedCerts(data.certifications || []);
        setAffisso(data.affisso || "");
        setSelectedClubs(data.breed_club_memberships || []);
      }
      setFetching(false);
    });
  }, [user, authLoading]);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!kennelName.trim()) errs.kennelName = "Il nome dell'allevamento è obbligatorio";
    if (!region) errs.region = "La regione è obbligatoria";
    if (!description.trim()) errs.description = "La descrizione è obbligatoria";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || !user) return;

    setSaving(true);
    setSuccess(false);
    setErrors({});

    const supabase = createClient();
    if (!supabase) {
      setErrors({ submit: "Supabase non configurato." });
      setSaving(false);
      return;
    }

    const payload = {
      logo_url: logoUrl || null,
      kennel_name: kennelName.trim(),
      enci_number: enciNumber.trim() || null,
      year_established: yearEstablished ? parseInt(yearEstablished) : null,
      description: description.trim(),
      region,
      province: province || "",
      city: city.trim() || null,
      address: address.trim() || null,
      phone: phone.trim() || null,
      whatsapp: whatsapp.trim() || null,
      email_public: emailPublic.trim() || null,
      website: website.trim() || null,
      facebook_url: facebookUrl.trim() || null,
      instagram_url: instagramUrl.trim() || null,
      // Convert breed slugs to UUIDs for storage
      breed_ids: selectedBreeds.map((slug) => breedSlugToId[slug]).filter(Boolean),
      specializations: selectedSpecs,
      certifications: selectedCerts,
      affisso: affisso.trim() || null,
      breed_club_memberships: selectedClubs,
    };

    if (profileId) {
      const { error } = await supabase
        .from("breeder_profiles")
        .update(payload)
        .eq("id", profileId)
        .eq("user_id", user.id);

      if (error) {
        setErrors({ submit: error.message });
      } else {
        setSuccess(true);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } else {
      const slug = slugify(kennelName);
      const { data, error } = await supabase
        .from("breeder_profiles")
        .insert({ ...payload, user_id: user.id, slug, is_approved: false, is_premium: false })
        .select()
        .single();

      if (error) {
        setErrors({ submit: error.message });
      } else {
        setProfileId(data.id);
        await supabase.from("profiles").update({ role: "breeder" }).eq("id", user.id);
        setSuccess(true);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }

    setSaving(false);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) {
      setErrors({ submit: "Formato non supportato. Usa JPG, PNG o WebP." });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrors({ submit: "Immagine troppo grande. Massimo 5MB." });
      return;
    }

    setUploadingLogo(true);
    const supabase = createClient();
    if (!supabase) { setUploadingLogo(false); return; }

    const ext = file.name.split(".").pop();
    const path = `logos/${user.id}/${Date.now()}.${ext}`;
    const { data, error } = await supabase.storage
      .from("images")
      .upload(path, file, { upsert: true });

    if (error) {
      setErrors({ submit: `Errore upload: ${error.message}` });
    } else {
      const { data: { publicUrl } } = supabase.storage.from("images").getPublicUrl(data.path);
      setLogoUrl(publicUrl);
    }
    setUploadingLogo(false);
  };

  const toggleItem = (
    list: string[],
    setList: (v: string[]) => void,
    item: string
  ) => {
    setList(list.includes(item) ? list.filter((i) => i !== item) : [...list, item]);
  };

  if (authLoading || fetching) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        Caricamento profilo...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Profilo Allevamento</h1>
        <p className="text-muted-foreground">
          Gestisci le informazioni del tuo allevamento
        </p>
      </div>

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 text-sm p-4 rounded-lg">
          ✓ Profilo salvato con successo!
        </div>
      )}

      {errors.submit && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-4 rounded-lg">
          {errors.submit}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Foto Profilo */}
        <Card>
          <CardHeader>
            <h2 className="font-semibold">Foto Profilo</h2>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 rounded-full bg-muted border-2 border-border overflow-hidden flex items-center justify-center shrink-0">
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo allevamento" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl">🐕</span>
                )}
              </div>
              <div className="space-y-2">
                <label className="cursor-pointer">
                  <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors ${uploadingLogo ? "opacity-50 pointer-events-none" : ""}`}>
                    {uploadingLogo ? "Caricamento..." : "Carica foto"}
                  </span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handleLogoUpload}
                    disabled={uploadingLogo}
                  />
                </label>
                <p className="text-xs text-muted-foreground">JPG, PNG o WebP. Massimo 5MB.</p>
                {logoUrl && (
                  <button
                    type="button"
                    onClick={() => setLogoUrl("")}
                    className="text-xs text-destructive hover:underline"
                  >
                    Rimuovi foto
                  </button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Informazioni Base */}
        <Card>
          <CardHeader>
            <h2 className="font-semibold">Informazioni Base</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="Nome Allevamento *"
              placeholder="Es. Allevamento Del Sole"
              value={kennelName}
              onChange={(e) => setKennelName(e.target.value)}
              error={errors.kennelName}
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="Affisso ENCI/FCI"
                placeholder="Es. Del Castello Incantato"
                value={affisso}
                onChange={(e) => setAffisso(e.target.value)}
              />
              <Input
                label="Numero ENCI"
                placeholder="Es. MI-12345"
                value={enciNumber}
                onChange={(e) => setEnciNumber(e.target.value)}
              />
              <Input
                label="Anno di fondazione"
                type="number"
                placeholder="Es. 2005"
                min={1900}
                max={new Date().getFullYear()}
                value={yearEstablished}
                onChange={(e) => setYearEstablished(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Descrizione *
              </label>
              <textarea
                rows={5}
                placeholder="Descrivi il tuo allevamento, la tua filosofia, la tua esperienza..."
                className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary ${
                  errors.description ? "border-destructive" : "border-border"
                }`}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
              {errors.description && (
                <p className="mt-1 text-sm text-destructive">{errors.description}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Posizione */}
        <Card>
          <CardHeader>
            <h2 className="font-semibold">Posizione</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Regione *"
                placeholder="Seleziona regione"
                options={regioni.map((r) => ({ value: r.nome, label: r.nome }))}
                value={region}
                onChange={(e) => {
                  setRegion(e.target.value);
                  setProvince("");
                }}
                error={errors.region}
              />
              <Select
                label="Provincia"
                placeholder="Seleziona provincia"
                options={provinces.map((p) => ({
                  value: p.nome,
                  label: `${p.nome} (${p.sigla})`,
                }))}
                value={province}
                onChange={(e) => setProvince(e.target.value)}
                disabled={!region}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Città"
                placeholder="Es. Monza"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
              <Input
                label="Indirizzo"
                placeholder="Es. Via Roma 1"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Contatti */}
        <Card>
          <CardHeader>
            <h2 className="font-semibold">Contatti</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Telefono"
                type="tel"
                placeholder="+39 02 1234567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
              <Input
                label="WhatsApp"
                type="tel"
                placeholder="+39 333 1234567"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Email pubblica"
                type="email"
                placeholder="info@allevamento.it"
                value={emailPublic}
                onChange={(e) => setEmailPublic(e.target.value)}
              />
              <Input
                label="Sito Web"
                type="url"
                placeholder="https://www.allevamento.it"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Facebook"
                placeholder="URL pagina Facebook"
                value={facebookUrl}
                onChange={(e) => setFacebookUrl(e.target.value)}
              />
              <Input
                label="Instagram"
                placeholder="URL profilo Instagram"
                value={instagramUrl}
                onChange={(e) => setInstagramUrl(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Razze Allevate */}
        <div className="bg-white rounded-xl border border-border overflow-visible">
          <div className="px-6 pt-5 pb-2">
            <h2 className="font-semibold">Razze Allevate</h2>
          </div>
          <div className="px-6 pb-5 space-y-3">
            {/* Selected chips */}
            {selectedBreeds.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedBreeds.map((slug) => {
                  const breed = allBreeds.find((b) => b.slug === slug);
                  return (
                    <span key={slug} className="inline-flex items-center gap-1 bg-primary/10 text-primary text-sm px-3 py-1 rounded-full">
                      {breed?.name_it ?? slug}
                      <button
                        type="button"
                        onClick={() => setSelectedBreeds((prev) => prev.filter((s) => s !== slug))}
                        className="ml-1 text-primary/60 hover:text-primary"
                      >×</button>
                    </span>
                  );
                })}
              </div>
            )}
            {/* Search input + dropdown */}
            <div className="relative">
              <input
                type="text"
                placeholder="Cerca una razza..."
                value={breedQuery}
                onChange={(e) => setBreedQuery(e.target.value)}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              {breedQuery.trim() && (
                <div className="absolute z-50 mt-1 w-full bg-white border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {allBreeds
                    .filter((b) => b.name_it.toLowerCase().includes(breedQuery.toLowerCase()) && !selectedBreeds.includes(b.slug))
                    .map((breed) => (
                      <button
                        key={breed.slug}
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          setSelectedBreeds((prev) => [...prev, breed.slug]);
                          setBreedQuery("");
                        }}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-muted"
                      >
                        {breed.name_it}
                      </button>
                    ))}
                  {allBreeds.filter((b) => b.name_it.toLowerCase().includes(breedQuery.toLowerCase()) && !selectedBreeds.includes(b.slug)).length === 0 && (
                    <p className="px-3 py-2 text-sm text-muted-foreground">Nessuna razza trovata</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Specializzazioni */}
        <Card>
          <CardHeader>
            <h2 className="font-semibold">Specializzazioni</h2>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {SPECIALIZATIONS.map((spec) => (
                <label
                  key={spec}
                  className="flex items-center gap-2 text-sm cursor-pointer px-3 py-2 rounded-lg border border-border hover:bg-muted"
                >
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

        {/* Certificazioni Sanitarie */}
        <Card>
          <CardHeader>
            <h2 className="font-semibold">Certificazioni Sanitarie</h2>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {HEALTH_CERTIFICATIONS.map((cert) => (
                <label
                  key={cert}
                  className="flex items-center gap-2 text-sm cursor-pointer p-2 rounded hover:bg-muted"
                >
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

        {/* Club di Razza */}
        {selectedBreeds.length > 0 && (() => {
          // Derive relevant clubs from selected breeds
          const relevantClubs = new Map<string, BreedClub>();
          for (const slug of selectedBreeds) {
            const razza = razze.find((r) => r.slug === slug);
            if (!razza) continue;
            for (const club of getClubsForFciId(razza.fci_id)) {
              if (club.enciSlug) relevantClubs.set(club.enciSlug, club);
            }
          }
          const clubList = Array.from(relevantClubs.values());
          if (clubList.length === 0) return null;
          return (
            <Card>
              <CardHeader>
                <h2 className="font-semibold">Club di Razza</h2>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">Seleziona i club di cui fai parte (filtrati in base alle razze selezionate)</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {clubList.map((club) => (
                    <label
                      key={club.enciSlug}
                      className="flex items-center gap-2 text-sm cursor-pointer p-2 rounded hover:bg-muted"
                    >
                      <input
                        type="checkbox"
                        className="rounded"
                        checked={selectedClubs.includes(club.enciSlug!)}
                        onChange={() => toggleItem(selectedClubs, setSelectedClubs, club.enciSlug!)}
                      />
                      {club.shortName}
                    </label>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })()}

        {/* Submit */}
        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            type="button"
            onClick={() => window.location.reload()}
          >
            Annulla
          </Button>
          <Button type="submit" isLoading={saving}>
            Salva Profilo
          </Button>
        </div>
      </form>
    </div>
  );
}
