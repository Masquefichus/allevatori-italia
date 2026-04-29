"use client";

import { Suspense, lazy, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  MapPin, Stethoscope, Award, Camera, Loader2, Pencil, Save, X,
  Phone, Mail, Globe, Facebook, Instagram, Clock, AlertCircle,
} from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Card, { CardContent, CardHeader } from "@/components/ui/Card";
import { useAuth } from "@/components/auth/AuthProvider";
import { createClient } from "@/lib/supabase/client";
import { regioni } from "@/data/regioni";
import { VET_SPECIALIZATIONS, VET_LANGUAGES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { VetProfileRow } from "@/types/database";

const RichTextEditor = lazy(() => import("@/components/ui/RichTextEditor"));

type TabId = "chi-siamo";

interface Props {
  vet: VetProfileRow;
  ownerUserId: string | null;
  isApproved: boolean;
}

export default function VetPublicProfileClient({
  vet: initialVet,
  ownerUserId,
  isApproved,
}: Props) {
  const { user } = useAuth();
  const router = useRouter();
  const isOwner = !!user && !!ownerUserId && user.id === ownerUserId;

  const [vet, setVet] = useState<VetProfileRow>(initialVet);
  const [tab, setTab] = useState<TabId>("chi-siamo");

  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [editingHero, setEditingHero] = useState(false);
  const [savingHero, setSavingHero] = useState(false);
  const [editingDescription, setEditingDescription] = useState(false);
  const [descriptionDraft, setDescriptionDraft] = useState("");

  const [heroForm, setHeroForm] = useState({
    name: vet.name,
    clinic_name: vet.clinic_name ?? "",
    region: vet.region ?? "",
    province: vet.province ?? "",
    city: vet.city ?? "",
    address: vet.address ?? "",
    specializations: vet.specializations ?? [],
    languages: vet.languages ?? [],
    emergency_available: vet.emergency_available,
    house_visits: vet.house_visits,
    phone: vet.phone ?? "",
    whatsapp: vet.whatsapp ?? "",
    email_public: vet.email_public ?? "",
    website: vet.website ?? "",
    facebook_url: vet.facebook_url ?? "",
    instagram_url: vet.instagram_url ?? "",
  });

  const logoInputRef = useRef<HTMLInputElement>(null);

  // Bounce non-owners off unapproved profiles client-side. The server can't
  // reliably do this gate (auth is client-only — see CLAUDE.md "Auth Session").
  useEffect(() => {
    if (!isApproved && !isOwner) {
      router.replace("/veterinari");
    }
  }, [isApproved, isOwner, router]);

  if (!isApproved && !isOwner) {
    return (
      <div className="flex items-center justify-center py-24 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  const visibleTabs: { id: TabId; label: string }[] = [
    { id: "chi-siamo", label: "Chi siamo" },
  ];

  const location = [vet.city, vet.region].filter(Boolean).join(", ");
  const provinceOptions = heroForm.region
    ? regioni.find((r) => r.nome === heroForm.region)?.province ?? []
    : [];

  // ── Helpers ───────────────────────────────────────────────────────

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async function patchVet(payload: Record<string, any>) {
    const supabase = createClient();
    if (!supabase) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from("vet_profiles").update(payload).eq("id", vet.id);
    setVet((prev) => ({ ...prev, ...payload }));
  }

  async function uploadLogo(file: File) {
    setUploadingLogo(true);
    try {
      const supabase = createClient();
      if (!supabase) return;
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const fd = new FormData();
      fd.append("file", file);
      fd.append("bucket", "images");
      fd.append("folder", "logos");

      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: fd,
      });
      const json = await res.json();
      if (!json.url) return;

      await patchVet({ logo_url: json.url });
    } finally {
      setUploadingLogo(false);
    }
  }

  function startEditingHero() {
    setHeroForm({
      name: vet.name,
      clinic_name: vet.clinic_name ?? "",
      region: vet.region ?? "",
      province: vet.province ?? "",
      city: vet.city ?? "",
      address: vet.address ?? "",
      specializations: vet.specializations ?? [],
      languages: vet.languages ?? [],
      emergency_available: vet.emergency_available,
      house_visits: vet.house_visits,
      phone: vet.phone ?? "",
      whatsapp: vet.whatsapp ?? "",
      email_public: vet.email_public ?? "",
      website: vet.website ?? "",
      facebook_url: vet.facebook_url ?? "",
      instagram_url: vet.instagram_url ?? "",
    });
    setEditingHero(true);
  }

  async function saveHero() {
    setSavingHero(true);
    try {
      await patchVet({
        name: heroForm.name.trim() || vet.name,
        clinic_name: heroForm.clinic_name.trim() || null,
        region: heroForm.region || null,
        province: heroForm.province || null,
        city: heroForm.city.trim() || null,
        address: heroForm.address.trim() || null,
        specializations: heroForm.specializations,
        languages: heroForm.languages,
        emergency_available: heroForm.emergency_available,
        house_visits: heroForm.house_visits,
        phone: heroForm.phone.trim() || null,
        whatsapp: heroForm.whatsapp.trim() || null,
        email_public: heroForm.email_public.trim() || null,
        website: heroForm.website.trim() || null,
        facebook_url: heroForm.facebook_url.trim() || null,
        instagram_url: heroForm.instagram_url.trim() || null,
      });
      setEditingHero(false);
    } finally {
      setSavingHero(false);
    }
  }

  async function saveDescription() {
    const desc = descriptionDraft === "<p></p>" ? null : (descriptionDraft || null);
    await patchVet({ description: desc });
    setEditingDescription(false);
  }

  async function uploadEditorImage(file: File): Promise<string | null> {
    const supabase = createClient();
    if (!supabase) return null;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return null;
    const fd = new FormData();
    fd.append("file", file);
    fd.append("bucket", "images");
    fd.append("folder", "content");
    const res = await fetch("/api/upload", {
      method: "POST",
      headers: { Authorization: `Bearer ${session.access_token}` },
      body: fd,
    });
    const json = await res.json();
    return json.url ?? null;
  }

  function toggleSpec(value: string) {
    setHeroForm((p) => ({
      ...p,
      specializations: p.specializations.includes(value)
        ? p.specializations.filter((s) => s !== value)
        : [...p.specializations, value],
    }));
  }

  function toggleLang(value: string) {
    setHeroForm((p) => ({
      ...p,
      languages: p.languages.includes(value)
        ? p.languages.filter((l) => l !== value)
        : [...p.languages, value],
    }));
  }

  // ── Render ────────────────────────────────────────────────────────

  const specializations = vet.specializations ?? [];
  const languages = vet.languages ?? [];
  const hasContact =
    vet.phone || vet.whatsapp || vet.email_public || vet.website ||
    vet.facebook_url || vet.instagram_url || vet.address;

  return (
    <div className="min-h-screen bg-background">
      {/* Pending-approval banner (owner only) */}
      {!isApproved && isOwner && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900">
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold">Profilo in attesa di approvazione</p>
              <p className="text-amber-800/80 mt-0.5">
                Solo tu puoi vederlo. Dopo l&apos;approvazione sarà pubblicato e visibile a tutti.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Hero ───────────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-start gap-4">
          {/* Profile photo */}
          <div className="relative group shrink-0 h-20 w-20">
            <input
              ref={logoInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) uploadLogo(f);
                e.target.value = "";
              }}
            />
            <div className="relative h-20 w-20 rounded-full bg-muted overflow-hidden flex items-center justify-center">
              {vet.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={vet.logo_url} alt={vet.name} className="h-20 w-20 object-cover" />
              ) : (
                <Stethoscope className="h-10 w-10 text-muted-foreground" />
              )}
            </div>
            {isOwner && (
              <button
                type="button"
                onClick={() => logoInputRef.current?.click()}
                disabled={uploadingLogo}
                className="absolute inset-0 rounded-full flex items-center justify-center bg-black/0 group-hover:bg-black/40 transition-colors"
              >
                {uploadingLogo
                  ? <Loader2 className="h-4 w-4 text-white animate-spin" />
                  : <Camera className="h-4 w-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />}
              </button>
            )}
          </div>

          {/* Hero text */}
          <div className="min-w-0 flex-1 pt-1">
            {editingHero ? (
              <div className="space-y-3 max-w-xl">
                <Input
                  label="Nome professionale"
                  value={heroForm.name}
                  onChange={(e) => setHeroForm({ ...heroForm, name: e.target.value })}
                />
                <Input
                  label="Nome studio / clinica"
                  value={heroForm.clinic_name}
                  onChange={(e) => setHeroForm({ ...heroForm, clinic_name: e.target.value })}
                />

                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Specializzazioni</label>
                  <div className="flex flex-wrap gap-2">
                    {VET_SPECIALIZATIONS.map((s) => {
                      const active = heroForm.specializations.includes(s);
                      return (
                        <button
                          key={s}
                          type="button"
                          onClick={() => toggleSpec(s)}
                          className={cn(
                            "px-3 py-1 rounded-full text-xs border transition-colors",
                            active
                              ? "bg-primary text-white border-primary"
                              : "border-border text-muted-foreground hover:border-primary"
                          )}
                        >
                          {s}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Lingue parlate</label>
                  <div className="flex flex-wrap gap-2">
                    {VET_LANGUAGES.map((l) => {
                      const active = heroForm.languages.includes(l);
                      return (
                        <button
                          key={l}
                          type="button"
                          onClick={() => toggleLang(l)}
                          className={cn(
                            "px-3 py-1 rounded-full text-xs border transition-colors capitalize",
                            active
                              ? "bg-primary text-white border-primary"
                              : "border-border text-muted-foreground hover:border-primary"
                          )}
                        >
                          {l}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-2 pt-1">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      className="rounded"
                      checked={heroForm.emergency_available}
                      onChange={(e) => setHeroForm({ ...heroForm, emergency_available: e.target.checked })}
                    />
                    Disponibile per emergenze
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      className="rounded"
                      checked={heroForm.house_visits}
                      onChange={(e) => setHeroForm({ ...heroForm, house_visits: e.target.checked })}
                    />
                    Effettuo visite a domicilio
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border">
                  <Select
                    label="Regione"
                    placeholder="Seleziona regione"
                    options={regioni.map((r) => ({ value: r.nome, label: r.nome }))}
                    value={heroForm.region}
                    onChange={(e) => setHeroForm({ ...heroForm, region: e.target.value, province: "" })}
                  />
                  <Select
                    label="Provincia"
                    placeholder="Seleziona provincia"
                    options={provinceOptions.map((p) => ({ value: p.nome, label: `${p.nome} (${p.sigla})` }))}
                    value={heroForm.province}
                    onChange={(e) => setHeroForm({ ...heroForm, province: e.target.value })}
                    disabled={!provinceOptions.length}
                  />
                </div>
                <Input
                  label="Città"
                  value={heroForm.city}
                  onChange={(e) => setHeroForm({ ...heroForm, city: e.target.value })}
                />
                <Input
                  label="Indirizzo"
                  value={heroForm.address}
                  onChange={(e) => setHeroForm({ ...heroForm, address: e.target.value })}
                  placeholder="Via e numero civico"
                />

                <div className="pt-2 mt-2 border-t border-border space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Contatti</p>
                  <Input
                    label="Telefono"
                    value={heroForm.phone}
                    onChange={(e) => setHeroForm({ ...heroForm, phone: e.target.value })}
                  />
                  <Input
                    label="WhatsApp"
                    value={heroForm.whatsapp}
                    onChange={(e) => setHeroForm({ ...heroForm, whatsapp: e.target.value })}
                  />
                  <Input
                    label="Email pubblica"
                    type="email"
                    value={heroForm.email_public}
                    onChange={(e) => setHeroForm({ ...heroForm, email_public: e.target.value })}
                  />
                  <Input
                    label="Sito web"
                    value={heroForm.website}
                    onChange={(e) => setHeroForm({ ...heroForm, website: e.target.value })}
                    placeholder="https://"
                  />
                  <Input
                    label="Facebook"
                    value={heroForm.facebook_url}
                    onChange={(e) => setHeroForm({ ...heroForm, facebook_url: e.target.value })}
                    placeholder="https://facebook.com/..."
                  />
                  <Input
                    label="Instagram"
                    value={heroForm.instagram_url}
                    onChange={(e) => setHeroForm({ ...heroForm, instagram_url: e.target.value })}
                    placeholder="https://instagram.com/..."
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <Button size="sm" onClick={saveHero} isLoading={savingHero}>
                    <Save className="h-3.5 w-3.5" /> Salva
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setEditingHero(false)} disabled={savingHero}>
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between gap-3">
                  <h1 className="text-2xl font-bold">{vet.name}</h1>
                  {isOwner && (
                    <button
                      onClick={startEditingHero}
                      className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 mt-1"
                    >
                      <Pencil className="h-3 w-3" /> Modifica
                    </button>
                  )}
                </div>
                {vet.clinic_name && (
                  <p className="text-sm text-muted-foreground mt-0.5">{vet.clinic_name}</p>
                )}
                {specializations.length > 0 && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Specializzato in {specializations.join(", ")}
                  </p>
                )}
                {languages.length > 0 && (
                  <p className="text-sm text-muted-foreground mt-1 capitalize">
                    Lingue: {languages.join(", ")}
                  </p>
                )}
                {location && (
                  <p className="flex items-center gap-1 mt-1.5 text-sm text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" />
                    {location}
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <span className="inline-flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                    <Stethoscope className="h-3 w-3" /> Veterinario
                  </span>
                  {vet.albo_verified && (
                    <span className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
                      <Award className="h-3 w-3" /> Albo verificato
                    </span>
                  )}
                  {vet.emergency_available && (
                    <span className="inline-flex items-center gap-1 text-xs text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full">
                      <Clock className="h-3 w-3" /> Emergenze
                    </span>
                  )}
                  {vet.house_visits && (
                    <span className="inline-flex items-center gap-1 text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
                      <MapPin className="h-3 w-3" /> Visite a domicilio
                    </span>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Tab bar ────────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex border-b border-border mt-4">
          {visibleTabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-1 py-3 mr-5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors -mb-px ${
                tab === t.id
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab content ────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {tab === "chi-siamo" && (
          <>
            {/* Description */}
            <section>
              {editingDescription ? (
                <Suspense fallback={<div className="h-48 border border-border rounded-lg animate-pulse bg-muted" />}>
                  <RichTextEditor
                    content={descriptionDraft}
                    onChange={setDescriptionDraft}
                    onImageUpload={uploadEditorImage}
                    onSave={saveDescription}
                    onCancel={() => setEditingDescription(false)}
                    placeholder="Racconta la tua storia: dove ti sei laureato, da quanti anni eserciti, il tuo approccio, i servizi che offri..."
                  />
                </Suspense>
              ) : vet.description ? (
                <div className="relative">
                  {isOwner && (
                    <button
                      onClick={() => { setDescriptionDraft(vet.description ?? ""); setEditingDescription(true); }}
                      className="absolute top-0 right-0 text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                    >
                      <Pencil className="h-3 w-3" /> Modifica
                    </button>
                  )}
                  <RichDescription html={vet.description} />
                </div>
              ) : isOwner ? (
                <button
                  onClick={() => { setDescriptionDraft(""); setEditingDescription(true); }}
                  className="w-full py-6 text-sm text-muted-foreground hover:text-foreground text-center border border-dashed border-border rounded-xl"
                >
                  <Pencil className="h-4 w-4 inline mr-1" /> Scrivi la presentazione del tuo studio
                </button>
              ) : null}
            </section>

            {/* Contatti card (read-only; edits happen in the hero panel) */}
            {hasContact && (
              <Card>
                <CardHeader><h2 className="font-semibold">Contatti</h2></CardHeader>
                <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                  {vet.phone && (
                    <a href={`tel:${vet.phone}`} className="flex items-center gap-2 hover:text-primary transition-colors">
                      <Phone className="h-4 w-4 text-muted-foreground" />{vet.phone}
                    </a>
                  )}
                  {vet.whatsapp && (
                    <a href={`https://wa.me/${vet.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-primary transition-colors">
                      <Phone className="h-4 w-4 text-muted-foreground" />WhatsApp: {vet.whatsapp}
                    </a>
                  )}
                  {vet.email_public && (
                    <a href={`mailto:${vet.email_public}`} className="flex items-center gap-2 hover:text-primary transition-colors">
                      <Mail className="h-4 w-4 text-muted-foreground" />{vet.email_public}
                    </a>
                  )}
                  {vet.website && (
                    <a href={vet.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-primary transition-colors truncate">
                      <Globe className="h-4 w-4 text-muted-foreground" />{vet.website}
                    </a>
                  )}
                  {vet.facebook_url && (
                    <a href={vet.facebook_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-primary transition-colors">
                      <Facebook className="h-4 w-4 text-muted-foreground" />Facebook
                    </a>
                  )}
                  {vet.instagram_url && (
                    <a href={vet.instagram_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-primary transition-colors">
                      <Instagram className="h-4 w-4 text-muted-foreground" />Instagram
                    </a>
                  )}
                  {vet.address && (
                    <p className="flex items-center gap-2 sm:col-span-2 text-muted-foreground">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      {[vet.address, vet.city, vet.region].filter(Boolean).join(", ")}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// Renders Tiptap output (HTML produced by RichTextEditor). The only writers
// are the profile owner via the editor — the same trust model used elsewhere
// in this codebase (see ProProfileClient.tsx).
function RichDescription({ html }: { html: string }) {
  return (
    <div
      className="prose prose-sm max-w-none text-foreground/80 [&_h1]:text-foreground [&_h1]:text-xl [&_h1]:font-bold [&_h1]:mt-4 [&_h1]:mb-2 [&_h2]:text-foreground [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:mt-3 [&_h2]:mb-1.5 [&_p]:my-1.5 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:my-0.5 [&_a]:text-primary [&_a]:underline [&_img]:rounded-xl [&_img]:my-3 [&_strong]:text-foreground"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
