"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Card, { CardContent, CardHeader } from "@/components/ui/Card";
import { regioni } from "@/data/regioni";
import { Stethoscope } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { slugify } from "@/lib/utils";
import { VET_SPECIALIZATIONS, VET_LANGUAGES } from "@/lib/constants";

export default function VetProfileClient() {
  const { user, loading: authLoading } = useAuth();

  const [profileId, setProfileId] = useState<string | null>(null);

  // Identity
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [uploadingLogo, setUploadingLogo] = useState(false);

  // Location
  const [region, setRegion] = useState("");
  const [province, setProvince] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");

  // Contact
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [emailPublic, setEmailPublic] = useState("");
  const [website, setWebsite] = useState("");
  const [facebookUrl, setFacebookUrl] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");

  // Credentials
  const [alboNumber, setAlboNumber] = useState("");
  const [alboRegion, setAlboRegion] = useState("");
  const [university, setUniversity] = useState("");
  const [graduationYear, setGraduationYear] = useState("");
  const [yearsExperience, setYearsExperience] = useState("");

  // Practice
  const [clinicName, setClinicName] = useState("");
  const [emergencyAvailable, setEmergencyAvailable] = useState(false);
  const [houseVisits, setHouseVisits] = useState(false);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(["italiano"]);
  const [selectedSpecializations, setSelectedSpecializations] = useState<string[]>([]);

  // UI state
  const [fetching, setFetching] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const provinces = region
    ? regioni.find((r) => r.nome === region)?.province ?? []
    : [];

  useEffect(() => {
    if (authLoading || !user) return;

    const supabase = createClient();
    if (!supabase) {
      setFetching(false);
      return;
    }

    supabase
      .from("vet_profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setProfileId(data.id);
          setName(data.name || "");
          setDescription(data.description || "");
          setLogoUrl(data.logo_url || "");
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
          setAlboNumber(data.albo_number || "");
          setAlboRegion(data.albo_region || "");
          setUniversity(data.university || "");
          setGraduationYear(data.graduation_year?.toString() || "");
          setYearsExperience(data.years_experience?.toString() || "");
          setClinicName(data.clinic_name || "");
          setEmergencyAvailable(!!data.emergency_available);
          setHouseVisits(!!data.house_visits);
          setSelectedLanguages(data.languages?.length ? data.languages : ["italiano"]);
          setSelectedSpecializations(data.specializations || []);
        }
        setFetching(false);
      });
  }, [user, authLoading]);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = "Il nome è obbligatorio";
    if (!region) errs.region = "La regione è obbligatoria";
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
      name: name.trim(),
      description: description.trim() || null,
      logo_url: logoUrl || null,
      region,
      province: province || null,
      city: city.trim() || null,
      address: address.trim() || null,
      phone: phone.trim() || null,
      whatsapp: whatsapp.trim() || null,
      email_public: emailPublic.trim() || null,
      website: website.trim() || null,
      facebook_url: facebookUrl.trim() || null,
      instagram_url: instagramUrl.trim() || null,
      albo_number: alboNumber.trim() || null,
      albo_region: alboRegion.trim() || null,
      university: university.trim() || null,
      graduation_year: graduationYear ? parseInt(graduationYear) : null,
      years_experience: yearsExperience ? parseInt(yearsExperience) : null,
      clinic_name: clinicName.trim() || null,
      emergency_available: emergencyAvailable,
      house_visits: houseVisits,
      languages: selectedLanguages,
      specializations: selectedSpecializations,
    };

    if (profileId) {
      const { error } = await supabase
        .from("vet_profiles")
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
      const baseSlug = slugify(name);
      const { data: existing } = await supabase
        .from("vet_profiles")
        .select("id")
        .eq("slug", baseSlug)
        .maybeSingle();
      const finalSlug = existing ? `${baseSlug}-${user.id.slice(0, 8)}` : baseSlug;

      const { data, error } = await supabase
        .from("vet_profiles")
        .insert({ ...payload, user_id: user.id, slug: finalSlug })
        .select()
        .single();

      if (error) {
        setErrors({ submit: error.message });
      } else {
        setProfileId(data.id);
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
      <div className="flex items-center gap-3">
        <Stethoscope className="h-7 w-7 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Profilo Veterinario</h1>
          <p className="text-muted-foreground">Gestisci il tuo profilo professionale</p>
        </div>
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
          <CardHeader><h2 className="font-semibold">Foto Profilo</h2></CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 rounded-full bg-muted border-2 border-border overflow-hidden flex items-center justify-center shrink-0">
                {logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <Stethoscope className="h-10 w-10 text-muted-foreground" />
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
                  <button type="button" onClick={() => setLogoUrl("")} className="text-xs text-destructive hover:underline">
                    Rimuovi foto
                  </button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Informazioni Base */}
        <Card>
          <CardHeader><h2 className="font-semibold">Informazioni Base</h2></CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="Nome professionale *"
              placeholder="Es. Dr.ssa Maria Rossi"
              value={name}
              onChange={(e) => setName(e.target.value)}
              error={errors.name}
            />
            <Input
              label="Nome studio / clinica"
              placeholder="Es. Clinica Veterinaria San Marco"
              value={clinicName}
              onChange={(e) => setClinicName(e.target.value)}
            />
            <div>
              <label className="block text-sm font-medium mb-1">Presentazione</label>
              <textarea
                rows={4}
                placeholder="Descrivi la tua attività, approccio e specializzazioni..."
                className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Credenziali */}
        <Card>
          <CardHeader><h2 className="font-semibold">Credenziali</h2></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Numero di iscrizione all'Albo"
                placeholder="Es. 1234"
                value={alboNumber}
                onChange={(e) => setAlboNumber(e.target.value)}
              />
              <Input
                label="Ordine provinciale / regionale"
                placeholder="Es. Milano"
                value={alboRegion}
                onChange={(e) => setAlboRegion(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="Università"
                placeholder="Es. Università di Bologna"
                value={university}
                onChange={(e) => setUniversity(e.target.value)}
              />
              <Input
                label="Anno di laurea"
                type="number"
                min={1950}
                max={new Date().getFullYear()}
                placeholder="Es. 2010"
                value={graduationYear}
                onChange={(e) => setGraduationYear(e.target.value)}
              />
              <Input
                label="Anni di esperienza"
                type="number"
                min={0}
                placeholder="Es. 12"
                value={yearsExperience}
                onChange={(e) => setYearsExperience(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Specializzazioni */}
        <Card>
          <CardHeader><h2 className="font-semibold">Specializzazioni</h2></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {VET_SPECIALIZATIONS.map((spec) => (
                <label
                  key={spec}
                  className="flex items-center gap-2 text-sm cursor-pointer p-2 rounded hover:bg-muted"
                >
                  <input
                    type="checkbox"
                    className="rounded"
                    checked={selectedSpecializations.includes(spec)}
                    onChange={() => toggleItem(selectedSpecializations, setSelectedSpecializations, spec)}
                  />
                  {spec}
                </label>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Servizi */}
        <Card>
          <CardHeader><h2 className="font-semibold">Servizi</h2></CardHeader>
          <CardContent className="space-y-3">
            <label className="flex items-center gap-3 text-sm cursor-pointer">
              <input
                type="checkbox"
                className="rounded"
                checked={emergencyAvailable}
                onChange={(e) => setEmergencyAvailable(e.target.checked)}
              />
              <span>
                <span className="font-medium">Reperibilità d&apos;urgenza</span>
                <span className="block text-xs text-muted-foreground">Disponibile per emergenze fuori orario</span>
              </span>
            </label>
            <label className="flex items-center gap-3 text-sm cursor-pointer">
              <input
                type="checkbox"
                className="rounded"
                checked={houseVisits}
                onChange={(e) => setHouseVisits(e.target.checked)}
              />
              <span>
                <span className="font-medium">Visite a domicilio</span>
                <span className="block text-xs text-muted-foreground">Effettuo consultazioni presso il proprietario</span>
              </span>
            </label>
            <div className="pt-3 border-t border-border">
              <p className="text-sm font-medium mb-2">Lingue parlate</p>
              <div className="flex flex-wrap gap-2">
                {VET_LANGUAGES.map((lang) => (
                  <label
                    key={lang}
                    className={`text-sm cursor-pointer px-3 py-1.5 rounded-full border transition-colors ${
                      selectedLanguages.includes(lang)
                        ? "bg-primary text-white border-primary"
                        : "bg-white text-foreground border-border hover:bg-muted"
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="hidden"
                      checked={selectedLanguages.includes(lang)}
                      onChange={() => toggleItem(selectedLanguages, setSelectedLanguages, lang)}
                    />
                    {lang}
                  </label>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Posizione */}
        <Card>
          <CardHeader><h2 className="font-semibold">Posizione</h2></CardHeader>
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
                options={provinces.map((p) => ({ value: p.nome, label: `${p.nome} (${p.sigla})` }))}
                value={province}
                onChange={(e) => setProvince(e.target.value)}
                disabled={!region}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Città" placeholder="Es. Milano" value={city} onChange={(e) => setCity(e.target.value)} />
              <Input label="Indirizzo" placeholder="Es. Via Roma 1" value={address} onChange={(e) => setAddress(e.target.value)} />
            </div>
          </CardContent>
        </Card>

        {/* Contatti */}
        <Card>
          <CardHeader><h2 className="font-semibold">Contatti</h2></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Telefono" type="tel" placeholder="+39 02 1234567" value={phone} onChange={(e) => setPhone(e.target.value)} />
              <Input label="WhatsApp" type="tel" placeholder="+39 333 1234567" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Email pubblica" type="email" placeholder="info@studio.it" value={emailPublic} onChange={(e) => setEmailPublic(e.target.value)} />
              <Input label="Sito web" type="url" placeholder="https://www.studio.it" value={website} onChange={(e) => setWebsite(e.target.value)} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Facebook" placeholder="URL pagina Facebook" value={facebookUrl} onChange={(e) => setFacebookUrl(e.target.value)} />
              <Input label="Instagram" placeholder="URL profilo Instagram" value={instagramUrl} onChange={(e) => setInstagramUrl(e.target.value)} />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button variant="outline" type="button" onClick={() => window.location.reload()}>
            Annulla
          </Button>
          <Button type="submit" isLoading={saving}>Salva Profilo</Button>
        </div>
      </form>
    </div>
  );
}
