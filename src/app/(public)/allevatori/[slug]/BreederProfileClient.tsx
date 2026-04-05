"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  MapPin, Phone, Mail, Globe, Shield, Star, Calendar,
  CheckCircle, Facebook, Instagram, ExternalLink,
  Dog, MessageCircle, Pencil, X, Save, Loader2, ChevronRight, Heart,
} from "lucide-react";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Rating from "@/components/ui/Rating";
import { SITE_NAME } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { regioni } from "@/data/regioni";

interface Breed { id: string; name_it: string; slug: string; }
interface Listing {
  id: string; title: string | null; breed_id: string | null;
  price_min: number | null; price_max: number | null; price_on_request: boolean;
  available_puppies: number | null; litter_date: string | null;
  gender_available: string | null; pedigree_included: boolean;
  vaccinated: boolean; microchipped: boolean;
  health_tests: string[] | null; images: string[] | null; status: string;
}
interface Review {
  id: string; rating: number; title: string | null; content: string | null;
  created_at: string; author: { full_name: string } | null;
}
interface Breeder {
  id: string; user_id: string | null; kennel_name: string;
  description: string | null; city: string | null; province: string | null;
  region: string | null; address: string | null; phone: string | null;
  email_public: string | null; whatsapp: string | null; website: string | null;
  facebook_url: string | null; instagram_url: string | null;
  enci_number: string | null; enci_verified: boolean; fci_affiliated: boolean;
  year_established: number | null; logo_url: string | null;
  cover_image_url: string | null; gallery_urls: string[] | null;
  is_premium: boolean; average_rating: number; review_count: number;
  certifications: string[] | null; specializations: string[] | null;
  breed_ids: string[] | null;
}

interface Props {
  breeder: Breeder;
  breeds: Breed[];
  allBreeds: Breed[];
  listings: Listing[];
  reviews: Review[];
  breederUserId: string | null;
  ChatModalComponent: React.ReactNode;
  ReviewFormComponent: React.ReactNode;
}

function formatPrice(min: number | null, max: number | null, onRequest: boolean) {
  if (onRequest) return "Prezzo su richiesta";
  if (!min && !max) return null;
  if (min && max && min !== max) return `€${min.toLocaleString("it-IT")} – €${max.toLocaleString("it-IT")}`;
  return `€${(min ?? max)!.toLocaleString("it-IT")}`;
}

// ── Breed search picker for edit mode ────────────────────────────────────────
function BreedPicker({ allBreeds, selectedIds, onChange }: {
  allBreeds: Breed[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = query.trim()
    ? allBreeds.filter((b) => b.name_it.toLowerCase().includes(query.toLowerCase()))
    : allBreeds;

  const selected = allBreeds.filter((b) => selectedIds.includes(b.id));

  function toggle(id: string) {
    onChange(selectedIds.includes(id) ? selectedIds.filter((x) => x !== id) : [...selectedIds, id]);
  }

  return (
    <div className="space-y-3">
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selected.map((b) => (
            <span key={b.id} className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary text-white text-sm">
              {b.name_it}
              <button type="button" onClick={() => toggle(b.id)} className="ml-1 hover:opacity-70">×</button>
            </span>
          ))}
        </div>
      )}
      <div ref={ref} className="relative">
        <input
          type="text"
          placeholder="Cerca una razza..."
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary"
        />
        {open && filtered.length > 0 && (
          <ul className="absolute z-20 mt-1 w-full bg-white border border-border rounded-lg shadow-lg max-h-52 overflow-y-auto">
            {filtered.map((b) => (
              <li key={b.id}>
                <button
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); toggle(b.id); }}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-muted flex items-center justify-between ${selectedIds.includes(b.id) ? "font-medium text-primary" : ""}`}
                >
                  {b.name_it}
                  {selectedIds.includes(b.id) && <CheckCircle className="h-3.5 w-3.5 text-primary" />}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

// ── Input helper ─────────────────────────────────────────────────────────────
function Field({ label, value, onChange, placeholder, type = "text", multiline = false }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; multiline?: boolean;
}) {
  const cls = "w-full border border-border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30";
  return (
    <div>
      <label className="text-sm text-muted-foreground mb-1 block">{label}</label>
      {multiline
        ? <textarea rows={4} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={cls + " resize-none"} />
        : <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={cls} />
      }
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function BreederProfileClient({
  breeder: initialBreeder, breeds: initialBreeds, allBreeds,
  listings, reviews, breederUserId, ChatModalComponent, ReviewFormComponent,
}: Props) {
  const { user } = useAuth();
  const isOwner = !!user && !!breederUserId && user.id === breederUserId;
  const [tab, setTab] = useState<Tab>("panoramica");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [isSaved, setIsSaved] = useState(false);
  const [savingFav, setSavingFav] = useState(false);

  useEffect(() => {
    if (!user || isOwner) return;
    const supabase = createClient();
    if (!supabase) return;
    (supabase as any)
      .from("favorites")
      .select("id")
      .eq("user_id", user.id)
      .eq("breeder_id", initialBreeder.id)
      .maybeSingle()
      .then(({ data }: { data: { id: string } | null }) => {
        setIsSaved(!!data);
      });
  }, [user, isOwner, initialBreeder.id]);

  async function toggleFavorite() {
    if (!user) { window.location.href = `/accedi?redirect=${window.location.pathname}`; return; }
    const supabase = createClient();
    if (!supabase) return;
    setSavingFav(true);
    if (isSaved) {
      await (supabase as any).from("favorites").delete().eq("user_id", user.id).eq("breeder_id", initialBreeder.id);
      setIsSaved(false);
    } else {
      await (supabase as any).from("favorites").insert({ user_id: user.id, breeder_id: initialBreeder.id });
      setIsSaved(true);
    }
    setSavingFav(false);
  }

  const [breeder, setBreeder] = useState(initialBreeder);
  const [breeds, setBreeds] = useState(initialBreeds);

  const [form, setForm] = useState({
    kennel_name: initialBreeder.kennel_name ?? "",
    description: initialBreeder.description ?? "",
    enci_number: initialBreeder.enci_number ?? "",
    year_established: initialBreeder.year_established?.toString() ?? "",
    region: initialBreeder.region ?? "",
    city: initialBreeder.city ?? "",
    province: initialBreeder.province ?? "",
    address: initialBreeder.address ?? "",
    phone: initialBreeder.phone ?? "",
    whatsapp: initialBreeder.whatsapp ?? "",
    email_public: initialBreeder.email_public ?? "",
    website: initialBreeder.website ?? "",
    facebook_url: initialBreeder.facebook_url ?? "",
    instagram_url: initialBreeder.instagram_url ?? "",
  });
  const [selectedBreedIds, setSelectedBreedIds] = useState<string[]>(initialBreeder.breed_ids ?? []);

  function startEditing() {
    setForm({
      kennel_name: breeder.kennel_name ?? "",
      description: breeder.description ?? "",
      enci_number: breeder.enci_number ?? "",
      year_established: breeder.year_established?.toString() ?? "",
      region: breeder.region ?? "",
      city: breeder.city ?? "",
      province: breeder.province ?? "",
      address: breeder.address ?? "",
      phone: breeder.phone ?? "",
      whatsapp: breeder.whatsapp ?? "",
      email_public: breeder.email_public ?? "",
      website: breeder.website ?? "",
      facebook_url: breeder.facebook_url ?? "",
      instagram_url: breeder.instagram_url ?? "",
    });
    setSelectedBreedIds(breeder.breed_ids ?? []);
    setEditing(true);
    setSaveError(null);
    setSaveSuccess(false);
  }

  async function handleSave() {
    setSaving(true);
    setSaveError(null);
    const supabase = createClient();
    if (!supabase) { setSaveError("Supabase non configurato"); setSaving(false); return; }

    const updates = {
      ...form,
      year_established: form.year_established ? parseInt(form.year_established) : null,
      breed_ids: selectedBreedIds,
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from("breeder_profiles")
      .update(updates)
      .eq("id", breeder.id);

    if (error) {
      setSaveError("Errore nel salvataggio. Riprova.");
      setSaving(false);
      return;
    }

    setBreeder((prev) => ({ ...prev, ...updates }));
    setBreeds(allBreeds.filter((b) => selectedBreedIds.includes(b.id)));
    setEditing(false);
    setSaving(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  }

  const activeListings = listings.filter((l) => l.status === "attivo");
  const totalPuppies = activeListings.reduce((s, l) => s + (l.available_puppies ?? 0), 0);
  const prices = activeListings.filter((l) => !l.price_on_request && (l.price_min || l.price_max));
  const globalPriceMin = prices.length ? Math.min(...prices.map((l) => l.price_min ?? l.price_max!)) : null;
  const globalPriceMax = prices.length ? Math.max(...prices.map((l) => l.price_max ?? l.price_min!)) : null;
  const priceLabel = formatPrice(globalPriceMin, globalPriceMax, prices.length === 0 && activeListings.length > 0);
  const gallery: string[] = breeder.gallery_urls ?? [];
  const initials = breeder.kennel_name?.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase() ?? "K";
  const selectedRegionData = regioni.find((r) => r.nome === form.region);
  const provinceOptions = selectedRegionData?.province ?? [];
  const location = [breeder.city, breeder.province, breeder.region].filter(Boolean).join(", ");

  return (
    <div className="min-h-screen bg-muted/30">

      {/* ── LinkedIn-style header ─────────────────────────────────────────── */}
      <div className="bg-white border-b border-border">

        {/* Cover image */}
        <div className="relative h-32 md:h-44 bg-muted overflow-hidden">
          {breeder.cover_image_url ? (
            <Image src={breeder.cover_image_url} alt="" fill className="object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-stone-200 to-stone-100" />
          )}
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Avatar row — overlaps cover */}
          <div className="flex items-end justify-between -mt-10 md:-mt-12 mb-4">
            <div className="w-24 h-24 md:w-28 md:h-28 rounded-full border-4 border-white bg-primary overflow-hidden flex items-center justify-center text-white text-2xl font-bold shrink-0 shadow-sm">
              {breeder.logo_url
                ? <Image src={breeder.logo_url} alt={breeder.kennel_name} width={112} height={112} className="w-full h-full object-cover" />
                : initials}
            </div>

            {/* CTAs */}
            <div className="flex gap-2 pb-1">
              {isOwner ? (
                !editing ? (
                  <Button size="sm" variant="outline" onClick={startEditing}>
                    <Pencil className="h-4 w-4" /> Modifica
                  </Button>
                ) : (
                  <>
                    <Button size="sm" onClick={handleSave} isLoading={saving}><Save className="h-4 w-4" /> Salva</Button>
                    <Button size="sm" variant="outline" onClick={() => setEditing(false)} disabled={saving}><X className="h-4 w-4" /></Button>
                  </>
                )
              ) : (
                <>
                  <button
                    onClick={toggleFavorite}
                    disabled={savingFav}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors ${
                      isSaved
                        ? "border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100"
                        : "border-border bg-white text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    <Heart className={`h-4 w-4 ${isSaved ? "fill-rose-500 text-rose-500" : ""}`} />
                    {isSaved ? "Salvato" : "Salva"}
                  </button>
                  {ChatModalComponent}
                </>
              )}
            </div>
          </div>

          {/* Name + subtitle + location */}
          <div className="pb-5">
            <h1 className="font-serif text-3xl md:text-4xl text-foreground leading-tight">{breeder.kennel_name}</h1>
            {breeds.length > 0 && (
              <p className="text-muted-foreground mt-1">
                Allevatore di{" "}
                {breeds.map((b, i) => (
                  <span key={b.id}>
                    <Link href={`/razze/${b.slug}`} className="underline hover:text-primary">{b.name_it}</Link>
                    {i < breeds.length - 1 && ", "}
                  </span>
                ))}
              </p>
            )}
            {location && (
              <p className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                <MapPin className="h-3.5 w-3.5 shrink-0" />{location}
              </p>
            )}
            {priceLabel && !isOwner && (
              <p className="text-sm font-semibold text-foreground mt-2">{priceLabel}</p>
            )}
          </div>

          {/* Tabs */}
          <div className="flex gap-0 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 overflow-x-auto">
            {([
              { id: "panoramica", label: "Panoramica" },
              { id: "cucciolate", label: "Cucciolate" },
              { id: "aggiornamenti", label: "Aggiornamenti" },
            ] as const).map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`px-1 py-3.5 mr-6 text-sm font-medium border-b-2 whitespace-nowrap transition-colors -mb-px ${
                  tab === t.id
                    ? "border-foreground text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Banners ───────────────────────────────────────────────────────── */}
      {saveError && (
        <div className="bg-red-50 border-b border-red-200 text-red-700 text-sm px-4 py-3 text-center">{saveError}</div>
      )}
      {saveSuccess && (
        <div className="bg-emerald-50 border-b border-emerald-200 text-emerald-700 text-sm px-4 py-3 text-center flex items-center justify-center gap-2">
          <CheckCircle className="h-4 w-4" /> Profilo aggiornato con successo
        </div>
      )}

      {/* ── Body ──────────────────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="space-y-10">

            {/* EDIT FORM */}
            {editing && (
              <div className="space-y-6">

                <div className="bg-white rounded-2xl border border-border p-6 space-y-4">
                  <h3 className="font-semibold">Informazioni base</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <Field label="Nome allevamento *" value={form.kennel_name} onChange={(v) => setForm({ ...form, kennel_name: v })} />
                    </div>
                    <Field label="Numero ENCI" value={form.enci_number} onChange={(v) => setForm({ ...form, enci_number: v })} />
                    <Field label="Anno di fondazione" type="number" value={form.year_established} onChange={(v) => setForm({ ...form, year_established: v })} />
                    <div className="md:col-span-2">
                      <Field label="Descrizione" value={form.description} onChange={(v) => setForm({ ...form, description: v })} multiline />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-border p-6 space-y-4">
                  <h3 className="font-semibold">Posizione</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-muted-foreground mb-1 block">Regione</label>
                      <select value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value, province: "" })}
                        className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30">
                        <option value="">Seleziona regione</option>
                        {regioni.map((r) => <option key={r.slug} value={r.nome}>{r.nome}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground mb-1 block">Provincia</label>
                      <select value={form.province} onChange={(e) => setForm({ ...form, province: e.target.value })}
                        className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
                        disabled={!provinceOptions.length}>
                        <option value="">Seleziona provincia</option>
                        {provinceOptions.map((p) => <option key={p.sigla} value={p.nome}>{p.nome} ({p.sigla})</option>)}
                      </select>
                    </div>
                    <Field label="Città" value={form.city} onChange={(v) => setForm({ ...form, city: v })} />
                    <Field label="Indirizzo" value={form.address} onChange={(v) => setForm({ ...form, address: v })} />
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-border p-6 space-y-4">
                  <h3 className="font-semibold">Contatti</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field label="Telefono" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} placeholder="+39 02 1234567" />
                    <Field label="WhatsApp" value={form.whatsapp} onChange={(v) => setForm({ ...form, whatsapp: v })} placeholder="+39 333 1234567" />
                    <Field label="Email pubblica" value={form.email_public} onChange={(v) => setForm({ ...form, email_public: v })} placeholder="info@allevamento.it" />
                    <Field label="Sito Web" value={form.website} onChange={(v) => setForm({ ...form, website: v })} placeholder="https://..." />
                    <Field label="Facebook" value={form.facebook_url} onChange={(v) => setForm({ ...form, facebook_url: v })} placeholder="URL pagina Facebook" />
                    <Field label="Instagram" value={form.instagram_url} onChange={(v) => setForm({ ...form, instagram_url: v })} placeholder="URL profilo Instagram" />
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-border p-6 space-y-3">
                  <h3 className="font-semibold">Razze allevate</h3>
                  <BreedPicker allBreeds={allBreeds} selectedIds={selectedBreedIds} onChange={setSelectedBreedIds} />
                </div>

                {/* Mobile save */}
                <div className="flex gap-3 md:hidden">
                  <Button className="flex-1" onClick={handleSave} isLoading={saving}>
                    <Save className="h-4 w-4" /> Salva modifiche
                  </Button>
                  <Button variant="outline" onClick={() => setEditing(false)} disabled={saving}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {!editing && tab === "cucciolate" && (
              <section>
                <div className="flex items-center justify-between mb-5">
                  <h2 className="font-serif text-2xl text-foreground">
                    {totalPuppies > 0 ? `${totalPuppies} cuccioli disponibili` : "Cucciolate"}
                  </h2>
                  {totalPuppies > 0 && (
                    <div className="flex items-center gap-1.5 text-sm">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                      <span className="text-emerald-700 font-medium">Disponibile</span>
                    </div>
                  )}
                </div>
                {activeListings.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-border px-6 py-14 text-center text-muted-foreground">
                    <Dog className="h-10 w-10 mx-auto mb-3 text-border" />
                    <p className="font-medium text-foreground mb-1">Nessun cucciolo disponibile al momento</p>
                    <p className="text-sm">Contatta l&apos;allevatore per sapere quando sarà disponibile la prossima cucciolata.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {activeListings.map((listing) => {
                      const breed = breeds.find((b) => b.id === listing.breed_id);
                      const price = formatPrice(listing.price_min, listing.price_max, listing.price_on_request);
                      const img = listing.images?.[0];
                      return (
                        <div key={listing.id} className="bg-white rounded-2xl border border-border overflow-hidden flex flex-col sm:flex-row">
                          <div className="sm:w-48 aspect-video sm:aspect-square shrink-0 bg-muted overflow-hidden">
                            {img
                              ? <Image src={img} alt={listing.title ?? "Cucciolo"} width={192} height={192} className="w-full h-full object-cover" />
                              : <div className="w-full h-full flex items-center justify-center text-4xl">🐶</div>}
                          </div>
                          <div className="p-5 flex flex-col justify-between flex-1">
                            <div>
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <h3 className="font-semibold text-foreground">{listing.title ?? breed?.name_it ?? "Cucciolo"}</h3>
                                {price && <span className="text-base font-bold text-primary whitespace-nowrap">{price}</span>}
                              </div>
                              <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-muted-foreground mb-3">
                                {listing.available_puppies != null && <span>{listing.available_puppies} disponibili</span>}
                                {listing.gender_available && <span>· {listing.gender_available}</span>}
                                {listing.litter_date && <span>· Nati il {new Date(listing.litter_date).toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" })}</span>}
                              </div>
                              <div className="flex flex-wrap gap-1.5">
                                {listing.pedigree_included && <Badge variant="outline">Pedigree</Badge>}
                                {listing.vaccinated && <Badge variant="outline">Vaccinato</Badge>}
                                {listing.microchipped && <Badge variant="outline">Microchip</Badge>}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            )}

            {!editing && tab === "aggiornamenti" && (
              <div className="bg-white rounded-2xl border border-border px-6 py-14 text-center text-muted-foreground">
                <p className="font-medium text-foreground mb-1">Nessun aggiornamento ancora</p>
                <p className="text-sm">L&apos;allevatore non ha ancora pubblicato aggiornamenti.</p>
              </div>
            )}

            {!editing && tab === "panoramica" && (
              <>
                {/* About */}
                {breeder.description && (
                  <section>
                    <h2 className="font-serif text-2xl text-foreground mb-4">Informazioni sull&apos;allevamento</h2>
                    <p className="text-muted-foreground leading-relaxed">{breeder.description}</p>
                  </section>
                )}

                {/* Availability callout */}
                {totalPuppies > 0 && (
                  <button onClick={() => setTab("cucciolate")} className="w-full bg-emerald-50 border border-emerald-200 rounded-2xl px-5 py-4 flex items-center justify-between text-left hover:bg-emerald-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                      <span className="font-medium text-emerald-800">{totalPuppies} cuccioli disponibili ora</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-emerald-600 shrink-0" />
                  </button>
                )}

                {/* Price range */}
                {priceLabel && (
                  <section className="bg-white rounded-2xl border border-border p-6">
                    <h2 className="font-serif text-xl text-foreground mb-4">Prezzi</h2>
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-3xl font-bold text-foreground">{priceLabel}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">Prezzo indicativo per cucciolo. Il prezzo definitivo dipende dalla cucciolata.</p>
                  </section>
                )}

                {/* What's included */}
                <section>
                  <h2 className="font-serif text-2xl text-foreground mb-4">Cosa è incluso</h2>
                  <div className="bg-white rounded-2xl border border-border p-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {[
                        "Pedigree ufficiale ENCI",
                        "Vaccinazioni di base",
                        "Sverminazione",
                        "Prima visita veterinaria",
                        "Microchip",
                        "Passaporto europeo",
                        "Contratto di vendita",
                        "Supporto post-adozione",
                      ].map((item) => (
                        <div key={item} className="flex items-center gap-2.5 text-sm text-foreground">
                          <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />{item}
                        </div>
                      ))}
                    </div>
                  </div>
                </section>

                {/* Training & socialization */}
                <section>
                  <h2 className="font-serif text-2xl text-foreground mb-4">Socializzazione e addestramento</h2>
                  <div className="bg-white rounded-2xl border border-border p-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {[
                        "Esposizione a suoni e ambienti diversi",
                        "Abituazione ai viaggi in auto",
                        "Stimolazione tattile e sensoriale",
                        "Socializzazione con bambini",
                        "Socializzazione con altri cani",
                        "Incontri con persone diverse",
                        "Gestione quotidiana (orecchie, zampe, denti)",
                        "Tecniche di rinforzo positivo",
                      ].map((item) => (
                        <div key={item} className="flex items-center gap-2.5 text-sm text-foreground">
                          <CheckCircle className="h-4 w-4 text-primary shrink-0" />{item}
                        </div>
                      ))}
                    </div>
                  </div>
                </section>

                {/* Health & certifications */}
                <section>
                  <h2 className="font-serif text-2xl text-foreground mb-4">Salute e certificazioni</h2>
                  <div className="bg-white rounded-2xl border border-border divide-y divide-border">
                    {[
                      { label: "Certificazione ENCI", verified: breeder.enci_verified, detail: breeder.enci_verified ? `Verificata — N. ${breeder.enci_number ?? "N/D"}` : "Non verificata" },
                      { label: "Affiliazione FCI", verified: breeder.fci_affiliated, detail: breeder.fci_affiliated ? "Affiliato" : "Non affiliato" },
                    ].map(({ label, verified, detail }) => (
                      <div key={label} className="flex items-center gap-4 px-6 py-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${verified ? "bg-emerald-50" : "bg-muted"}`}>
                          <Shield className={`h-5 w-5 ${verified ? "text-emerald-600" : "text-muted-foreground"}`} />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-sm text-foreground">{label}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">{detail}</div>
                        </div>
                        {verified && <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />}
                      </div>
                    ))}
                    {(breeder.certifications ?? []).map((cert) => (
                      <div key={cert} className="flex items-center gap-4 px-6 py-4">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                          <CheckCircle className="h-5 w-5 text-emerald-600" />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-sm text-foreground">{cert}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Gallery */}
                {gallery.length > 0 && (
                  <section>
                    <h2 className="font-serif text-2xl text-foreground mb-4">Galleria</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {gallery.map((url, i) => (
                        <div key={i} className="aspect-square rounded-2xl overflow-hidden bg-muted">
                          <Image src={url} alt={`${breeder.kennel_name} ${i + 1}`} width={300} height={300} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Reviews */}
                <section>
                  <div className="flex items-center justify-between mb-5">
                    <h2 className="font-serif text-2xl text-foreground">
                      Recensioni {breeder.review_count > 0 && <span className="text-muted-foreground text-xl">({breeder.review_count})</span>}
                    </h2>
                    {ReviewFormComponent}
                  </div>

                  {reviews.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-border px-6 py-12 text-center text-muted-foreground">
                      <Star className="h-8 w-8 mx-auto mb-3 text-border" />
                      <p className="font-medium text-foreground mb-1">Nessuna recensione ancora</p>
                      <p className="text-sm">Hai adottato da questo allevatore? Lascia la tua esperienza.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {reviews.map((review) => {
                        const name = review.author?.full_name ?? "Utente";
                        const date = new Date(review.created_at).toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" });
                        return (
                          <div key={review.id} className="bg-white rounded-2xl border border-border p-6">
                            <div className="flex items-start justify-between gap-4 mb-3">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary shrink-0">
                                  {name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <p className="font-medium text-sm text-foreground">{name}</p>
                                  <p className="text-xs text-muted-foreground">{date}</p>
                                </div>
                              </div>
                              <Rating value={review.rating} size="sm" />
                            </div>
                            {review.title && <p className="font-semibold text-sm text-foreground mb-1">{review.title}</p>}
                            {review.content && <p className="text-sm text-muted-foreground leading-relaxed">{review.content}</p>}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>
              </>
            )}
        </div>
      </div>
    </div>
  );
}
