"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  MapPin, Phone, Mail, Globe, Shield, Star, Calendar,
  CheckCircle, Facebook, Instagram, ExternalLink, Heart,
  Dog, MessageCircle, Pencil, X, Save, Loader2,
} from "lucide-react";
import Button from "@/components/ui/Button";
import Card, { CardContent } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Rating from "@/components/ui/Rating";
import { SITE_NAME } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";
import { regioni } from "@/data/regioni";

type Tab = "panoramica" | "cuccioli" | "salute" | "recensioni";

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

const TABS = [
  { id: "panoramica", label: "Panoramica" },
  { id: "cuccioli", label: "Cuccioli" },
  { id: "salute", label: "Salute" },
  { id: "recensioni", label: "Recensioni" },
] as const;

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

// ── Main component ────────────────────────────────────────────────────────────
export default function BreederProfileClient({
  breeder: initialBreeder, breeds: initialBreeds, allBreeds,
  listings, reviews, isOwner, ChatModalComponent, ReviewFormComponent,
}: Props) {
  const [tab, setTab] = useState<Tab>("panoramica");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [breeder, setBreeder] = useState(initialBreeder);
  const [breeds, setBreeds] = useState(initialBreeds);

  // Edit form state
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

    // Update local state so changes show immediately
    setBreeder((prev) => ({ ...prev, ...updates }));
    setBreeds(allBreeds.filter((b) => selectedBreedIds.includes(b.id)));
    setEditing(false);
    setSaving(false);
  }

  const activeListings = listings.filter((l) => l.status === "attivo");
  const totalPuppies = activeListings.reduce((s, l) => s + (l.available_puppies ?? 0), 0);
  const prices = activeListings.filter((l) => !l.price_on_request && (l.price_min || l.price_max));
  const globalPriceMin = prices.length ? Math.min(...prices.map((l) => l.price_min ?? l.price_max!)) : null;
  const globalPriceMax = prices.length ? Math.max(...prices.map((l) => l.price_max ?? l.price_min!)) : null;
  const priceLabel = formatPrice(globalPriceMin, globalPriceMax, prices.length === 0 && activeListings.length > 0);

  const gallery: string[] = breeder.gallery_urls ?? [];
  const initials = breeder.kennel_name?.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase() ?? "K";

  // Province options for selected region
  const selectedRegionData = regioni.find((r) => r.nome === form.region);
  const provinceOptions = selectedRegionData?.province ?? [];

  return (
    <div className="min-h-screen bg-background">

      {/* ── Cover ─────────────────────────────────────────────────────────── */}
      {breeder.cover_image_url ? (
        <div className="h-52 md:h-72 w-full overflow-hidden">
          <Image src={breeder.cover_image_url} alt={breeder.kennel_name} width={1400} height={288} className="w-full h-full object-cover" />
        </div>
      ) : (
        <div className="h-52 md:h-72 bg-gradient-to-br from-primary/10 to-muted" />
      )}

      {/* ── Profile header ──────────────────────────────────────────────── */}
      <div className="bg-white border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row gap-6 -mt-10 pb-5 items-start">

            <div className="w-20 h-20 rounded-2xl border-4 border-white shadow-md shrink-0 overflow-hidden bg-primary flex items-center justify-center text-white text-xl font-semibold">
              {breeder.logo_url
                ? <Image src={breeder.logo_url} alt={breeder.kennel_name} width={80} height={80} className="w-full h-full object-cover" />
                : initials}
            </div>

            <div className="flex-1 pt-2 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="font-serif text-2xl md:text-3xl text-foreground">{breeder.kennel_name}</h1>
                {breeder.enci_verified && (
                  <Badge variant="primary" className="flex items-center gap-1"><Shield className="h-3 w-3" /> ENCI Verificato</Badge>
                )}
                {breeder.is_premium && (
                  <Badge variant="secondary" className="flex items-center gap-1"><Star className="h-3 w-3" /> Top Allevatore</Badge>
                )}
              </div>
              <div className="flex flex-wrap gap-3 text-sm text-muted-foreground mb-2">
                {(breeder.city || breeder.region) && (
                  <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{[breeder.city, breeder.province].filter(Boolean).join(", ")}</span>
                )}
                {breeder.year_established && (
                  <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />Dal {breeder.year_established}</span>
                )}
              </div>
              {breeder.average_rating > 0 && <Rating value={breeder.average_rating} showValue count={breeder.review_count} />}
            </div>

            <div className="hidden md:flex gap-2 pt-4 shrink-0">
              {isOwner ? (
                editing ? (
                  <>
                    <Button size="md" onClick={handleSave} isLoading={saving}>
                      <Save className="h-4 w-4" /> Salva
                    </Button>
                    <Button size="md" variant="outline" onClick={() => setEditing(false)} disabled={saving}>
                      <X className="h-4 w-4" /> Annulla
                    </Button>
                  </>
                ) : (
                  <Button size="md" variant="outline" onClick={startEditing}>
                    <Pencil className="h-4 w-4" /> Modifica profilo
                  </Button>
                )
              ) : (
                <>
                  {ChatModalComponent}
                  <Button variant="outline" size="md"><Heart className="h-4 w-4" /></Button>
                </>
              )}
            </div>
          </div>

          {/* Stats bar */}
          <div className="flex gap-8 pb-4 text-sm border-t border-border pt-4">
            {[
              { value: totalPuppies, label: "Cuccioli disponibili" },
              { value: listings.length, label: "Cucciolate" },
              { value: breeder.review_count ?? 0, label: "Recensioni verificate" },
              ...(breeds.length > 0 ? [{ value: breeds.length, label: breeds.length === 1 ? "Razza" : "Razze" }] : []),
            ].map((s) => (
              <div key={s.label} className="text-center">
                <div className="font-bold text-lg text-foreground">{s.value}</div>
                <div className="text-muted-foreground">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div className="flex gap-0 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 overflow-x-auto">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`px-5 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                  tab === t.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {t.label}
                {t.id === "cuccioli" && totalPuppies > 0 && (
                  <span className="ml-1.5 bg-primary text-white text-xs rounded-full px-1.5 py-0.5">{totalPuppies}</span>
                )}
                {t.id === "recensioni" && reviews.length > 0 && (
                  <span className="ml-1.5 text-muted-foreground">({reviews.length})</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Save error banner ───────────────────────────────────────────── */}
      {saveError && (
        <div className="bg-red-50 border-b border-red-200 text-red-700 text-sm px-4 py-3 text-center">{saveError}</div>
      )}

      {/* ── Body ────────────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ── Main column ─────────────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-8">

            {/* EDIT MODE panel */}
            {editing && (
              <div className="space-y-6">

                {/* Basic info */}
                <Card>
                  <CardContent className="p-6 space-y-4">
                    <h3 className="font-semibold text-foreground">Informazioni base</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <label className="text-sm text-muted-foreground mb-1 block">Nome allevamento *</label>
                        <input value={form.kennel_name} onChange={(e) => setForm({ ...form, kennel_name: e.target.value })}
                          className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary" />
                      </div>
                      <div>
                        <label className="text-sm text-muted-foreground mb-1 block">Numero ENCI</label>
                        <input value={form.enci_number} onChange={(e) => setForm({ ...form, enci_number: e.target.value })}
                          className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary" />
                      </div>
                      <div>
                        <label className="text-sm text-muted-foreground mb-1 block">Anno di fondazione</label>
                        <input type="number" value={form.year_established} onChange={(e) => setForm({ ...form, year_established: e.target.value })}
                          className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary" />
                      </div>
                      <div className="md:col-span-2">
                        <label className="text-sm text-muted-foreground mb-1 block">Descrizione</label>
                        <textarea rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                          className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary resize-none" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Location */}
                <Card>
                  <CardContent className="p-6 space-y-4">
                    <h3 className="font-semibold text-foreground">Posizione</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm text-muted-foreground mb-1 block">Regione</label>
                        <select value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value, province: "" })}
                          className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary">
                          <option value="">Seleziona regione</option>
                          {regioni.map((r) => <option key={r.slug} value={r.nome}>{r.nome}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-sm text-muted-foreground mb-1 block">Provincia</label>
                        <select value={form.province} onChange={(e) => setForm({ ...form, province: e.target.value })}
                          className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                          disabled={!provinceOptions.length}>
                          <option value="">Seleziona provincia</option>
                          {provinceOptions.map((p) => <option key={p.sigla} value={p.nome}>{p.nome} ({p.sigla})</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-sm text-muted-foreground mb-1 block">Città</label>
                        <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })}
                          className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary" />
                      </div>
                      <div>
                        <label className="text-sm text-muted-foreground mb-1 block">Indirizzo</label>
                        <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })}
                          className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Contacts */}
                <Card>
                  <CardContent className="p-6 space-y-4">
                    <h3 className="font-semibold text-foreground">Contatti</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[
                        { key: "phone", label: "Telefono", placeholder: "+39 02 1234567" },
                        { key: "whatsapp", label: "WhatsApp", placeholder: "+39 333 1234567" },
                        { key: "email_public", label: "Email pubblica", placeholder: "info@allevamento.it" },
                        { key: "website", label: "Sito Web", placeholder: "https://www.allevamento.it" },
                        { key: "facebook_url", label: "Facebook", placeholder: "URL pagina Facebook" },
                        { key: "instagram_url", label: "Instagram", placeholder: "URL profilo Instagram" },
                      ].map(({ key, label, placeholder }) => (
                        <div key={key}>
                          <label className="text-sm text-muted-foreground mb-1 block">{label}</label>
                          <input
                            value={form[key as keyof typeof form]}
                            onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                            placeholder={placeholder}
                            className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Breeds */}
                <Card>
                  <CardContent className="p-6 space-y-3">
                    <h3 className="font-semibold text-foreground">Razze allevate</h3>
                    <BreedPicker
                      allBreeds={allBreeds}
                      selectedIds={selectedBreedIds}
                      onChange={setSelectedBreedIds}
                    />
                  </CardContent>
                </Card>

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

            {/* PANORAMICA */}
            {tab === "panoramica" && !editing && (
              <>
                {breeder.description && (
                  <section>
                    <h2 className="font-serif text-2xl text-foreground mb-4">Chi siamo</h2>
                    <p className="text-muted-foreground leading-relaxed">{breeder.description}</p>
                  </section>
                )}

                {breeds.length > 0 && (
                  <section>
                    <h2 className="font-serif text-2xl text-foreground mb-4">Razze allevate</h2>
                    <div className="flex flex-wrap gap-3">
                      {breeds.map((b) => (
                        <Link key={b.id} href={`/razze/${b.slug}`}>
                          <div className="flex items-center gap-2 px-4 py-2.5 bg-white border border-border rounded-full text-sm font-medium hover:border-primary hover:text-primary transition-colors">
                            <Dog className="h-4 w-4 text-muted-foreground" /> {b.name_it}
                          </div>
                        </Link>
                      ))}
                    </div>
                  </section>
                )}

                <section>
                  <h2 className="font-serif text-2xl text-foreground mb-4">Cosa è incluso</h2>
                  <Card><CardContent className="p-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {["Pedigree ufficiale ENCI","Vaccinazioni di base","Sverminazione","Prima visita veterinaria","Microchip","Passaporto europeo","Contratto di vendita","Supporto post-adozione"].map((item) => (
                        <div key={item} className="flex items-center gap-2.5 text-sm text-foreground">
                          <CheckCircle className="h-4 w-4 text-success shrink-0" />{item}
                        </div>
                      ))}
                    </div>
                  </CardContent></Card>
                </section>

                <section>
                  <h2 className="font-serif text-2xl text-foreground mb-4">Socializzazione</h2>
                  <Card><CardContent className="p-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {["Esposizione a suoni e ambienti diversi","Abituazione ai viaggi in auto","Stimolazione tattile e sensoriale","Socializzazione con bambini","Socializzazione con altri cani","Incontri con persone diverse","Gestione quotidiana (orecchie, zampe, denti)","Tecniche di rinforzo positivo"].map((item) => (
                        <div key={item} className="flex items-center gap-2.5 text-sm text-foreground">
                          <CheckCircle className="h-4 w-4 text-primary shrink-0" />{item}
                        </div>
                      ))}
                    </div>
                  </CardContent></Card>
                </section>

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
              </>
            )}

            {/* CUCCIOLI */}
            {tab === "cuccioli" && !editing && (
              <section>
                <h2 className="font-serif text-2xl text-foreground mb-6">
                  {totalPuppies > 0 ? `${totalPuppies} cuccioli disponibili` : "Cucciolate"}
                </h2>
                {activeListings.length === 0 ? (
                  <Card><CardContent className="py-14 text-center text-muted-foreground">
                    <Dog className="h-10 w-10 mx-auto mb-3 text-border" />
                    <p className="font-medium text-foreground mb-1">Nessun cucciolo disponibile al momento</p>
                    <p className="text-sm">Contatta l&apos;allevatore per sapere quando sarà disponibile la prossima cucciolata.</p>
                  </CardContent></Card>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {activeListings.map((listing) => {
                      const breed = breeds.find((b) => b.id === listing.breed_id);
                      const price = formatPrice(listing.price_min, listing.price_max, listing.price_on_request);
                      const img = listing.images?.[0];
                      return (
                        <Card key={listing.id} hover>
                          {img
                            ? <div className="aspect-video overflow-hidden"><Image src={img} alt={listing.title ?? "Cucciolo"} width={400} height={225} className="w-full h-full object-cover" /></div>
                            : <div className="aspect-video bg-muted flex items-center justify-center text-4xl">🐶</div>}
                          <CardContent className="p-5">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <h3 className="font-semibold text-foreground">{listing.title ?? breed?.name_it ?? "Cucciolo"}</h3>
                              {price && <span className="text-sm font-semibold text-primary whitespace-nowrap">{price}</span>}
                            </div>
                            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                              {listing.available_puppies != null && <span>{listing.available_puppies} disponibili</span>}
                              {listing.gender_available && <span>· {listing.gender_available}</span>}
                              {listing.litter_date && <span>· Nati il {new Date(listing.litter_date).toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" })}</span>}
                            </div>
                            <div className="flex flex-wrap gap-1.5 mt-3">
                              {listing.pedigree_included && <Badge variant="outline">Pedigree</Badge>}
                              {listing.vaccinated && <Badge variant="outline">Vaccinato</Badge>}
                              {listing.microchipped && <Badge variant="outline">Microchip</Badge>}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </section>
            )}

            {/* SALUTE */}
            {tab === "salute" && !editing && (
              <section className="space-y-6">
                <h2 className="font-serif text-2xl text-foreground mb-2">Test sanitari e certificazioni</h2>
                <Card><CardContent className="p-6 space-y-4">
                  {[
                    { label: "Certificazione ENCI", verified: breeder.enci_verified, detail: breeder.enci_verified ? `Verificata — N. ${breeder.enci_number ?? "N/D"}` : "In attesa di verifica" },
                    { label: "Affiliazione FCI", verified: breeder.fci_affiliated, detail: breeder.fci_affiliated ? "Affiliato" : "Non affiliato" },
                  ].map(({ label, verified, detail }) => (
                    <div key={label} className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${verified ? "bg-emerald-50" : "bg-muted"}`}>
                        <Shield className={`h-5 w-5 ${verified ? "text-success" : "text-muted-foreground"}`} />
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-sm text-foreground">{label}</div>
                        <div className="text-xs text-muted-foreground">{detail}</div>
                      </div>
                      {verified && <CheckCircle className="h-4 w-4 text-success" />}
                    </div>
                  ))}
                </CardContent></Card>

                {(breeder.certifications?.length ?? 0) > 0 && (
                  <Card><CardContent className="p-6">
                    <h3 className="font-semibold text-foreground mb-3">Certificazioni sanitarie</h3>
                    <div className="space-y-2">
                      {breeder.certifications!.map((cert) => (
                        <div key={cert} className="flex items-center gap-2.5 text-sm text-foreground">
                          <CheckCircle className="h-4 w-4 text-success shrink-0" />{cert}
                        </div>
                      ))}
                    </div>
                  </CardContent></Card>
                )}
              </section>
            )}

            {/* RECENSIONI */}
            {tab === "recensioni" && !editing && (
              <section>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-serif text-2xl text-foreground">
                    {reviews.length > 0 ? `${reviews.length} recensioni verificate` : "Recensioni"}
                  </h2>
                  {ReviewFormComponent}
                </div>
                {reviews.length === 0 ? (
                  <Card><CardContent className="py-14 text-center text-muted-foreground">
                    <Star className="h-8 w-8 mx-auto mb-3 text-border" />
                    <p className="font-medium text-foreground mb-1">Nessuna recensione ancora</p>
                    <p className="text-sm">Hai adottato da questo allevatore? Lascia la tua esperienza.</p>
                  </CardContent></Card>
                ) : (
                  <div className="space-y-4">
                    {reviews.map((review) => {
                      const name = review.author?.full_name ?? "Utente";
                      const date = new Date(review.created_at).toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" });
                      return (
                        <Card key={review.id}><CardContent className="p-6">
                          <div className="flex items-start justify-between gap-4 mb-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-primary-light flex items-center justify-center text-sm font-semibold text-primary shrink-0">
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
                        </CardContent></Card>
                      );
                    })}
                  </div>
                )}
              </section>
            )}

          </div>

          {/* ── Sidebar ─────────────────────────────────────────────── */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-border p-6 shadow-sm sticky top-20 space-y-5">

              {/* Owner edit CTA in sidebar */}
              {isOwner && !editing && (
                <Button className="w-full" variant="outline" onClick={startEditing}>
                  <Pencil className="h-4 w-4" /> Modifica profilo
                </Button>
              )}
              {isOwner && editing && (
                <div className="space-y-2">
                  <Button className="w-full" onClick={handleSave} isLoading={saving}>
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Salva modifiche
                  </Button>
                  <Button className="w-full" variant="outline" onClick={() => setEditing(false)} disabled={saving}>
                    <X className="h-4 w-4" /> Annulla
                  </Button>
                </div>
              )}

              {!isOwner && (
                <>
                  {priceLabel && (
                    <div>
                      <div className="text-2xl font-bold text-foreground">{priceLabel}</div>
                      <p className="text-xs text-muted-foreground mt-0.5">Prezzo indicativo per cucciolo</p>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm">
                    <div className={`w-2 h-2 rounded-full ${totalPuppies > 0 ? "bg-success" : "bg-border"}`} />
                    <span className="text-foreground font-medium">
                      {totalPuppies > 0 ? `${totalPuppies} cuccioli disponibili` : "Nessun cucciolo disponibile"}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {ChatModalComponent}
                    <Button variant="outline" className="w-full" onClick={() => setTab("cuccioli")}>
                      <Dog className="h-4 w-4" /> Vedi cuccioli
                    </Button>
                  </div>
                </>
              )}

              {/* Contact links */}
              {!editing && (
                <div className="space-y-2.5 pt-1">
                  {breeder.phone && (
                    <a href={`tel:${breeder.phone}`} className="flex items-center gap-3 text-sm text-foreground hover:text-primary transition-colors">
                      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0"><Phone className="h-4 w-4 text-muted-foreground" /></div>
                      {breeder.phone}
                    </a>
                  )}
                  {breeder.whatsapp && (
                    <a href={`https://wa.me/${breeder.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm text-foreground hover:text-primary transition-colors">
                      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0"><MessageCircle className="h-4 w-4 text-muted-foreground" /></div>
                      WhatsApp
                    </a>
                  )}
                  {breeder.email_public && (
                    <a href={`mailto:${breeder.email_public}`} className="flex items-center gap-3 text-sm text-foreground hover:text-primary transition-colors">
                      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0"><Mail className="h-4 w-4 text-muted-foreground" /></div>
                      {breeder.email_public}
                    </a>
                  )}
                  {breeder.website && (
                    <a href={breeder.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm text-foreground hover:text-primary transition-colors">
                      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0"><Globe className="h-4 w-4 text-muted-foreground" /></div>
                      Sito web <ExternalLink className="h-3 w-3 text-muted-foreground ml-auto" />
                    </a>
                  )}
                  {breeder.facebook_url && (
                    <a href={breeder.facebook_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm text-foreground hover:text-primary transition-colors">
                      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0"><Facebook className="h-4 w-4 text-muted-foreground" /></div>
                      Facebook <ExternalLink className="h-3 w-3 text-muted-foreground ml-auto" />
                    </a>
                  )}
                  {breeder.instagram_url && (
                    <a href={breeder.instagram_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm text-foreground hover:text-primary transition-colors">
                      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0"><Instagram className="h-4 w-4 text-muted-foreground" /></div>
                      Instagram <ExternalLink className="h-3 w-3 text-muted-foreground ml-auto" />
                    </a>
                  )}
                </div>
              )}

              {!isOwner && (
                <div className="pt-3 border-t border-border flex items-start gap-2.5">
                  <Shield className="h-4 w-4 text-success mt-0.5 shrink-0" />
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    I pagamenti su {SITE_NAME} sono protetti e tracciati.
                  </p>
                </div>
              )}
            </div>

            {/* Details card */}
            <Card><CardContent className="p-5 space-y-3">
              <h3 className="font-semibold text-sm text-foreground">Dettagli</h3>
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
              </div>
            </CardContent></Card>
          </div>

        </div>
      </div>
    </div>
  );
}
