"use client";

import { Suspense, lazy, useRef, useState } from "react";
import { MapPin, Stethoscope, Award, Camera, Loader2, Pencil, Save, X } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import { useAuth } from "@/components/auth/AuthProvider";
import { createClient } from "@/lib/supabase/client";
import { regioni } from "@/data/regioni";
import type { VetProfileRow } from "@/types/database";

const RichTextEditor = lazy(() => import("@/components/ui/RichTextEditor"));

type TabId = "chi-siamo";

interface Props {
  vet: VetProfileRow;
  ownerUserId: string | null;
}

export default function VetPublicProfileClient({ vet: initialVet, ownerUserId }: Props) {
  const { user } = useAuth();
  const isOwner = !!user && !!ownerUserId && user.id === ownerUserId;

  const [vet, setVet] = useState<VetProfileRow>(initialVet);
  const [tab, setTab] = useState<TabId>("chi-siamo");

  // ── Edit states ──
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [editingHero, setEditingHero] = useState(false);
  const [savingHero, setSavingHero] = useState(false);
  const [heroForm, setHeroForm] = useState({
    name: vet.name,
    clinic_name: vet.clinic_name ?? "",
    region: vet.region ?? "",
    province: vet.province ?? "",
    city: vet.city ?? "",
  });

  const [editingDescription, setEditingDescription] = useState(false);
  const [descriptionDraft, setDescriptionDraft] = useState("");

  const logoInputRef = useRef<HTMLInputElement>(null);

  const visibleTabs: { id: TabId; label: string }[] = [
    { id: "chi-siamo", label: "Chi siamo" },
  ];

  const location = [vet.city, vet.region].filter(Boolean).join(", ");
  const provinceOptions = heroForm.region
    ? regioni.find((r) => r.nome === heroForm.region)?.province ?? []
    : [];

  // ── Edit helpers ────────────────────────────────────────────────────────

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

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from("vet_profiles").update({ logo_url: json.url }).eq("id", vet.id);
      setVet((prev) => ({ ...prev, logo_url: json.url }));
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
    });
    setEditingHero(true);
  }

  async function saveHero() {
    setSavingHero(true);
    try {
      const supabase = createClient();
      if (!supabase) return;
      const payload = {
        name: heroForm.name.trim() || vet.name,
        clinic_name: heroForm.clinic_name.trim() || null,
        region: heroForm.region || null,
        province: heroForm.province || null,
        city: heroForm.city.trim() || null,
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from("vet_profiles").update(payload).eq("id", vet.id);
      setVet((prev) => ({ ...prev, ...payload }));
      setEditingHero(false);
    } finally {
      setSavingHero(false);
    }
  }

  async function saveDescription() {
    const supabase = createClient();
    if (!supabase) return;
    const desc = descriptionDraft === "<p></p>" ? null : (descriptionDraft || null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from("vet_profiles").update({ description: desc }).eq("id", vet.id);
    setVet((prev) => ({ ...prev, description: desc }));
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

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background">
      {/* ── Hero ───────────────────────────────────────────────────────── */}
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
              <div className="space-y-3 max-w-lg">
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
                <div className="grid grid-cols-2 gap-3">
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
                <div className="flex gap-2 pt-1">
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
                {location && (
                  <p className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
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
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Tab bar ────────────────────────────────────────────────────── */}
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

      {/* ── Tab content ────────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {tab === "chi-siamo" && (
          <div className="space-y-8">
            {/* Description — rich text editor for owner */}
            <section>
              {editingDescription ? (
                <Suspense fallback={<div className="h-48 border border-border rounded-lg animate-pulse bg-muted" />}>
                  <RichTextEditor
                    content={descriptionDraft}
                    onChange={setDescriptionDraft}
                    onImageUpload={uploadEditorImage}
                    onSave={saveDescription}
                    onCancel={() => setEditingDescription(false)}
                    placeholder="Racconta la storia del tuo studio, l'approccio, i servizi che offri..."
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

          </div>
        )}
      </div>
    </div>
  );
}

// Renders Tiptap output (HTML produced by RichTextEditor). Same approach as
// ProProfileClient.tsx:1449 for breeders. Not sanitized at the boundary —
// the only writers are the profile owner via the editor.
function RichDescription({ html }: { html: string }) {
  return (
    <div
      className="prose prose-sm max-w-none text-foreground/80 [&_h1]:text-foreground [&_h1]:text-xl [&_h1]:font-bold [&_h1]:mt-4 [&_h1]:mb-2 [&_h2]:text-foreground [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:mt-3 [&_h2]:mb-1.5 [&_p]:my-1.5 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:my-0.5 [&_a]:text-primary [&_a]:underline [&_img]:rounded-xl [&_img]:my-3 [&_strong]:text-foreground"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
