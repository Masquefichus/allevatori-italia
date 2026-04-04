"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  MapPin, Phone, Mail, Globe, Shield, Star, Calendar,
  CheckCircle, Facebook, Instagram, ExternalLink,
  Dog, MessageCircle, Pencil, X, Save, Loader2, ChevronRight,
} from "lucide-react";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Rating from "@/components/ui/Rating";
import { SITE_NAME } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";
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
  isOwner: boolean;
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
  listings, reviews, isOwner, ChatModalComponent, ReviewFormComponent,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

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
    <div className="min-h-screen bg-background">

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-start gap-5">

            {/* Avatar */}
            <div className="w-20 h-20 rounded-full border-2 border-border shrink-0 overflow-hidden bg-primary flex items-center justify-center text-white text-xl font-semibold">
              {breeder.logo_url
                ? <Image src={breeder.logo_url} alt={breeder.kennel_name} width={80} height={80} className="w-full h-full object-cover" />
                : initials}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="font-serif text-2xl md:text-3xl text-foreground leading-tight">{breeder.kennel_name}</h1>
                {breeder.is_premium && (
                  <span className="inline-flex items-center gap-1 text-xs font-medium bg-secondary/10 text-secondary px-2.5 py-1 rounded-full">
                    <Star className="h-3 w-3 fill-secondary" /> Top Allevatore
                  </span>
                )}
                {breeder.enci_verified && (
                  <span className="inline-flex items-center gap-1 text-xs font-medium bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full">
                    <Shield className="h-3 w-3" /> ENCI Verificato
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground mb-2">
                {location && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{location}</span>}
                {breeder.year_established && <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />Dal {breeder.year_established}</span>}
                {breeds.length > 0 && (
                  <span className="flex items-center gap-1">
                    <Dog className="h-3.5 w-3.5" />
                    {breeds.map((b) => b.name_it).join(", ")}
                  </span>
                )}
              </div>

              {breeder.average_rating > 0 && (
                <div className="flex items-center gap-2">
                  <Rating value={breeder.average_rating} size="sm" />
                  <span className="text-sm font-medium text-foreground">{breeder.average_rating.toFixed(1)}</span>
                  <span className="text-sm text-muted-foreground">({breeder.review_count} recensioni)</span>
                </div>
              )}
            </div>

            {/* Owner edit button */}
            {isOwner && !editing && (
              <Button size="md" variant="outline" onClick={startEditing} className="shrink-0 hidden md:flex">
                <Pencil className="h-4 w-4" /> Modifica
              </Button>
            )}
            {isOwner && editing && (
              <div className="hidden md:flex gap-2 shrink-0">
                <Button size="md" onClick={handleSave} isLoading={saving}>
                  <Save className="h-4 w-4" /> Salva
                </Button>
                <Button size="md" variant="outline" onClick={() => setEditing(false)} disabled={saving}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Stats strip */}
          <div className="flex gap-6 mt-6 pt-5 border-t border-border text-sm">
            <div>
              <span className="font-bold text-foreground text-lg">{totalPuppies}</span>
              <span className="text-muted-foreground ml-1">cuccioli disponibili</span>
            </div>
            <div>
              <span className="font-bold text-foreground text-lg">{listings.length}</span>
              <span className="text-muted-foreground ml-1">cucciolate</span>
            </div>
            {breeder.review_count > 0 && (
              <div>
                <span className="font-bold text-foreground text-lg">{breeder.review_count}</span>
                <span className="text-muted-foreground ml-1">recensioni</span>
              </div>
            )}
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

          {/* ── Main column ──────────────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-10">

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

            {!editing && (
              <>
                {/* About */}
                {breeder.description && (
                  <section>
                    <h2 className="font-serif text-2xl text-foreground mb-4">Informazioni sull&apos;allevamento</h2>
                    <p className="text-muted-foreground leading-relaxed">{breeder.description}</p>
                  </section>
                )}

                {/* Active listings */}
                {activeListings.length > 0 && (
                  <section>
                    <div className="flex items-center justify-between mb-5">
                      <h2 className="font-serif text-2xl text-foreground">
                        {totalPuppies > 0 ? `${totalPuppies} cuccioli disponibili` : "Cucciolate"}
                      </h2>
                      <div className="flex items-center gap-1.5 text-sm">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                        <span className="text-emerald-700 font-medium">Disponibile</span>
                      </div>
                    </div>
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
                  </section>
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

          {/* ── Sidebar ──────────────────────────────────────────────────── */}
          <div className="lg:col-span-1">
            <div className="sticky top-6 space-y-4">

              {/* Main action card */}
              <div className="bg-white rounded-2xl border border-border p-6 shadow-sm space-y-5">

                {isOwner ? (
                  !editing ? (
                    <Button className="w-full" variant="outline" onClick={startEditing}>
                      <Pencil className="h-4 w-4" /> Modifica profilo
                    </Button>
                  ) : (
                    <div className="space-y-2">
                      <Button className="w-full" onClick={handleSave} isLoading={saving}>
                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Salva modifiche
                      </Button>
                      <Button className="w-full" variant="outline" onClick={() => setEditing(false)} disabled={saving}>
                        <X className="h-4 w-4" /> Annulla
                      </Button>
                    </div>
                  )
                ) : (
                  <>
                    {priceLabel && (
                      <div>
                        <div className="text-2xl font-bold text-foreground">{priceLabel}</div>
                        <p className="text-xs text-muted-foreground mt-0.5">Prezzo indicativo per cucciolo</p>
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-sm">
                      <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${totalPuppies > 0 ? "bg-emerald-500" : "bg-border"}`} />
                      <span className={`font-medium ${totalPuppies > 0 ? "text-emerald-700" : "text-muted-foreground"}`}>
                        {totalPuppies > 0 ? `${totalPuppies} cuccioli disponibili` : "Nessun cucciolo disponibile"}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <div className="w-full">{ChatModalComponent}</div>
                    </div>

                    <div className="border-t border-border pt-4 flex items-start gap-2.5">
                      <Shield className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Pagamenti protetti da {SITE_NAME}. Acquista con fiducia.
                      </p>
                    </div>
                  </>
                )}
              </div>

              {/* Contact card */}
              {!editing && (breeder.phone || breeder.whatsapp || breeder.email_public || breeder.website || breeder.facebook_url || breeder.instagram_url) && (
                <div className="bg-white rounded-2xl border border-border p-5 space-y-3">
                  <h3 className="text-sm font-semibold text-foreground">Contatti</h3>
                  {breeder.phone && (
                    <a href={`tel:${breeder.phone}`} className="flex items-center gap-3 text-sm text-foreground hover:text-primary transition-colors">
                      <Phone className="h-4 w-4 text-muted-foreground shrink-0" />{breeder.phone}
                    </a>
                  )}
                  {breeder.whatsapp && (
                    <a href={`https://wa.me/${breeder.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm text-foreground hover:text-primary transition-colors">
                      <MessageCircle className="h-4 w-4 text-muted-foreground shrink-0" />WhatsApp
                    </a>
                  )}
                  {breeder.email_public && (
                    <a href={`mailto:${breeder.email_public}`} className="flex items-center gap-3 text-sm text-foreground hover:text-primary transition-colors">
                      <Mail className="h-4 w-4 text-muted-foreground shrink-0" />{breeder.email_public}
                    </a>
                  )}
                  {breeder.website && (
                    <a href={breeder.website} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between gap-3 text-sm text-foreground hover:text-primary transition-colors">
                      <span className="flex items-center gap-3"><Globe className="h-4 w-4 text-muted-foreground shrink-0" />Sito web</span>
                      <ExternalLink className="h-3 w-3 text-muted-foreground" />
                    </a>
                  )}
                  {breeder.facebook_url && (
                    <a href={breeder.facebook_url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between gap-3 text-sm text-foreground hover:text-primary transition-colors">
                      <span className="flex items-center gap-3"><Facebook className="h-4 w-4 text-muted-foreground shrink-0" />Facebook</span>
                      <ExternalLink className="h-3 w-3 text-muted-foreground" />
                    </a>
                  )}
                  {breeder.instagram_url && (
                    <a href={breeder.instagram_url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between gap-3 text-sm text-foreground hover:text-primary transition-colors">
                      <span className="flex items-center gap-3"><Instagram className="h-4 w-4 text-muted-foreground shrink-0" />Instagram</span>
                      <ExternalLink className="h-3 w-3 text-muted-foreground" />
                    </a>
                  )}
                </div>
              )}

              {/* Details card */}
              <div className="bg-white rounded-2xl border border-border p-5 space-y-3">
                <h3 className="text-sm font-semibold text-foreground">Dettagli</h3>
                <div className="space-y-2.5 text-sm">
                  {breeder.enci_number && (
                    <div className="flex justify-between gap-4">
                      <span className="text-muted-foreground">Numero ENCI</span>
                      <span className="font-medium text-foreground">{breeder.enci_number}</span>
                    </div>
                  )}
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">FCI</span>
                    <span className="font-medium text-foreground">{breeder.fci_affiliated ? "Affiliato" : "—"}</span>
                  </div>
                  {breeder.year_established && (
                    <div className="flex justify-between gap-4">
                      <span className="text-muted-foreground">Attivo dal</span>
                      <span className="font-medium text-foreground">{breeder.year_established}</span>
                    </div>
                  )}
                  {breeder.region && (
                    <div className="flex justify-between gap-4">
                      <span className="text-muted-foreground">Regione</span>
                      <span className="font-medium text-foreground">{breeder.region}</span>
                    </div>
                  )}
                  {breeds.length > 0 && (
                    <div className="flex justify-between gap-4">
                      <span className="text-muted-foreground">Razze</span>
                      <span className="font-medium text-foreground text-right">{breeds.map((b) => b.name_it).join(", ")}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Breed links */}
              {breeds.length > 0 && (
                <div className="bg-white rounded-2xl border border-border p-5">
                  <h3 className="text-sm font-semibold text-foreground mb-3">Razze allevate</h3>
                  <div className="space-y-1">
                    {breeds.map((b) => (
                      <Link key={b.id} href={`/razze/${b.slug}`} className="flex items-center justify-between text-sm text-foreground hover:text-primary py-1.5 transition-colors">
                        <span className="flex items-center gap-2"><Dog className="h-3.5 w-3.5 text-muted-foreground" />{b.name_it}</span>
                        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
