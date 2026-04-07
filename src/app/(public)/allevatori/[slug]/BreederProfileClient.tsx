"use client";

import { useState, useRef, useEffect, lazy, Suspense } from "react";
import { useRouter } from "next/navigation";
import { slugify } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import {
  MapPin, Star, CheckCircle, Facebook, Instagram, ExternalLink,
  Dog, Pencil, X, Save, Loader2, Heart, Camera, Plus, Trash2, ArrowLeft, ArrowRight, Crop, GripVertical,
} from "lucide-react";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, useSortable, rectSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Button from "@/components/ui/Button";
import Rating from "@/components/ui/Rating";
import { SITE_NAME, DOG_TITLES, HEALTH_SCREENING_TYPES } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";
const RichTextEditor = lazy(() => import("@/components/ui/RichTextEditor"));
import ImageUpload from "@/components/ui/ImageUpload";
const ImageCropModal = lazy(() => import("@/components/ui/ImageCropModal"));
import { useAuth } from "@/components/auth/AuthProvider";
import { getClubBySlug, getClubsForFciId, type BreedClub } from "@/lib/breed-clubs";
import { razze } from "@/data/razze";
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
  id: string; user_id: string | null; kennel_name: string; slug: string;
  description: string | null; city: string | null; province: string | null;
  region: string | null; address: string | null; phone: string | null;
  email_public: string | null; whatsapp: string | null; website: string | null;
  facebook_url: string | null; instagram_url: string | null;
  enci_number: string | null; enci_verified: boolean; fci_affiliated: boolean;
  affisso: string | null; breed_club_memberships: string[] | null;
  year_established: number | null; logo_url: string | null;
  cover_image_url: string | null; gallery_urls: string[] | null;
  is_premium: boolean; average_rating: number; review_count: number;
  certifications: string[] | null; specializations: string[] | null;
  breed_ids: string[] | null; logo_position: string | null;
  cover_image_position: string | null;
}

interface BreedingDog {
  id: string; breeder_id: string; name: string; call_name: string | null;
  breed_id: string | null; sex: "maschio" | "femmina";
  date_of_birth: string | null; pedigree_number: string | null;
  microchip_number: string | null; color: string | null;
  titles: string[]; health_screenings: Record<string, string>;
  dna_deposited: boolean; photo_url: string | null; gallery_urls: string[];
  is_external: boolean; external_kennel_name: string | null;
  notes: string | null; sort_order: number;
}

interface Props {
  breeder: Breeder;
  breeds: Breed[];
  allBreeds: Breed[];
  listings: Listing[];
  breedingDogs: BreedingDog[];
  reviews: Review[];
  breederUserId: string | null;
  ChatModalComponent: React.ReactNode;
  ReviewFormComponent: React.ReactNode;
}

function SortablePhoto({ url, index, onCrop, onRemove }: { url: string; index: number; onCrop: (i: number) => void; onRemove: (i: number) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: url });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1, zIndex: isDragging ? 30 : undefined };
  return (
    <div ref={setNodeRef} style={style} className="relative aspect-square rounded-lg overflow-hidden bg-muted">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt="" className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0 bg-black/20 pointer-events-none" />
      {/* Drag handle */}
      <button {...attributes} {...listeners} className="absolute top-1 left-1 w-6 h-6 rounded bg-white/90 flex items-center justify-center cursor-grab active:cursor-grabbing" style={{ zIndex: 20 }}>
        <GripVertical className="h-3 w-3 text-muted-foreground" />
      </button>
      <div className="absolute top-1 right-1 flex gap-0.5" style={{ zIndex: 20 }}>
        <button onClick={() => onCrop(index)} className="w-6 h-6 rounded bg-white/90 flex items-center justify-center" title="Ritaglia"><Crop className="h-3 w-3" /></button>
        <button onClick={() => onRemove(index)} className="w-6 h-6 rounded bg-red-500/90 text-white flex items-center justify-center"><Trash2 className="h-3 w-3" /></button>
      </div>
    </div>
  );
}

function SortableDogCard({ dog, allBreeds, onEdit, onDelete }: { dog: BreedingDog; allBreeds: { id: string; name_it: string }[]; onEdit: (d: BreedingDog) => void; onDelete: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: dog.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };
  const breed = allBreeds.find((b) => b.id === dog.breed_id);
  return (
    <div ref={setNodeRef} style={style} className="bg-white rounded-2xl border border-border overflow-hidden">
      <div className="aspect-[4/3] bg-muted relative">
        {dog.photo_url
          ? <img src={dog.photo_url} alt={dog.name} className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center text-3xl">{dog.sex === "maschio" ? "♂" : "♀"}</div>}
        <button {...attributes} {...listeners} className="absolute top-2 left-2 w-7 h-7 rounded-lg bg-white/90 flex items-center justify-center cursor-grab active:cursor-grabbing">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </button>
        <div className="absolute top-2 right-2 flex gap-1">
          <button onClick={() => onEdit(dog)} className="w-7 h-7 rounded-lg bg-white/90 flex items-center justify-center"><Pencil className="h-3.5 w-3.5" /></button>
          <button onClick={() => { if (confirm("Eliminare questo riproduttore?")) onDelete(dog.id); }} className="w-7 h-7 rounded-lg bg-red-500/90 text-white flex items-center justify-center"><Trash2 className="h-3.5 w-3.5" /></button>
        </div>
      </div>
      <div className="p-3">
        <p className="font-medium text-foreground text-sm">{dog.call_name || dog.name}</p>
        <p className="text-xs text-muted-foreground">{breed?.name_it} · {dog.sex === "maschio" ? "Maschio" : "Femmina"}</p>
      </div>
    </div>
  );
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
  listings: initialListings, breedingDogs: initialBreedingDogs, reviews, breederUserId, ChatModalComponent, ReviewFormComponent,
}: Props) {
  const { user } = useAuth();
  const router = useRouter();
  const isOwner = !!user && !!breederUserId && user.id === breederUserId;
  const [tab, setTab] = useState<"allevamento" | "riproduttori" | "cuccioli" | "attesa" | "recensioni">("allevamento");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [isSaved, setIsSaved] = useState(false);
  const [savingFav, setSavingFav] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [editingPhotos, setEditingPhotos] = useState(false);
  const [editingDescription, setEditingDescription] = useState(false);
  const [descriptionDraft, setDescriptionDraft] = useState("");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [managedPhotos, setManagedPhotos] = useState<string[]>([]);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [cropIndex, setCropIndex] = useState<number | null>(null);
  const [localListings, setLocalListings] = useState<Listing[]>(initialListings);
  const [editingListingId, setEditingListingId] = useState<string | null>(null); // listing id or "new"
  const [listingForm, setListingForm] = useState({
    title: "", breed_id: "", description: "", litter_date: "",
    available_puppies: "", gender_available: "", price_on_request: false,
    price_min: "", price_max: "", pedigree_included: true,
    vaccinated: false, microchipped: false, images: [] as string[],
    status: "attivo" as string,
  });
  const [savingListing, setSavingListing] = useState(false);

  // Breeding dogs state
  const [localDogs, setLocalDogs] = useState<BreedingDog[]>(initialBreedingDogs);
  const [editingDogId, setEditingDogId] = useState<string | null>(null);
  const [editingDogsMode, setEditingDogsMode] = useState(false);
  const [selectedDogId, setSelectedDogId] = useState<string | null>(null); // for side panel
  const [dogForm, setDogForm] = useState({
    name: "", call_name: "", breed_id: "", sex: "maschio" as "maschio" | "femmina",
    date_of_birth: "", pedigree_number: "", microchip_number: "", color: "",
    titles: [] as string[], health_screenings: {} as Record<string, string>,
    dna_deposited: false, photo_url: "", gallery_urls: [] as string[],
    is_external: false, external_kennel_name: "", notes: "",
  });
  const [savingDog, setSavingDog] = useState(false);

  const coverInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  async function uploadPhoto(file: File, field: "cover_image_url" | "logo_url", setUploading: (v: boolean) => void) {
    setUploading(true);
    try {
      const supabase = createClient();
      if (!supabase) return;
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const fd = new FormData();
      fd.append("file", file);
      fd.append("bucket", "images");
      fd.append("folder", field === "cover_image_url" ? "covers" : "logos");

      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: fd,
      });
      const json = await res.json();
      if (!json.url) return;

      await (supabase as any).from("breeder_profiles").update({ [field]: json.url }).eq("id", breeder.id);
      setBreeder((prev) => ({ ...prev, [field]: json.url }));
    } finally {
      setUploading(false);
    }
  }

  function startEditingPhotos() {
    const current = [
      breeder.cover_image_url,
      ...(breeder.gallery_urls ?? []),
    ].filter(Boolean) as string[];
    setManagedPhotos(current);
    setEditingPhotos(true);
  }

  function movePhoto(from: number, to: number) {
    if (to < 0 || to >= managedPhotos.length) return;
    setManagedPhotos((prev) => {
      const arr = [...prev];
      const [item] = arr.splice(from, 1);
      arr.splice(to, 0, item);
      return arr;
    });
  }

  function removePhoto(index: number) {
    setManagedPhotos((prev) => prev.filter((_, i) => i !== index));
  }

  const dndSensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = managedPhotos.indexOf(active.id as string);
    const newIndex = managedPhotos.indexOf(over.id as string);
    if (oldIndex !== -1 && newIndex !== -1) movePhoto(oldIndex, newIndex);
  }

  async function uploadGalleryPhoto(file: File) {
    setUploadingGallery(true);
    try {
      const supabase = createClient();
      if (!supabase) return;
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const fd = new FormData();
      fd.append("file", file);
      fd.append("bucket", "images");
      fd.append("folder", "gallery");
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: fd,
      });
      const json = await res.json();
      if (json.url) setManagedPhotos((prev) => [...prev, json.url]);
    } finally {
      setUploadingGallery(false);
    }
  }

  async function cropAndReplace(index: number, croppedFile: File) {
    setUploadingGallery(true);
    try {
      const supabase = createClient();
      if (!supabase) return;
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const fd = new FormData();
      fd.append("file", croppedFile);
      fd.append("bucket", "images");
      fd.append("folder", "gallery");
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: fd,
      });
      const json = await res.json();
      if (json.url) {
        setManagedPhotos((prev) => prev.map((u, i) => (i === index ? json.url : u)));
      }
    } finally {
      setUploadingGallery(false);
      setCropIndex(null);
    }
  }

  async function saveDescription() {
    const supabase = createClient();
    if (!supabase) return;
    // Clean empty editor output
    const desc = descriptionDraft === "<p></p>" ? null : descriptionDraft || null;
    await (supabase as any).from("breeder_profiles").update({ description: desc }).eq("id", breeder.id);
    setBreeder((prev) => ({ ...prev, description: desc }));
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

  async function savePhotos() {
    const supabase = createClient();
    if (!supabase) return;
    const cover = managedPhotos[0] ?? null;
    const galleryUrls = managedPhotos.slice(1);
    await (supabase as any).from("breeder_profiles").update({
      cover_image_url: cover,
      gallery_urls: galleryUrls,
    }).eq("id", breeder.id);
    setBreeder((prev) => ({ ...prev, cover_image_url: cover, gallery_urls: galleryUrls }));
    setEditingPhotos(false);
  }

  function openListingEditor(listing?: Listing) {
    if (listing) {
      setEditingListingId(listing.id);
      setListingForm({
        title: listing.title ?? "", breed_id: listing.breed_id ?? "",
        description: "", litter_date: listing.litter_date ?? "",
        available_puppies: listing.available_puppies?.toString() ?? "",
        gender_available: listing.gender_available ?? "",
        price_on_request: listing.price_on_request,
        price_min: listing.price_min?.toString() ?? "",
        price_max: listing.price_max?.toString() ?? "",
        pedigree_included: listing.pedigree_included,
        vaccinated: listing.vaccinated, microchipped: listing.microchipped,
        images: listing.images ?? [], status: listing.status,
      });
    } else {
      setEditingListingId("new");
      setListingForm({
        title: "", breed_id: allBreeds[0]?.id ?? "", description: "", litter_date: "",
        available_puppies: "", gender_available: "", price_on_request: false,
        price_min: "", price_max: "", pedigree_included: true,
        vaccinated: false, microchipped: false, images: [], status: "attivo",
      });
    }
  }

  async function saveListing() {
    if (!listingForm.title.trim()) return;
    setSavingListing(true);
    try {
      const supabase = createClient();
      if (!supabase) return;
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const payload = {
        title: listingForm.title.trim(),
        breed_id: listingForm.breed_id || null,
        litter_date: listingForm.litter_date || null,
        available_puppies: listingForm.available_puppies ? parseInt(listingForm.available_puppies) : null,
        gender_available: listingForm.gender_available || null,
        price_on_request: listingForm.price_on_request,
        price_min: !listingForm.price_on_request && listingForm.price_min ? parseInt(listingForm.price_min) : null,
        price_max: !listingForm.price_on_request && listingForm.price_max ? parseInt(listingForm.price_max) : null,
        pedigree_included: listingForm.pedigree_included,
        vaccinated: listingForm.vaccinated,
        microchipped: listingForm.microchipped,
        images: listingForm.images,
        status: listingForm.status,
      };
      if (editingListingId === "new") {
        const res = await fetch("/api/listings", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (data.id) setLocalListings((prev) => [...prev, data]);
      } else {
        const res = await fetch(`/api/listings/${editingListingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (data.id) setLocalListings((prev) => prev.map((l) => (l.id === data.id ? data : l)));
      }
      setEditingListingId(null);
    } finally {
      setSavingListing(false);
    }
  }

  async function deleteListing(id: string) {
    const supabase = createClient();
    if (!supabase) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    await fetch(`/api/listings/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    setLocalListings((prev) => prev.filter((l) => l.id !== id));
  }

  // ── Breeding Dogs CRUD ──────────────────────────────────────────────
  function openDogEditor(dog?: BreedingDog) {
    if (dog) {
      setEditingDogId(dog.id);
      setDogForm({
        name: dog.name, call_name: dog.call_name ?? "", breed_id: dog.breed_id ?? "",
        sex: dog.sex, date_of_birth: dog.date_of_birth ?? "",
        pedigree_number: dog.pedigree_number ?? "", microchip_number: dog.microchip_number ?? "",
        color: dog.color ?? "", titles: dog.titles ?? [],
        health_screenings: dog.health_screenings ?? {},
        dna_deposited: dog.dna_deposited, photo_url: dog.photo_url ?? "",
        gallery_urls: dog.gallery_urls ?? [],
        is_external: dog.is_external, external_kennel_name: dog.external_kennel_name ?? "",
        notes: dog.notes ?? "",
      });
    } else {
      setEditingDogId("new");
      setDogForm({
        name: "", call_name: "", breed_id: "", sex: "maschio",
        date_of_birth: "", pedigree_number: "", microchip_number: "", color: "",
        titles: [], health_screenings: {}, dna_deposited: false,
        photo_url: "", gallery_urls: [], is_external: false,
        external_kennel_name: "", notes: "",
      });
    }
  }

  async function saveDog() {
    if (!dogForm.name.trim()) return;
    setSavingDog(true);
    try {
      const supabase = createClient();
      if (!supabase) return;
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const payload = {
        name: dogForm.name.trim(),
        call_name: dogForm.call_name.trim() || null,
        breed_id: dogForm.breed_id || null,
        sex: dogForm.sex,
        date_of_birth: dogForm.date_of_birth || null,
        pedigree_number: dogForm.pedigree_number.trim() || null,
        microchip_number: dogForm.microchip_number.trim() || null,
        color: dogForm.color.trim() || null,
        titles: dogForm.titles,
        health_screenings: dogForm.health_screenings,
        dna_deposited: dogForm.dna_deposited,
        photo_url: dogForm.photo_url || null,
        gallery_urls: dogForm.gallery_urls,
        is_external: dogForm.is_external,
        external_kennel_name: dogForm.is_external ? dogForm.external_kennel_name.trim() || null : null,
        notes: dogForm.notes.trim() || null,
      };
      if (editingDogId === "new") {
        const res = await fetch("/api/breeding-dogs", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (data.id) setLocalDogs((prev) => [...prev, data]);
      } else {
        const res = await fetch(`/api/breeding-dogs/${editingDogId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (data.id) setLocalDogs((prev) => prev.map((d) => (d.id === data.id ? data : d)));
      }
      setEditingDogId(null);
    } finally {
      setSavingDog(false);
    }
  }

  async function deleteDog(id: string) {
    const supabase = createClient();
    if (!supabase) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    await fetch(`/api/breeding-dogs/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    setLocalDogs((prev) => prev.filter((d) => d.id !== id));
  }

  async function saveDogOrder(ids: string[]) {
    const supabase = createClient();
    if (!supabase) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    await fetch("/api/breeding-dogs/reorder", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ ids }),
    });
  }

  function handleDogDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = localDogs.findIndex((d) => d.id === active.id);
    const newIndex = localDogs.findIndex((d) => d.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const reordered = [...localDogs];
    const [moved] = reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, moved);
    setLocalDogs(reordered);
    saveDogOrder(reordered.map((d) => d.id));
  }

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

  // Photo repositioning (logo only)
  const [repositioning, setRepositioning] = useState<"logo" | null>(null);
  const [logoPos, setLogoPos] = useState<{ x: number; y: number }>(() => {
    const parts = (initialBreeder.logo_position ?? "50% 50%").split(" ");
    return { x: parseFloat(parts[0]) || 50, y: parseFloat(parts[1]) || 50 };
  });
  const dragStart = useRef<{ mouseX: number; mouseY: number; posX: number; posY: number } | null>(null);

  function startDrag(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    dragStart.current = { mouseX: clientX, mouseY: clientY, posX: logoPos.x, posY: logoPos.y };

    function onMove(ev: MouseEvent | TouchEvent) {
      if (!dragStart.current) return;
      const cx = "touches" in ev ? (ev as TouchEvent).touches[0].clientX : (ev as MouseEvent).clientX;
      const cy = "touches" in ev ? (ev as TouchEvent).touches[0].clientY : (ev as MouseEvent).clientY;
      const dx = cx - dragStart.current.mouseX;
      const dy = cy - dragStart.current.mouseY;
      const sensitivity = 0.15;
      const newX = Math.max(0, Math.min(100, dragStart.current.posX - dx * sensitivity));
      const newY = Math.max(0, Math.min(100, dragStart.current.posY - dy * sensitivity));
      setLogoPos({ x: newX, y: newY });
    }

    function onUp() {
      dragStart.current = null;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onUp);
    }

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("touchend", onUp);
  }

  async function savePosition() {
    const supabase = createClient();
    if (!supabase) return;
    const value = `${logoPos.x.toFixed(1)}% ${logoPos.y.toFixed(1)}%`;
    await (supabase as any).from("breeder_profiles").update({ logo_position: value }).eq("id", breeder.id);
    setBreeder((prev) => ({ ...prev, logo_position: value }));
    setRepositioning(null);
  }

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
    affisso: initialBreeder.affisso ?? (null as unknown as string),
  });
  const [selectedBreedIds, setSelectedBreedIds] = useState<string[]>(initialBreeder.breed_ids ?? []);
  const [selectedClubSlugs, setSelectedClubSlugs] = useState<string[]>(initialBreeder.breed_club_memberships ?? []);

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
      affisso: breeder.affisso ?? (null as unknown as string),
    });
    setSelectedBreedIds(breeder.breed_ids ?? []);
    setSelectedClubSlugs(breeder.breed_club_memberships ?? []);
    setEditing(true);
    setSaveError(null);
    setSaveSuccess(false);
  }

  async function handleSave() {
    setSaving(true);
    setSaveError(null);
    const supabase = createClient();
    if (!supabase) { setSaveError("Supabase non configurato"); setSaving(false); return; }

    const newSlug = slugify(form.kennel_name);
    const updates = {
      kennel_name: form.kennel_name,
      region: form.region,
      province: form.province,
      city: form.city,
      year_established: form.year_established ? parseInt(form.year_established) : null,
      breed_ids: selectedBreedIds,
      slug: newSlug,
      affisso: form.affisso?.trim() || null,
      breed_club_memberships: (() => {
        // Only keep clubs relevant to current breeds
        const validSlugs = new Set<string>();
        for (const breedId of selectedBreedIds) {
          const breed = allBreeds.find((b) => b.id === breedId);
          if (!breed) continue;
          const razza = razze.find((r) => r.slug === breed.slug);
          if (!razza) continue;
          for (const club of getClubsForFciId(razza.fci_id)) {
            if (club.enciSlug) validSlugs.add(club.enciSlug);
          }
        }
        return selectedClubSlugs.filter((s) => validSlugs.has(s));
      })(),
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from("breeder_profiles")
      .update(updates)
      .eq("id", breeder.id);

    if (error) {
      setSaveError(`Errore: ${error.message}`);
      setSaving(false);
      return;
    }

    setBreeder((prev) => ({ ...prev, ...updates }));
    setBreeds(allBreeds.filter((b) => selectedBreedIds.includes(b.id)));
    setEditing(false);
    setSaving(false);

    // Redirect to new URL if slug changed
    if (newSlug !== breeder.slug) {
      router.replace(`/allevatori/${newSlug}`);
    } else {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  }

  const activeListings = localListings.filter((l) => l.status === "attivo");
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

      {/* ── Banners ───────────────────────────────────────────────────────── */}
      {saveError && (
        <div className="bg-red-50 border-b border-red-200 text-red-700 text-sm px-4 py-3 text-center">{saveError}</div>
      )}
      {saveSuccess && (
        <div className="bg-emerald-50 border-b border-emerald-200 text-emerald-700 text-sm px-4 py-3 text-center flex items-center justify-center gap-2">
          <CheckCircle className="h-4 w-4" /> Profilo aggiornato con successo
        </div>
      )}

      {/* ── Header: profile pic + name + info ───────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-2">
        <div className="relative flex items-start gap-5">
          {/* Edit/Save buttons moved to right-side column below */}

          {/* Profile photo */}
          <div className="relative group shrink-0 w-20 h-20 md:w-24 md:h-24">
            <input ref={logoInputRef} type="file" accept="image/*" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadPhoto(f, "logo_url", setUploadingLogo); e.target.value = ""; }} />
            <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-full bg-primary overflow-hidden flex items-center justify-center text-white text-xl md:text-2xl font-bold">
              {breeder.logo_url
                ? <Image src={breeder.logo_url} alt={breeder.kennel_name} fill draggable={false}
                    className="object-cover select-none"
                    style={{ objectPosition: `${logoPos.x.toFixed(1)}% ${logoPos.y.toFixed(1)}%` }} />
                : initials}
            </div>
            {isOwner && (
              <button onClick={() => logoInputRef.current?.click()} disabled={uploadingLogo}
                className="absolute inset-0 rounded-full flex items-center justify-center bg-black/0 group-hover:bg-black/40 transition-colors">
                {uploadingLogo
                  ? <Loader2 className="h-4 w-4 text-white animate-spin" />
                  : <Camera className="h-4 w-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />}
              </button>
            )}
          </div>

          {/* Name + details */}
          <div className="min-w-0 flex-1 pt-1">
            {editing ? (
              <div className="space-y-3 max-w-lg">
                <Field label="Nome allevamento" value={form.kennel_name} onChange={(v) => setForm({ ...form, kennel_name: v })} />
                <div className="space-y-1">
                  <label className="text-sm text-muted-foreground">Razze allevate</label>
                  <BreedPicker allBreeds={allBreeds} selectedIds={selectedBreedIds} onChange={setSelectedBreedIds} />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground">Hai un affisso?</span>
                    <button type="button" onClick={() => setForm({ ...form, affisso: "" })}
                      className={`px-3 py-1 text-xs rounded-full border transition-colors ${form.affisso !== null ? "bg-primary text-white border-primary" : "border-border text-muted-foreground hover:border-primary"}`}>
                      Si
                    </button>
                    <button type="button" onClick={() => setForm({ ...form, affisso: null as unknown as string })}
                      className={`px-3 py-1 text-xs rounded-full border transition-colors ${form.affisso === null ? "bg-primary text-white border-primary" : "border-border text-muted-foreground hover:border-primary"}`}>
                      No
                    </button>
                  </div>
                  {form.affisso !== null && (
                    <Field label="Nome affisso" value={form.affisso} onChange={(v) => setForm({ ...form, affisso: v })} placeholder="Es. Del Castello Incantato" />
                  )}
                </div>
                {(() => {
                  const relevantClubs = new Map<string, BreedClub>();
                  for (const breedId of selectedBreedIds) {
                    const breed = allBreeds.find((b) => b.id === breedId);
                    if (!breed) continue;
                    const razza = razze.find((r) => r.slug === breed.slug);
                    if (!razza) continue;
                    for (const club of getClubsForFciId(razza.fci_id)) {
                      if (club.enciSlug) relevantClubs.set(club.enciSlug, club);
                    }
                  }
                  const clubList = Array.from(relevantClubs.values());
                  if (clubList.length === 0) return null;
                  return (
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                      <span className="text-sm text-muted-foreground">Membro di:</span>
                      {clubList.map((club) => (
                        <label key={club.enciSlug} className="flex items-center gap-1.5 text-sm cursor-pointer">
                          <input
                            type="checkbox"
                            className="rounded"
                            checked={selectedClubSlugs.includes(club.enciSlug!)}
                            onChange={() => setSelectedClubSlugs((prev) =>
                              prev.includes(club.enciSlug!) ? prev.filter((s) => s !== club.enciSlug) : [...prev, club.enciSlug!]
                            )}
                          />
                          {club.shortName}
                        </label>
                      ))}
                    </div>
                  );
                })()}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm text-muted-foreground mb-1 block">Regione</label>
                    <select value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value, province: "" })}
                      className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30">
                      <option value="">Regione</option>
                      {regioni.map((r) => <option key={r.slug} value={r.nome}>{r.nome}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground mb-1 block">Provincia</label>
                    <select value={form.province} onChange={(e) => setForm({ ...form, province: e.target.value })}
                      className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
                      disabled={!provinceOptions.length}>
                      <option value="">Provincia</option>
                      {provinceOptions.map((p) => <option key={p.sigla} value={p.nome}>{p.nome} ({p.sigla})</option>)}
                    </select>
                  </div>
                </div>
                <Field label="Citta'" value={form.city} onChange={(v) => setForm({ ...form, city: v })} />
                <Field label="Anno di fondazione" type="number" value={form.year_established} onChange={(v) => setForm({ ...form, year_established: v })} />
              </div>
            ) : (
              <>
                <h1 className="text-xl md:text-2xl font-semibold text-foreground leading-tight">{breeder.kennel_name}</h1>
                {breeds.length > 0 && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Allevatore di{" "}
                    {breeds.map((b, i) => (
                      <span key={b.id}>
                        {i > 0 && i === breeds.length - 1 && " e "}
                        {i > 0 && i < breeds.length - 1 && ", "}
                        <Link href={`/razze/${b.slug}`} className="underline hover:text-foreground">{b.name_it}</Link>
                      </span>
                    ))}
                  </p>
                )}
                {breeder.affisso && (
                  <p className="text-sm text-primary font-medium mt-1 flex items-center gap-1">
                    <CheckCircle className="h-3.5 w-3.5" />
                    Affisso: {breeder.affisso}
                  </p>
                )}
                {(breeder.breed_club_memberships ?? []).length > 0 && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Membro di {(breeder.breed_club_memberships ?? []).map((slug) => {
                      const club = getClubBySlug(slug);
                      return club?.shortName ?? slug;
                    }).join(", ")}
                  </p>
                )}
                {location && (
                  <p className="flex items-center gap-1 mt-1.5 text-sm text-muted-foreground"><MapPin className="h-3.5 w-3.5" />{location}</p>
                )}
                {breeder.year_established && (
                  <p className="text-sm text-muted-foreground mt-0.5">Dal {breeder.year_established}</p>
                )}
                {breeder.review_count > 0 && (
                  <p className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
                    <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                    {breeder.average_rating.toFixed(1)} ({breeder.review_count})
                  </p>
                )}
              </>
            )}
          </div>

          {/* Right side: edit buttons + logos + visitor actions */}
          <div className="hidden sm:flex flex-col items-end gap-3 shrink-0 pt-1">
            {isOwner && !editing && (
              <button onClick={startEditing} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                <Pencil className="h-3 w-3" /> Modifica
              </button>
            )}
            {isOwner && editing && (
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSave} isLoading={saving}><Save className="h-3.5 w-3.5" /> Salva</Button>
                <Button size="sm" variant="outline" onClick={() => setEditing(false)} disabled={saving}><X className="h-3.5 w-3.5" /></Button>
              </div>
            )}
            {!isOwner && (
              <div className="flex items-center gap-2">
                {ChatModalComponent && <div key="chat">{ChatModalComponent}</div>}
                <button
                  onClick={toggleFavorite}
                  disabled={savingFav}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors"
                >
                  <Heart className={`h-4 w-4 ${isSaved ? "fill-rose-500 text-rose-500" : ""}`} />
                  {isSaved ? "Salvato" : "Salva"}
                </button>
              </div>
            )}
            {!editing && (breeder.affisso || (breeder.breed_club_memberships ?? []).length > 0) && (
              <div className="flex items-center gap-3">
                {breeder.affisso && (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/images/enci-logo.png" alt="ENCI" title="ENCI" className="h-14 object-contain" style={{ mixBlendMode: "multiply" }} />
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/images/fci-logo.png" alt="FCI" title="FCI" className="h-14 object-contain" style={{ mixBlendMode: "multiply" }} />
                  </>
                )}
                {(breeder.breed_club_memberships ?? []).map((slug) => {
                  const club = getClubBySlug(slug);
                  if (!club) return null;
                  if (!club?.logo) return null;
                  return (
                    <a key={slug} href={club.website ?? undefined} target="_blank" rel="noopener noreferrer" title={club.shortName}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={club.logo} alt={club.shortName} className="h-14 object-contain" style={{ mixBlendMode: "multiply" }} />
                    </a>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Mobile visitor actions */}
        {!isOwner && (
          <div className="flex sm:hidden items-center gap-2 mt-3 px-0">
            {ChatModalComponent && <div key="chat">{ChatModalComponent}</div>}
            <button
              onClick={toggleFavorite}
              disabled={savingFav}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors"
            >
              <Heart className={`h-4 w-4 ${isSaved ? "fill-rose-500 text-rose-500" : ""}`} />
              {isSaved ? "Salvato" : "Salva"}
            </button>
          </div>
        )}
      </div>

      {/* ── Tabs ─────────────────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex border-b border-border mt-4">
            {([
              { id: "allevamento" as const, label: "L'allevamento" },
              { id: "riproduttori" as const, label: "Riproduttori" },
              { id: "cuccioli" as const, label: "Cuccioli e cucciolate" },
              { id: "attesa" as const, label: "Lista d'attesa" },
              { id: "recensioni" as const, label: "Recensioni" },
            ]).map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`px-1 py-3 mr-5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors -mb-px ${
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

      {/* ── Content ──────────────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* ── TAB: L'allevamento ─────────────────────────────────────────── */}
        {tab === "allevamento" && (
          <div className="space-y-6">
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
                    placeholder="Racconta la storia del tuo allevamento, la tua filosofia, come cresci i cuccioli..."
                  />
                </Suspense>
              ) : breeder.description ? (
                <div className="relative">
                  {isOwner && (
                    <button onClick={() => { setDescriptionDraft(breeder.description ?? ""); setEditingDescription(true); }}
                      className="absolute top-0 right-0 text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                      <Pencil className="h-3 w-3" /> Modifica
                    </button>
                  )}
                  <div
                    className="prose prose-sm max-w-none text-muted-foreground [&_h1]:text-foreground [&_h1]:text-xl [&_h1]:font-bold [&_h1]:mt-4 [&_h1]:mb-2 [&_h2]:text-foreground [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:mt-3 [&_h2]:mb-1.5 [&_p]:my-1.5 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:my-0.5 [&_a]:text-primary [&_a]:underline [&_img]:rounded-xl [&_img]:my-3 [&_strong]:text-foreground"
                    dangerouslySetInnerHTML={{ __html: breeder.description }}
                  />
                </div>
              ) : isOwner ? (
                <button onClick={() => { setDescriptionDraft(""); setEditingDescription(true); }}
                  className="w-full py-6 text-sm text-muted-foreground hover:text-foreground text-center border border-dashed border-border rounded-xl">
                  <Pencil className="h-4 w-4 inline mr-1" /> Scrivi la presentazione del tuo allevamento
                </button>
              ) : null}
            </section>

            {/* Photos — inline manageable for owner */}
            <section className="">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">Galleria</h2>
                {isOwner && !editingPhotos && (
                  <button onClick={startEditingPhotos} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                    <Pencil className="h-3 w-3" /> Gestisci
                  </button>
                )}
                {isOwner && editingPhotos && (
                  <div className="flex gap-2">
                    <button onClick={savePhotos} className="text-xs bg-primary text-white px-2.5 py-1 rounded-lg">Salva</button>
                    <button onClick={() => setEditingPhotos(false)} className="text-xs text-muted-foreground hover:text-foreground">Annulla</button>
                  </div>
                )}
              </div>
              {editingPhotos ? (
                <DndContext sensors={dndSensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={managedPhotos} strategy={rectSortingStrategy}>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {managedPhotos.map((url, i) => (
                        <SortablePhoto key={url} url={url} index={i} onCrop={setCropIndex} onRemove={removePhoto} />
                      ))}
                      <div className="aspect-square rounded-lg border-2 border-dashed border-border flex items-center justify-center hover:border-primary/50 cursor-pointer"
                        onClick={() => galleryInputRef.current?.click()}>
                        <input ref={galleryInputRef} type="file" accept="image/*" multiple className="hidden"
                          onChange={(e) => { const files = e.target.files; if (files) Array.from(files).forEach((f) => uploadGalleryPhoto(f)); e.target.value = ""; }} />
                        {uploadingGallery ? <Loader2 className="h-5 w-5 text-muted-foreground animate-spin" /> : <Plus className="h-5 w-5 text-muted-foreground" />}
                      </div>
                    </div>
                  </SortableContext>
                </DndContext>
              ) : gallery.length > 0 ? (
                <div className={`grid gap-2 ${gallery.length === 1 ? "grid-cols-1" : "grid-cols-2"}`} style={{ gridAutoRows: "140px" }}>
                  {gallery.slice(0, 4).map((url, i) => (
                    <div
                      key={i}
                      className={`relative rounded-xl overflow-hidden bg-muted cursor-pointer ${gallery.length >= 2 && i === 0 ? "row-span-3" : ""}`}
                      onClick={() => setLightboxIndex(i)}
                    >
                      <Image src={url} alt={`${breeder.kennel_name} ${i + 1}`} fill className="object-cover" />
                      {i === 3 && gallery.length > 4 && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <span className="text-white text-2xl font-semibold">+{gallery.length - 4}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : isOwner ? (
                <button onClick={startEditingPhotos} className="w-full py-4 text-sm text-muted-foreground hover:text-foreground text-center">
                  <Camera className="h-4 w-4 inline mr-1" /> Aggiungi foto
                </button>
              ) : (
                <p className="text-sm text-muted-foreground">Nessuna foto.</p>
              )}
            </section>

          </div>
        )}

        {/* ── TAB: Riproduttori ─────────────────────────────────────────── */}
        {tab === "riproduttori" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">
                Riproduttori{localDogs.length > 0 ? ` (${localDogs.length})` : ""}
              </h2>
              {isOwner && !editingDogsMode && (
                <div className="flex gap-2">
                  <button onClick={() => setEditingDogsMode(true)} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                    <Pencil className="h-3 w-3" /> Gestisci
                  </button>
                </div>
              )}
              {isOwner && editingDogsMode && (
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => openDogEditor()}><Plus className="h-4 w-4" /> Nuovo</Button>
                  <button onClick={() => setEditingDogsMode(false)} className="text-xs text-muted-foreground hover:text-foreground">Fine</button>
                </div>
              )}
            </div>

            {localDogs.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                <Dog className="h-8 w-8 mx-auto mb-3 text-border" />
                <p className="text-sm">{isOwner ? "Non hai ancora aggiunto riproduttori." : "Nessun riproduttore registrato."}</p>
                {isOwner && (
                  <button onClick={() => { setEditingDogsMode(true); openDogEditor(); }} className="text-sm text-primary hover:underline mt-2">
                    Aggiungi il primo
                  </button>
                )}
              </div>
            ) : editingDogsMode ? (
              <DndContext sensors={dndSensors} collisionDetection={closestCenter} onDragEnd={handleDogDragEnd}>
                <SortableContext items={localDogs.map((d) => d.id)} strategy={rectSortingStrategy}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {localDogs.map((dog) => (
                      <SortableDogCard key={dog.id} dog={dog} allBreeds={allBreeds} onEdit={openDogEditor} onDelete={deleteDog} />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {localDogs.map((dog) => {
                  const breed = allBreeds.find((b) => b.id === dog.breed_id);
                  return (
                    <div key={dog.id} className="bg-white rounded-2xl border border-border overflow-hidden cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedDogId(dog.id)}>
                      <div className="aspect-[4/3] bg-muted relative">
                        {dog.photo_url
                          ? <img src={dog.photo_url} alt={dog.name} className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center text-3xl">{dog.sex === "maschio" ? "♂" : "♀"}</div>}
                        {dog.is_external && (
                          <span className="absolute top-2 left-2 bg-amber-100 text-amber-700 text-[10px] font-medium px-2 py-0.5 rounded-full">Monta esterna</span>
                        )}
                      </div>
                      <div className="p-4">
                        <p className="font-medium text-foreground">{dog.call_name || dog.name}</p>
                        {dog.call_name && <p className="text-xs text-muted-foreground">{dog.name}</p>}
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          <span>{breed?.name_it}</span>
                          <span>·</span>
                          <span>{dog.sex === "maschio" ? "Maschio" : "Femmina"}</span>
                          {dog.color && <><span>·</span><span>{dog.color}</span></>}
                        </div>
                        {dog.titles.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {dog.titles.slice(0, 3).map((t) => (
                              <span key={t} className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">{t}</span>
                            ))}
                            {dog.titles.length > 3 && <span className="text-[10px] text-muted-foreground">+{dog.titles.length - 3}</span>}
                          </div>
                        )}
                        {Object.keys(dog.health_screenings).length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {Object.entries(dog.health_screenings).map(([key, val]) => (
                              <span key={key} className="text-[10px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded-full">
                                {key.toUpperCase()}: {val}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Side Panel: Dog Detail ──────────────────────────────────────── */}
        {selectedDogId && (() => {
          const dog = localDogs.find((d) => d.id === selectedDogId);
          if (!dog) return null;
          const breed = allBreeds.find((b) => b.id === dog.breed_id);
          return (
            <div className="fixed inset-0 z-50 flex justify-end" onClick={() => setSelectedDogId(null)}>
              <div className="absolute inset-0 bg-black/30" />
              <div className="relative w-full max-w-md bg-white shadow-2xl overflow-y-auto animate-in slide-in-from-right" onClick={(e) => e.stopPropagation()}>
                <button onClick={() => setSelectedDogId(null)} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
                  <X className="h-5 w-5" />
                </button>
                {dog.photo_url && (
                  <div className="aspect-[4/3] bg-muted">
                    <img src={dog.photo_url} alt={dog.name} className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="p-6 space-y-4">
                  <div>
                    {dog.call_name && <p className="text-sm text-muted-foreground">{dog.call_name}</p>}
                    <h3 className="text-lg font-semibold text-foreground">{dog.name}</h3>
                    <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                      <span>{breed?.name_it}</span>
                      <span>·</span>
                      <span>{dog.sex === "maschio" ? "Maschio ♂" : "Femmina ♀"}</span>
                    </div>
                  </div>
                  {(dog.color || dog.date_of_birth) && (
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      {dog.color && <div><span className="text-muted-foreground">Colore</span><p className="font-medium">{dog.color}</p></div>}
                      {dog.date_of_birth && <div><span className="text-muted-foreground">Data di nascita</span><p className="font-medium">{new Date(dog.date_of_birth).toLocaleDateString("it-IT")}</p></div>}
                    </div>
                  )}
                  {(dog.pedigree_number || dog.microchip_number) && (
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      {dog.pedigree_number && <div><span className="text-muted-foreground">Pedigree (ROI)</span><p className="font-medium">{dog.pedigree_number}</p></div>}
                      {dog.microchip_number && <div><span className="text-muted-foreground">Microchip</span><p className="font-medium">{dog.microchip_number}</p></div>}
                    </div>
                  )}
                  {dog.titles.length > 0 && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1.5">Titoli</p>
                      <div className="flex flex-wrap gap-1.5">
                        {dog.titles.map((t) => <span key={t} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{t}</span>)}
                      </div>
                    </div>
                  )}
                  {Object.keys(dog.health_screenings).length > 0 && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1.5">Screening sanitari</p>
                      <div className="space-y-1">
                        {Object.entries(dog.health_screenings).map(([key, val]) => {
                          const type = HEALTH_SCREENING_TYPES[key as keyof typeof HEALTH_SCREENING_TYPES];
                          return (
                            <div key={key} className="flex items-center justify-between text-sm">
                              <span>{type?.label ?? key}</span>
                              <span className="font-medium text-emerald-700">{val}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  {dog.dna_deposited && (
                    <div className="flex items-center gap-2 text-sm text-emerald-600">
                      <CheckCircle className="h-4 w-4" />DNA depositato
                    </div>
                  )}
                  {dog.is_external && dog.external_kennel_name && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">Monta esterna da: </span>
                      <span className="font-medium">{dog.external_kennel_name}</span>
                    </div>
                  )}
                  {dog.notes && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Note</p>
                      <p className="text-sm text-foreground">{dog.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })()}

        {/* ── TAB: Cuccioli e cucciolate ─────────────────────────────────── */}
        {tab === "cuccioli" && (
          <div className="space-y-6">
            {isOwner && (
              <div className="flex justify-end">
                <Button size="sm" onClick={() => openListingEditor()}><Plus className="h-4 w-4" /> Nuova cucciolata</Button>
              </div>
            )}
            {(() => {
              const visibleListings = isOwner ? localListings : activeListings;
              return visibleListings.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">
                  <Dog className="h-8 w-8 mx-auto mb-3 text-border" />
                  <p className="text-sm">{isOwner ? "Non hai ancora pubblicato cucciolate." : "Nessun cucciolo disponibile al momento."}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {visibleListings.map((listing) => {
                    const breed = breeds.find((b) => b.id === listing.breed_id);
                    const price = formatPrice(listing.price_min, listing.price_max, listing.price_on_request);
                    const img = listing.images?.[0];
                    const isDraft = listing.status === "bozza";
                    return (
                      <div key={listing.id} className={`bg-white rounded-2xl border overflow-hidden ${isDraft ? "border-dashed border-border" : "border-border"}`}>
                        <div className="aspect-[4/3] bg-muted relative">
                          {img
                            ? <Image src={img} alt={listing.title ?? "Cucciolo"} fill className="object-cover" />
                            : <div className="w-full h-full flex items-center justify-center text-3xl">🐶</div>}
                          {isOwner && isDraft && (
                            <span className="absolute top-2 left-2 bg-amber-100 text-amber-700 text-[10px] font-medium px-2 py-0.5 rounded-full">Bozza</span>
                          )}
                        </div>
                        <div className="p-4">
                          <p className="font-medium text-foreground">{listing.title ?? breed?.name_it ?? "Cucciolo"}</p>
                          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                            {listing.available_puppies != null && <span>{listing.available_puppies} disponibili</span>}
                            {listing.gender_available && <span>· {listing.gender_available}</span>}
                          </div>
                          {price && price !== "Prezzo su richiesta" && (
                            <p className="text-sm font-semibold text-foreground mt-2">{price}</p>
                          )}
                          {isOwner && (
                            <div className="flex items-center gap-3 mt-2">
                              <button onClick={() => openListingEditor(listing)} className="text-xs text-primary hover:underline">Modifica</button>
                              <button onClick={() => { if (confirm("Eliminare questa cucciolata?")) deleteListing(listing.id); }} className="text-xs text-red-500 hover:underline">Elimina</button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        )}

        {/* ── TAB: Lista d'attesa ────────────────────────────────────────── */}
        {tab === "attesa" && (
          <div className="py-12 text-center text-muted-foreground">
            <p className="text-sm">La lista d&apos;attesa non è ancora disponibile per questo allevatore.</p>
          </div>
        )}

        {/* ── TAB: Recensioni ────────────────────────────────────────────── */}
        {tab === "recensioni" && (
          <div className="">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">
                Recensioni{breeder.review_count > 0 ? ` (${breeder.review_count})` : ""}
              </h2>
              <div key="review-form">{ReviewFormComponent}</div>
            </div>
            {breeder.review_count > 0 && (
              <div className="flex items-center gap-3 mb-5 pb-5 border-b border-border">
                <span className="text-3xl font-semibold text-foreground">{breeder.average_rating.toFixed(1)}</span>
                <div>
                  <Rating value={breeder.average_rating} />
                  <p className="text-xs text-muted-foreground mt-0.5">{breeder.review_count} recension{breeder.review_count === 1 ? "e" : "i"}</p>
                </div>
              </div>
            )}
            {reviews.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nessuna recensione ancora.</p>
            ) : (
              <div className="divide-y divide-border">
                {reviews.map((review) => {
                  const name = review.author?.full_name ?? "Utente";
                  const date = new Date(review.created_at).toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" });
                  return (
                    <div key={review.id} className="py-4 first:pt-0 last:pb-0">
                      <div className="flex items-center justify-between mb-1.5">
                        <p className="text-sm font-medium text-foreground">{name}</p>
                        <p className="text-xs text-muted-foreground">{date}</p>
                      </div>
                      <Rating value={review.rating} size="sm" />
                      {review.title && <p className="font-medium text-sm text-foreground mt-2">{review.title}</p>}
                      {review.content && <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{review.content}</p>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Crop Modal ────────────────────────────────────────────────────── */}
      {cropIndex !== null && (
        <Suspense>
          <ImageCropModal
            src={managedPhotos[cropIndex]}
            onCrop={(file) => cropAndReplace(cropIndex, file)}
            onClose={() => setCropIndex(null)}
          />
        </Suspense>
      )}

      {/* ── Lightbox ─────────────────────────────────────────────────────── */}
      {lightboxIndex !== null && (() => {
        const allPhotos = gallery.filter(Boolean) as string[];
        const idx = lightboxIndex;
        const prev = () => setLightboxIndex(idx > 0 ? idx - 1 : allPhotos.length - 1);
        const next = () => setLightboxIndex(idx < allPhotos.length - 1 ? idx + 1 : 0);

        return (
          <div className="fixed inset-0 z-[100] bg-[#1a1f2e]/95 flex flex-col"
            onClick={() => setLightboxIndex(null)}
            onKeyDown={(e) => { if (e.key === "Escape") setLightboxIndex(null); if (e.key === "ArrowLeft") prev(); if (e.key === "ArrowRight") next(); }}
            tabIndex={0}
            ref={(el) => el?.focus()}
          >
            {/* Close */}
            <button onClick={() => setLightboxIndex(null)} className="absolute top-4 right-4 z-10 text-white/70 hover:text-white">
              <X className="h-6 w-6" />
            </button>

            {/* Main image */}
            <div className="flex-1 flex items-center justify-center px-16 py-8" onClick={(e) => e.stopPropagation()}>
              {allPhotos.length > 1 && (
                <button onClick={prev} className="absolute left-4 w-10 h-10 rounded-full border border-white/30 bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors">
                  <ArrowLeft className="h-5 w-5" />
                </button>
              )}
              <div className="relative max-w-5xl w-full h-full">
                <Image src={allPhotos[idx]} alt="" fill className="object-contain" />
              </div>
              {allPhotos.length > 1 && (
                <button onClick={next} className="absolute right-4 w-10 h-10 rounded-full border border-white/30 bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors">
                  <ArrowRight className="h-5 w-5" />
                </button>
              )}
            </div>

            {/* Thumbnails */}
            {allPhotos.length > 1 && (
              <div className="flex justify-center gap-1.5 pb-4 px-4" onClick={(e) => e.stopPropagation()}>
                {allPhotos.map((url, i) => (
                  <button key={i} onClick={() => setLightboxIndex(i)}
                    className={`relative w-14 h-14 rounded-lg overflow-hidden shrink-0 transition-opacity ${i === idx ? "ring-2 ring-white opacity-100" : "opacity-50 hover:opacity-80"}`}>
                    <Image src={url} alt="" fill className="object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })()}

      {/* ── Listing Editor Modal ─────────────────────────────────────────── */}
      {editingListingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setEditingListingId(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h3 className="font-semibold text-lg">{editingListingId === "new" ? "Nuova cucciolata" : "Modifica cucciolata"}</h3>
              <button onClick={() => setEditingListingId(null)} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <Field label="Titolo *" value={listingForm.title} onChange={(v) => setListingForm((f) => ({ ...f, title: v }))} placeholder="Es. Cuccioli di Labrador disponibili" />
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Razza</label>
                <select
                  value={listingForm.breed_id}
                  onChange={(e) => setListingForm((f) => ({ ...f, breed_id: e.target.value }))}
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="">Seleziona razza</option>
                  {allBreeds.map((b) => <option key={b.id} value={b.id}>{b.name_it}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <Field label="Data di nascita" value={listingForm.litter_date} onChange={(v) => setListingForm((f) => ({ ...f, litter_date: v }))} type="date" />
                <Field label="Cuccioli disponibili" value={listingForm.available_puppies} onChange={(v) => setListingForm((f) => ({ ...f, available_puppies: v }))} type="number" placeholder="4" />
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">Sesso</label>
                  <select
                    value={listingForm.gender_available}
                    onChange={(e) => setListingForm((f) => ({ ...f, gender_available: e.target.value }))}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    <option value="">Seleziona</option>
                    <option value="maschio">Solo maschi</option>
                    <option value="femmina">Solo femmine</option>
                    <option value="entrambi">Maschi e femmine</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={listingForm.price_on_request} onChange={(e) => setListingForm((f) => ({ ...f, price_on_request: e.target.checked }))} className="rounded" />
                  Prezzo su richiesta
                </label>
                {!listingForm.price_on_request && (
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    <Field label="Prezzo min (€)" value={listingForm.price_min} onChange={(v) => setListingForm((f) => ({ ...f, price_min: v }))} type="number" placeholder="1500" />
                    <Field label="Prezzo max (€)" value={listingForm.price_max} onChange={(v) => setListingForm((f) => ({ ...f, price_max: v }))} type="number" placeholder="2000" />
                  </div>
                )}
              </div>
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={listingForm.pedigree_included} onChange={(e) => setListingForm((f) => ({ ...f, pedigree_included: e.target.checked }))} className="rounded" />
                  Pedigree
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={listingForm.vaccinated} onChange={(e) => setListingForm((f) => ({ ...f, vaccinated: e.target.checked }))} className="rounded" />
                  Vaccinati
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={listingForm.microchipped} onChange={(e) => setListingForm((f) => ({ ...f, microchipped: e.target.checked }))} className="rounded" />
                  Microchippati
                </label>
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Foto</label>
                <ImageUpload images={listingForm.images} onChange={(imgs) => setListingForm((f) => ({ ...f, images: imgs }))} maxImages={6} folder="listings" />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-border">
              <button onClick={() => setEditingListingId(null)} className="text-sm text-muted-foreground hover:text-foreground px-3 py-1.5">Annulla</button>
              <button onClick={saveListing} disabled={savingListing || !listingForm.title.trim()} className="text-sm bg-primary text-white px-4 py-1.5 rounded-lg hover:bg-primary-dark disabled:opacity-40 transition-colors font-medium">
                {savingListing ? "Salvataggio..." : editingListingId === "new" ? "Pubblica" : "Salva"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Dog Editor Modal ─────────────────────────────────────────────── */}
      {editingDogId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setEditingDogId(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h3 className="font-semibold text-lg">{editingDogId === "new" ? "Nuovo riproduttore" : "Modifica riproduttore"}</h3>
              <button onClick={() => setEditingDogId(null)} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Nome registrato *" value={dogForm.name} onChange={(v) => setDogForm((f) => ({ ...f, name: v }))} placeholder="Multi Ch. Del Castello Apollo" />
                <Field label="Nome da chiamata" value={dogForm.call_name} onChange={(v) => setDogForm((f) => ({ ...f, call_name: v }))} placeholder="Apollo" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">Sesso *</label>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setDogForm((f) => ({ ...f, sex: "maschio" }))}
                      className={`flex-1 px-3 py-2 text-sm rounded-lg border transition-colors ${dogForm.sex === "maschio" ? "bg-primary text-white border-primary" : "border-border hover:border-primary"}`}>
                      Maschio
                    </button>
                    <button type="button" onClick={() => setDogForm((f) => ({ ...f, sex: "femmina" }))}
                      className={`flex-1 px-3 py-2 text-sm rounded-lg border transition-colors ${dogForm.sex === "femmina" ? "bg-primary text-white border-primary" : "border-border hover:border-primary"}`}>
                      Femmina
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">Razza</label>
                  <select value={dogForm.breed_id} onChange={(e) => setDogForm((f) => ({ ...f, breed_id: e.target.value }))}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30">
                    <option value="">Seleziona</option>
                    {allBreeds.filter((b) => (breeder.breed_ids ?? []).includes(b.id)).map((b) => <option key={b.id} value={b.id}>{b.name_it}</option>)}
                  </select>
                </div>
                <Field label="Colore/mantello" value={dogForm.color} onChange={(v) => setDogForm((f) => ({ ...f, color: v }))} placeholder="Nero focato" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <Field label="Data di nascita" type="date" value={dogForm.date_of_birth} onChange={(v) => setDogForm((f) => ({ ...f, date_of_birth: v }))} />
                <Field label="Pedigree (ROI)" value={dogForm.pedigree_number} onChange={(v) => setDogForm((f) => ({ ...f, pedigree_number: v }))} placeholder="ROI 12345" />
                <Field label="Microchip" value={dogForm.microchip_number} onChange={(v) => setDogForm((f) => ({ ...f, microchip_number: v }))} placeholder="380..." />
              </div>

              {/* Titles */}
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Titoli</label>
                <div className="flex flex-wrap gap-2">
                  {DOG_TITLES.map((title) => (
                    <button key={title} type="button"
                      onClick={() => setDogForm((f) => ({ ...f, titles: f.titles.includes(title) ? f.titles.filter((t) => t !== title) : [...f.titles, title] }))}
                      className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${dogForm.titles.includes(title) ? "bg-primary text-white border-primary" : "border-border text-muted-foreground hover:border-primary"}`}>
                      {title}
                    </button>
                  ))}
                </div>
              </div>

              {/* Health Screenings */}
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Screening sanitari</label>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(HEALTH_SCREENING_TYPES).map(([key, config]) => (
                    <div key={key}>
                      <label className="text-xs text-muted-foreground mb-1 block">{config.label}</label>
                      <select
                        value={dogForm.health_screenings[key] ?? ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          setDogForm((f) => {
                            const hs = { ...f.health_screenings };
                            if (val) hs[key] = val; else delete hs[key];
                            return { ...f, health_screenings: hs };
                          });
                        }}
                        className="w-full border border-border rounded-lg px-2 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
                      >
                        <option value="">Non effettuato</option>
                        {config.grades.map((g) => <option key={g} value={g}>{g}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={dogForm.dna_deposited} onChange={(e) => setDogForm((f) => ({ ...f, dna_deposited: e.target.checked }))} className="rounded" />
                  DNA depositato
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={dogForm.is_external} onChange={(e) => setDogForm((f) => ({ ...f, is_external: e.target.checked }))} className="rounded" />
                  Monta esterna
                </label>
              </div>
              {dogForm.is_external && (
                <Field label="Allevamento di provenienza" value={dogForm.external_kennel_name} onChange={(v) => setDogForm((f) => ({ ...f, external_kennel_name: v }))} placeholder="Nome allevamento" />
              )}

              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Foto</label>
                <ImageUpload images={dogForm.photo_url ? [dogForm.photo_url] : []} onChange={(imgs) => setDogForm((f) => ({ ...f, photo_url: imgs[0] ?? "" }))} maxImages={1} folder="breeding-dogs" />
              </div>

              <Field label="Note" value={dogForm.notes} onChange={(v) => setDogForm((f) => ({ ...f, notes: v }))} multiline placeholder="Informazioni aggiuntive sul soggetto..." />
            </div>
            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-border">
              <button onClick={() => setEditingDogId(null)} className="text-sm text-muted-foreground hover:text-foreground px-3 py-1.5">Annulla</button>
              <button onClick={saveDog} disabled={savingDog || !dogForm.name.trim()} className="text-sm bg-primary text-white px-4 py-1.5 rounded-lg hover:bg-primary-dark disabled:opacity-40 transition-colors font-medium">
                {savingDog ? "Salvataggio..." : editingDogId === "new" ? "Aggiungi" : "Salva"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
