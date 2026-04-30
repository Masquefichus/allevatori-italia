"use client";

import { useState, useRef, useEffect, lazy, Suspense } from "react";
import { useRouter } from "next/navigation";
import { slugify } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import {
  MapPin, Star, CheckCircle, Facebook, Instagram, ExternalLink,
  Dog, Pencil, X, Save, Loader2, Heart, Camera, Plus, Trash2, ArrowLeft, ArrowRight, Crop, GripVertical,
  GraduationCap, Home, Mail, Phone, Globe, CheckCircle2,
} from "lucide-react";
import Card, { CardContent, CardHeader } from "@/components/ui/Card";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, useSortable, rectSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Button from "@/components/ui/Button";
import Rating from "@/components/ui/Rating";
import { SITE_NAME, DOG_TITLES, DOG_TITOLI_ESPOSITIVI, DOG_CERTIFICATI_ESPOSITIVI, DOG_TITOLI_LAVORO, DOG_CERTIFICATI_LAVORO, DOG_TITOLI_ENCI, HEALTH_SCREENING_TYPES, HEALTH_SOURCE_LABELS } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";
const RichTextEditor = lazy(() => import("@/components/ui/RichTextEditor"));
import ImageUpload from "@/components/ui/ImageUpload";
const ImageCropModal = lazy(() => import("@/components/ui/ImageCropModal"));
import { useAuth } from "@/components/auth/AuthProvider";
import { getClubBySlug, getClubsForFciId, type BreedClub } from "@/lib/breed-clubs";
import { razze } from "@/data/razze";
import { regioni } from "@/data/regioni";

interface Trainer {
  id: string; user_id: string; slug: string; name: string;
  description: string | null; region: string | null; city: string | null;
  phone: string | null; email_public: string | null; website: string | null;
  logo_url: string | null; courses_text: string | null; course_types: string[] | null;
}
interface Boarding {
  id: string; user_id: string; slug: string; name: string;
  description: string | null; region: string | null; city: string | null;
  phone: string | null; email_public: string | null; website: string | null;
  logo_url: string | null; pension_text: string | null;
}
type TabId = "chi-siamo" | "riproduttori" | "cucciolate" | "attesa" | "corsi" | "prenotazioni" | "recensioni";

interface Breed { id: string; name_it: string; slug: string; is_working_breed?: boolean; }
interface Puppy {
  id: string; litter_id: string; name: string | null;
  sex: "maschio" | "femmina"; color: string | null;
  status: "disponibile" | "prenotato" | "venduto";
  photo_url: string | null; price: number | null;
  price_on_request: boolean; microchip_number: string | null;
  notes: string | null; sort_order: number;
}
interface Litter {
  id: string; breeder_id: string; breed_id: string | null;
  mother_id: string; father_id: string | null;
  is_external_father: boolean;
  external_father_name: string | null;
  external_father_kennel: string | null;
  external_father_breed_id: string | null;
  external_father_color: string | null;
  external_father_pedigree_number: string | null;
  external_father_photo_url: string | null;
  external_father_titles: string[];
  external_father_health_screenings: Record<string, string>;
  name: string; litter_date: string | null;
  pedigree_included: boolean; vaccinated: boolean; microchipped: boolean;
  images: string[]; status: string; notes: string | null;
  puppies: Puppy[];
  mother?: BreedingDog;
  father?: BreedingDog;
}
interface Review {
  id: string; rating: number; title: string | null; content: string | null;
  created_at: string; author: { full_name: string } | null;
}
interface Breeder {
  id: string; user_id: string | null; kennel_name: string; slug: string;
  description: string | null; city: string | null; province: string | null;
  region: string | null; address: string | null; show_address: boolean; phone: string | null;
  email_public: string | null; whatsapp: string | null; website: string | null;
  facebook_url: string | null; instagram_url: string | null;
  enci_number: string | null; enci_verified: boolean; fci_affiliated: boolean;
  affisso: string | null; breed_club_memberships: string[] | null;
  year_established: number | null; logo_url: string | null;
  cover_image_url: string | null; gallery_urls: string[] | null;
  is_premium: boolean; average_rating: number; review_count: number;
  breed_ids: string[] | null; logo_position: string | null;
  cover_image_position: string | null;
}

interface BreedingDog {
  id: string; breeder_id: string; name: string; call_name: string | null; affisso: string | null; variety: string | null;
  breed_id: string | null; sex: "maschio" | "femmina";
  date_of_birth: string | null; pedigree_number: string | null;
  microchip_number: string | null; color: string | null;
  titles: string[]; health_screenings: Record<string, string>;
  dna_deposited: boolean; photo_url: string | null; gallery_urls: string[];
  is_external: boolean; external_kennel_name: string | null;
  notes: string | null; sort_order: number;
}

interface Props {
  urlRole: "allevatore" | "addestratore" | "pensione";
  breeder: Breeder | null;
  breeds: Breed[];
  allBreeds: Breed[];
  litters: Litter[];
  breedingDogs: BreedingDog[];
  reviews: Review[];
  trainer: Trainer | null;
  boarding: Boarding | null;
  ownerUserId: string | null;
  initialTab: TabId;
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
      <button {...attributes} {...listeners} className="absolute top-1 left-1 w-6 h-6 rounded bg-white/90 flex items-center justify-center" style={{ zIndex: 20, cursor: "grab" }}>
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
        <button {...attributes} {...listeners} className="absolute top-2 left-2 w-7 h-7 rounded-lg bg-white/90 flex items-center justify-center" style={{ cursor: "grab" }}>
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </button>
        <div className="absolute top-2 right-2 flex gap-1">
          <button onClick={() => onEdit(dog)} className="w-7 h-7 rounded-lg bg-white/90 flex items-center justify-center"><Pencil className="h-3.5 w-3.5" /></button>
          <button onClick={() => { if (confirm("Eliminare questo riproduttore?")) onDelete(dog.id); }} className="w-7 h-7 rounded-lg bg-red-500/90 text-white flex items-center justify-center"><Trash2 className="h-3.5 w-3.5" /></button>
        </div>
      </div>
      <div className="p-3">
        <p className="font-medium text-foreground text-sm">{dog.name}{dog.affisso ? ` ${dog.affisso}` : ""}</p>
        <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
          <span>{breed?.name_it}</span>
          <span>·</span>
          <span>{dog.sex === "maschio" ? "Maschio" : "Femmina"}</span>
          {dog.color && <><span>·</span><span>{dog.color}</span></>}
          {dog.date_of_birth && (() => {
            const years = Math.floor((Date.now() - new Date(dog.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
            return <><span>·</span><span>{years === 1 ? "1 anno" : `${years} anni`}</span></>;
          })()}
        </div>
        {dog.titles.length > 0 && (() => {
          const titoliEnci = dog.titles.filter((t) => (DOG_TITOLI_ENCI as readonly string[]).includes(t));
          const titoli = dog.titles.filter((t) => ([...DOG_TITOLI_ESPOSITIVI, ...DOG_TITOLI_LAVORO] as readonly string[]).includes(t));
          const certificati = dog.titles.filter((t) => ([...DOG_CERTIFICATI_ESPOSITIVI, ...DOG_CERTIFICATI_LAVORO] as readonly string[]).includes(t));
          return (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {titoliEnci.map((t) => (
                <span key={t} className="text-[10px] font-medium bg-amber-600 text-white px-1.5 py-0.5 rounded-full">{t}</span>
              ))}
              {titoli.map((t) => (
                <span key={t} className="text-[10px] font-medium bg-primary text-white px-1.5 py-0.5 rounded-full">{t}</span>
              ))}
              {certificati.map((t) => (
                <span key={t} className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">{t}</span>
              ))}
            </div>
          );
        })()}
        {Object.keys(dog.health_screenings).filter((k) => !k.endsWith("_source") && !k.endsWith("_year")).length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {Object.entries(dog.health_screenings).filter(([k]) => !k.endsWith("_source") && !k.endsWith("_year")).map(([key, val]) => (
              <span key={key} className="text-[10px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded-full">
                {key.toUpperCase()}: {val}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
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
export default function ProProfileClient({
  urlRole, breeder: initialBreeder, breeds: initialBreeds, allBreeds,
  litters: initialLitters, breedingDogs: initialBreedingDogs, reviews,
  trainer, boarding, ownerUserId, initialTab, ChatModalComponent, ReviewFormComponent,
}: Props) {
  const { user } = useAuth();
  const router = useRouter();
  const isOwner = !!user && !!ownerUserId && user.id === ownerUserId;
  const [tab, setTab] = useState<TabId>(initialTab);

  const visibleTabs: { id: TabId; label: string }[] = [
    { id: "chi-siamo", label: "Chi siamo" },
    ...(initialBreeder ? [
      { id: "riproduttori" as const, label: "I nostri cani" },
      { id: "cucciolate" as const, label: "Cucciolate" },
      { id: "attesa" as const, label: "Lista d'attesa" },
    ] : []),
    ...(trainer ? [{ id: "corsi" as const, label: "Corsi" }] : []),
    ...(boarding ? [{ id: "prenotazioni" as const, label: "Pensione" }] : []),
    { id: "recensioni", label: "Recensioni" },
  ];
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Trainer/boarding edit state
  const [editingPro, setEditingPro] = useState(false);
  const [savingPro, setSavingPro] = useState(false);
  const [proSaveError, setProSaveError] = useState<string | null>(null);
  const proLogoInputRef = useRef<HTMLInputElement>(null);
  const [uploadingProLogo, setUploadingProLogo] = useState(false);
  const initPro = trainer ?? boarding;
  const COURSE_OPTIONS = ["Agility", "Soccorso", "Corse", "Flyball", "Dog dancing", "Juniorhandler", "Obedience", "Utilità e Difesa", "CAE-1", "Psicologia del cane", "Altri"] as const;
  const [editingCourses, setEditingCourses] = useState(false);
  const [savingCourses, setSavingCourses] = useState(false);
  const [coursesSaveError, setCoursesSaveError] = useState<string | null>(null);
  const [coursesText, setCoursesText] = useState(trainer?.courses_text ?? "");
  const [selectedCourseTypes, setSelectedCourseTypes] = useState<string[]>(trainer?.course_types ?? []);
  const [editingPension, setEditingPension] = useState(false);
  const [savingPension, setSavingPension] = useState(false);
  const [pensionSaveError, setPensionSaveError] = useState<string | null>(null);
  const [pensionText, setPensionText] = useState(boarding?.pension_text ?? "");
  const [proForm, setProForm] = useState({
    name: initPro?.name ?? "",
    description: initPro?.description ?? "",
    city: initPro?.city ?? "",
    region: initPro?.region ?? "",
    phone: initPro?.phone ?? "",
    email_public: initPro?.email_public ?? "",
    website: initPro?.website ?? "",
  });

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
  const [localLitters, setLocalLitters] = useState<Litter[]>(initialLitters);
  const [editingLitterId, setEditingLitterId] = useState<string | null>(null);
  const [expandedLitterId, setExpandedLitterId] = useState<string | null>(null);
  const [litterForm, setLitterForm] = useState({
    mother_id: "", father_id: "", is_external_father: false,
    external_father_name: "", external_father_kennel: "",
    external_father_breed_id: "",
    external_father_color: "", external_father_pedigree_number: "",
    external_father_photo_url: "", external_father_titles: [] as string[],
    external_father_health_screenings: {} as Record<string, string>,
    litter_date: "", pedigree_included: true, vaccinated: false,
    microchipped: false, images: [] as string[], status: "attivo" as string,
    notes: "",
    puppies: [] as Array<{
      id?: string; name: string; sex: "maschio" | "femmina"; color: string; variety: string;
      status: "disponibile" | "prenotato" | "venduto"; photo_url: string;
      price: string; price_on_request: boolean; microchip_number: string; notes: string;
    }>,
  });
  const [savingLitter, setSavingLitter] = useState(false);

  // Breeding dogs state
  const [localDogs, setLocalDogs] = useState<BreedingDog[]>(initialBreedingDogs);
  const [editingDogId, setEditingDogId] = useState<string | null>(null);
  const [editingDogsMode, setEditingDogsMode] = useState(false);
  const [selectedDogId, setSelectedDogId] = useState<string | null>(null); // for side panel
  const [dogForm, setDogForm] = useState({
    name: "", affisso: "", affisso_mode: "breeder" as "breeder" | "other" | "none",
    breed_id: "", variety: "", sex: "maschio" as "maschio" | "femmina",
    date_of_birth: "", pedigree_number: "", color: "",
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

      if (!breeder) return;
      await (supabase as any).from("breeder_profiles").update({ [field]: json.url }).eq("id", breeder.id);
      setBreeder((prev) => prev ? ({ ...prev, [field]: json.url }) : prev);
    } finally {
      setUploading(false);
    }
  }

  function startEditingPhotos() {
    if (!breeder) return;
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
    if (!breeder) return;
    const supabase = createClient();
    if (!supabase) return;
    // Clean empty editor output
    const desc = descriptionDraft === "<p></p>" ? null : descriptionDraft || null;
    await (supabase as any).from("breeder_profiles").update({ description: desc }).eq("id", breeder.id);
    setBreeder((prev) => prev ? ({ ...prev, description: desc }) : prev);
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
    if (!breeder) return;
    const supabase = createClient();
    if (!supabase) return;
    const cover = managedPhotos[0] ?? null;
    const galleryUrls = managedPhotos.slice(1);
    await (supabase as any).from("breeder_profiles").update({
      cover_image_url: cover,
      gallery_urls: galleryUrls,
    }).eq("id", breeder.id);
    setBreeder((prev) => prev ? ({ ...prev, cover_image_url: cover, gallery_urls: galleryUrls }) : prev);
    setEditingPhotos(false);
  }

  function getLitterName() {
    const mother = localDogs.find((d) => d.id === litterForm.mother_id);
    const motherName = mother?.name || "?";
    let fatherName: string;
    if (litterForm.is_external_father && !litterForm.father_id) {
      fatherName = litterForm.external_father_name || "?";
    } else {
      const father = localDogs.find((d) => d.id === litterForm.father_id);
      fatherName = father?.name || "?";
    }
    return `Cucciolata di ${motherName} e ${fatherName}`;
  }

  function openLitterEditor(litter?: Litter) {
    if (litter) {
      setEditingLitterId(litter.id);
      setLitterForm({
        mother_id: litter.mother_id, father_id: litter.father_id ?? "",
        is_external_father: litter.is_external_father,
        external_father_name: litter.external_father_name ?? "",
        external_father_kennel: litter.external_father_kennel ?? "",
        external_father_breed_id: litter.external_father_breed_id ?? "",
        external_father_color: litter.external_father_color ?? "",
        external_father_pedigree_number: litter.external_father_pedigree_number ?? "",
        external_father_photo_url: litter.external_father_photo_url ?? "",
        external_father_titles: litter.external_father_titles ?? [],
        external_father_health_screenings: litter.external_father_health_screenings ?? {},
        litter_date: litter.litter_date ?? "", pedigree_included: litter.pedigree_included,
        vaccinated: litter.vaccinated, microchipped: litter.microchipped,
        images: litter.images ?? [], status: litter.status, notes: litter.notes ?? "",
        puppies: (litter.puppies ?? []).map((p) => ({
          id: p.id, name: p.name ?? "", sex: p.sex, color: p.color ?? "", variety: (p as any).variety ?? "",
          status: p.status, photo_url: p.photo_url ?? "", price: p.price?.toString() ?? "",
          price_on_request: p.price_on_request, microchip_number: p.microchip_number ?? "", notes: p.notes ?? "",
        })),
      });
    } else {
      setEditingLitterId("new");
      setLitterForm({
        mother_id: "", father_id: "", is_external_father: false,
        external_father_name: "", external_father_kennel: "",
        external_father_breed_id: "",
        external_father_color: "", external_father_pedigree_number: "",
        external_father_photo_url: "", external_father_titles: [],
        external_father_health_screenings: {},
        litter_date: "", pedigree_included: true, vaccinated: false,
        microchipped: false, images: [], status: "attivo", notes: "",
        puppies: [],
      });
    }
  }

  async function saveLitter() {
    if (!litterForm.mother_id) return;
    if (!litterForm.is_external_father && !litterForm.father_id) return;
    if (litterForm.is_external_father && !litterForm.external_father_name.trim()) return;
    setSavingLitter(true);
    try {
      const supabase = createClient();
      if (!supabase) return;
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const mother = localDogs.find((d) => d.id === litterForm.mother_id);
      const litterName = getLitterName();
      const payload = {
        name: litterName,
        breed_id: mother?.breed_id || null,
        mother_id: litterForm.mother_id,
        father_id: litterForm.is_external_father ? null : (litterForm.father_id || null),
        is_external_father: litterForm.is_external_father,
        external_father_name: litterForm.is_external_father ? litterForm.external_father_name.trim() || null : null,
        external_father_kennel: litterForm.is_external_father ? litterForm.external_father_kennel.trim() || null : null,
        external_father_breed_id: litterForm.is_external_father ? litterForm.external_father_breed_id || null : null,
        external_father_color: litterForm.is_external_father ? litterForm.external_father_color.trim() || null : null,
        external_father_pedigree_number: litterForm.is_external_father ? litterForm.external_father_pedigree_number.trim() || null : null,
        external_father_photo_url: litterForm.is_external_father ? litterForm.external_father_photo_url || null : null,
        external_father_titles: litterForm.is_external_father ? litterForm.external_father_titles : [],
        external_father_health_screenings: litterForm.is_external_father ? litterForm.external_father_health_screenings : {},
        litter_date: litterForm.litter_date || null,
        pedigree_included: litterForm.pedigree_included,
        vaccinated: litterForm.vaccinated,
        microchipped: litterForm.microchipped,
        images: litterForm.images,
        status: litterForm.status,
        notes: litterForm.notes.trim() || null,
        puppies: litterForm.puppies.map((p) => ({
          ...(p.id ? { id: p.id } : {}),
          name: p.name?.trim() || null,
          sex: p.sex,
          color: p.color?.trim() || null,
          variety: p.variety?.trim() || null,
          status: p.status,
          photo_url: p.photo_url || null,
          price: p.price ? parseInt(p.price) : null,
          price_on_request: p.price_on_request,
          microchip_number: p.microchip_number?.trim() || null,
          notes: p.notes?.trim() || null,
        })),
      };
      if (editingLitterId === "new") {
        const res = await fetch("/api/litters", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (data.id) {
          // Re-attach mother/father references for local state
          data.mother = mother;
          data.father = litterForm.is_external_father ? undefined : localDogs.find((d) => d.id === litterForm.father_id);
          setLocalLitters((prev) => [data, ...prev]);
        }
      } else {
        const res = await fetch(`/api/litters/${editingLitterId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (data.id) setLocalLitters((prev) => prev.map((l) => (l.id === data.id ? data : l)));
      }
      setEditingLitterId(null);
    } finally {
      setSavingLitter(false);
    }
  }

  async function deleteLitter(id: string) {
    const supabase = createClient();
    if (!supabase) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    await fetch(`/api/litters/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    setLocalLitters((prev) => prev.filter((l) => l.id !== id));
  }

  // ── Breeding Dogs CRUD ──────────────────────────────────────────────
  function openDogEditor(dog?: BreedingDog) {
    if (dog) {
      // Determine affisso mode from stored data
      let affisso_mode: "breeder" | "other" | "none" = "none";
      if (dog.affisso) {
        affisso_mode = dog.affisso === breeder?.affisso ? "breeder" : "other";
      } else if (breeder?.affisso && !dog.affisso) {
        affisso_mode = "none";
      }
      setEditingDogId(dog.id);
      setDogForm({
        name: dog.name, affisso: dog.affisso ?? "", affisso_mode,
        breed_id: dog.breed_id ?? "", variety: dog.variety ?? "",
        sex: dog.sex, date_of_birth: dog.date_of_birth ?? "",
        pedigree_number: dog.pedigree_number ?? "",
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
        name: "", affisso: breeder?.affisso ?? "", affisso_mode: breeder?.affisso ? "breeder" : "none",
        breed_id: "", variety: "", sex: "maschio",
        date_of_birth: "", pedigree_number: "", color: "",
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
      const resolvedAffisso = dogForm.affisso_mode === "none" ? null : dogForm.affisso.trim() || null;
      const payload = {
        name: dogForm.name.trim(),
        affisso: resolvedAffisso,
        breed_id: dogForm.breed_id || null,
        variety: dogForm.variety.trim() || null,
        sex: dogForm.sex,
        date_of_birth: dogForm.date_of_birth || null,
        pedigree_number: dogForm.pedigree_number.trim() || null,
        color: dogForm.color.trim() || null,
        titles: dogForm.pedigree_number.trim() ? dogForm.titles : [],
        health_screenings: dogForm.health_screenings,
        dna_deposited: dogForm.pedigree_number.trim() ? dogForm.dna_deposited : false,
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
    if (!user || isOwner || !initialBreeder) return;
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
  }, [user, isOwner, initialBreeder]);

  async function toggleFavorite() {
    if (!user) { window.location.href = `/accedi?redirect=${window.location.pathname}`; return; }
    if (!initialBreeder) return;
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

  async function removeRole(role: string) {
    const labels: Record<string, string> = { allevatore: "Allevatore", addestratore: "Addestratore", pensione: "Pensione" };
    const warn = role === "allevatore"
      ? "Sei sicuro? Rimuovendo il ruolo Allevatore eliminerai tutti i dati dell'allevamento (cani, cucciolate, recensioni). Questa operazione è irreversibile."
      : `Sei sicuro di voler rimuovere il ruolo ${labels[role]}?`;
    if (!confirm(warn)) return;

    const supabase = createClient();
    if (!supabase) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const tableMap: Record<string, string> = {
      allevatore: "breeder_profiles",
      addestratore: "trainer_profiles",
      pensione: "boarding_profiles",
    };
    await Promise.all([
      (supabase as any).from(tableMap[role]).delete().eq("user_id", session.user.id),
      (supabase as any).from("profile_roles").delete().eq("profile_id", session.user.id).eq("role", role),
    ]);

    // If we removed the role this URL was built around, go to dashboard
    if (role === urlRole) {
      router.push("/dashboard");
    } else {
      router.refresh();
    }
  }

  const ROLE_COPY: Record<string, { label: string; blurb: string }> = {
    allevatore: { label: "Allevatore", blurb: "Registra il tuo allevamento per pubblicare cucciolate e gestire riproduttori." },
    addestratore: { label: "Addestratore", blurb: "Offri corsi di addestramento, educazione di base e discipline sportive." },
    pensione: { label: "Pensione per cani", blurb: "Offri servizi di pensione, dog sitting e pet hotel." },
  };

  const [confirmingRole, setConfirmingRole] = useState<string | null>(null);
  const [addingRole, setAddingRole] = useState(false);
  const [addError, setAddError] = useState("");
  const [addDone, setAddDone] = useState(false);

  async function addRole(role: string) {
    setAddError("");
    setAddingRole(true);
    const supabase = createClient();
    if (!supabase) { setAddError("Supabase non configurato."); setAddingRole(false); return; }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setAddError("Sessione non valida. Riaccedi."); setAddingRole(false); return; }

    const { error: roleError } = await supabase
      .from("profile_roles")
      .insert({ profile_id: user.id, role, is_active: true, is_approved: true });
    if (roleError && roleError.code !== "23505") {
      setAddError(roleError.message); setAddingRole(false); return;
    }

    if (role !== "allevatore") {
      const table = role === "addestratore" ? "trainer_profiles" : "boarding_profiles";
      const { data: breederRow } = await (supabase as any)
        .from("breeder_profiles").select("kennel_name, slug, region, province, city").eq("user_id", user.id).maybeSingle();
      const { data: profileRow } = await (supabase as any)
        .from("profiles").select("full_name").eq("id", user.id).single();
      const baseName = breederRow?.kennel_name ?? profileRow?.full_name ?? "Profilo";
      const baseSlug = breederRow?.slug ?? slugify(baseName);
      const { data: existing } = await (supabase as any).from(table).select("id").eq("slug", baseSlug).maybeSingle();
      const finalSlug = existing ? `${baseSlug}-${user.id.slice(0, 8)}` : baseSlug;
      const { error: profileError } = await (supabase as any).from(table).insert({
        user_id: user.id, name: baseName, slug: finalSlug,
        region: breederRow?.region ?? null, province: breederRow?.province ?? null, city: breederRow?.city ?? null,
      });
      if (profileError && profileError.code !== "23505") {
        setAddError(profileError.message); setAddingRole(false); return;
      }
    }

    setAddDone(true);
    setAddingRole(false);
    router.refresh();
  }

  const [breeder, setBreeder] = useState<Breeder | null>(initialBreeder);
  const [breeds, setBreeds] = useState(initialBreeds);

  // Photo repositioning (logo only)
  const [repositioning, setRepositioning] = useState<"logo" | null>(null);
  const [logoPos, setLogoPos] = useState<{ x: number; y: number }>(() => {
    const parts = (initialBreeder?.logo_position ?? "50% 50%").split(" ");
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
    if (!breeder) return;
    const supabase = createClient();
    if (!supabase) return;
    const value = `${logoPos.x.toFixed(1)}% ${logoPos.y.toFixed(1)}%`;
    await (supabase as any).from("breeder_profiles").update({ logo_position: value }).eq("id", breeder.id);
    setBreeder((prev) => prev ? ({ ...prev, logo_position: value }) : prev);
    setRepositioning(null);
  }

  const [form, setForm] = useState({
    kennel_name: initialBreeder?.kennel_name ?? "",
    description: initialBreeder?.description ?? "",
    enci_number: initialBreeder?.enci_number ?? "",
    year_established: initialBreeder?.year_established?.toString() ?? "",
    region: initialBreeder?.region ?? "",
    city: initialBreeder?.city ?? "",
    province: initialBreeder?.province ?? "",
    address: initialBreeder?.address ?? "",
    show_address: initialBreeder?.show_address ?? false,
    phone: initialBreeder?.phone ?? "",
    whatsapp: initialBreeder?.whatsapp ?? "",
    email_public: initialBreeder?.email_public ?? "",
    website: initialBreeder?.website ?? "",
    facebook_url: initialBreeder?.facebook_url ?? "",
    instagram_url: initialBreeder?.instagram_url ?? "",
    affisso: initialBreeder?.affisso ?? (null as unknown as string),
  });
  const [selectedBreedIds, setSelectedBreedIds] = useState<string[]>(initialBreeder?.breed_ids ?? []);
  const [selectedClubSlugs, setSelectedClubSlugs] = useState<string[]>(initialBreeder?.breed_club_memberships ?? []);

  function startEditing() {
    if (!breeder) return;
    setForm({
      kennel_name: breeder.kennel_name ?? "",
      description: breeder.description ?? "",
      enci_number: breeder.enci_number ?? "",
      year_established: breeder.year_established?.toString() ?? "",
      region: breeder.region ?? "",
      city: breeder.city ?? "",
      province: breeder.province ?? "",
      address: breeder.address ?? "",
      show_address: breeder.show_address ?? false,
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
    if (!breeder) return;
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
      address: form.address.trim() || null,
      show_address: form.show_address,
      year_established: form.year_established ? parseInt(form.year_established) : null,
      breed_ids: selectedBreedIds,
      slug: newSlug,
      affisso: form.affisso?.trim() || null,
      enci_number: form.enci_number.trim() || null,
      phone: form.phone.trim() || null,
      whatsapp: form.whatsapp.trim() || null,
      email_public: form.email_public.trim() || null,
      website: form.website.trim() || null,
      facebook_url: form.facebook_url.trim() || null,
      instagram_url: form.instagram_url.trim() || null,
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

    setBreeder((prev) => prev ? ({ ...prev, ...updates }) : prev);
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

  async function saveProProfile() {
    if (!initPro) return;
    const supabase = createClient();
    if (!supabase) return;
    setSavingPro(true);
    setProSaveError(null);
    const table = trainer ? "trainer_profiles" : "boarding_profiles";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).from(table).update({
      name: proForm.name.trim(),
      description: proForm.description.trim() || null,
      city: proForm.city.trim() || null,
      region: proForm.region.trim() || null,
      phone: proForm.phone.trim() || null,
      email_public: proForm.email_public.trim() || null,
      website: proForm.website.trim() || null,
    }).eq("id", initPro.id);
    if (error) { setProSaveError(error.message); setSavingPro(false); return; }
    setEditingPro(false);
    setSavingPro(false);
    router.refresh();
  }

  async function uploadProLogo(file: File) {
    if (!initPro) return;
    setUploadingProLogo(true);
    try {
      const supabase = createClient();
      if (!supabase) return;
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const fd = new FormData();
      fd.append("file", file);
      fd.append("bucket", "images");
      fd.append("folder", "logos");
      const res = await fetch("/api/upload", { method: "POST", headers: { Authorization: `Bearer ${session.access_token}` }, body: fd });
      const json = await res.json();
      if (!json.url) return;
      const table = trainer ? "trainer_profiles" : "boarding_profiles";
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from(table).update({ logo_url: json.url }).eq("id", initPro.id);
      router.refresh();
    } finally {
      setUploadingProLogo(false);
    }
  }

  async function saveCourses() {
    if (!trainer) return;
    const supabase = createClient();
    if (!supabase) return;
    setSavingCourses(true);
    setCoursesSaveError(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from("trainer_profiles")
      .update({ courses_text: coursesText.trim() || null, course_types: selectedCourseTypes })
      .eq("id", trainer.id);
    setSavingCourses(false);
    if (error) { setCoursesSaveError(error.message); return; }
    setEditingCourses(false);
    router.refresh();
  }

  async function savePension() {
    if (!boarding) return;
    const supabase = createClient();
    if (!supabase) return;
    setSavingPension(true);
    setPensionSaveError(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from("boarding_profiles")
      .update({ pension_text: pensionText.trim() || null })
      .eq("id", boarding.id);
    setSavingPension(false);
    if (error) { setPensionSaveError(error.message); return; }
    setEditingPension(false);
    router.refresh();
  }

  const activeLitters = localLitters.filter((l) => l.status === "attivo");
  const gallery: string[] = breeder?.gallery_urls ?? [];
  const initials = breeder?.kennel_name?.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase() ?? "P";
  const selectedRegionData = regioni.find((r) => r.nome === form.region);
  const provinceOptions = selectedRegionData?.province ?? [];
  const location = breeder ? [breeder.show_address ? breeder.address : null, breeder.city, breeder.province, breeder.region].filter(Boolean).join(", ") : "";

  const activeRoleIds = new Set([
    ...(initialBreeder ? ["allevatore"] : []),
    ...(trainer ? ["addestratore"] : []),
    ...(boarding ? ["pensione"] : []),
  ]);
  const roleDefs = [
    { id: "allevatore", label: "Allevatore", Icon: Dog },
    { id: "addestratore", label: "Addestratore", Icon: GraduationCap },
    { id: "pensione", label: "Pensione", Icon: Home },
  ];
  const roleBadges = (
    <div className="flex flex-wrap gap-1.5 mt-2">
      {(isOwner ? roleDefs : roleDefs.filter(r => activeRoleIds.has(r.id))).map(({ id, label, Icon }) =>
        activeRoleIds.has(id) ? (
          <span key={id} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-muted text-foreground">
            <Icon className="h-3 w-3" /> {label}
            {isOwner && (
              <button
                type="button"
                onClick={() => removeRole(id)}
                className="ml-0.5 opacity-40 hover:opacity-100 transition-opacity"
                title={`Rimuovi ${label}`}
              >
                <X className="h-2.5 w-2.5" />
              </button>
            )}
          </span>
        ) : (
          <button key={id} type="button"
            onClick={() => { setConfirmingRole(id); setAddDone(false); setAddError(""); }}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs border border-dashed border-border text-muted-foreground hover:text-foreground hover:border-primary transition-colors">
            <Plus className="h-3 w-3" /> {label}
          </button>
        )
      )}
    </div>
  );

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

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      {!initialBreeder && (() => {
        const pro = trainer ?? boarding!;
        const icon = trainer
          ? <GraduationCap className="h-10 w-10 text-muted-foreground" />
          : <Home className="h-10 w-10 text-muted-foreground" />;
        const proLocation = [pro.city, pro.region].filter(Boolean).join(", ");
        return (
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-start gap-4">
              {/* Logo with upload button for owner */}
              <div className="relative group shrink-0">
                <input ref={proLogoInputRef} type="file" accept="image/*" className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadProLogo(f); e.target.value = ""; }} />
                <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                  {pro.logo_url
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={pro.logo_url} alt={pro.name} className="h-20 w-20 object-cover" />
                    : icon}
                </div>
                {isOwner && (
                  <button onClick={() => proLogoInputRef.current?.click()} disabled={uploadingProLogo}
                    className="absolute inset-0 rounded-full flex items-center justify-center bg-black/0 group-hover:bg-black/40 transition-colors">
                    {uploadingProLogo
                      ? <Loader2 className="h-4 w-4 text-white animate-spin" />
                      : <Camera className="h-4 w-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />}
                  </button>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-2xl font-bold">{pro.name}</h1>
                {proLocation && (
                  <p className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" />{proLocation}
                  </p>
                )}
                {roleBadges}
              </div>
              {isOwner && !editingPro && (
                <button
                  onClick={() => { setProForm({ name: pro.name, description: pro.description ?? "", city: pro.city ?? "", region: pro.region ?? "", phone: pro.phone ?? "", email_public: pro.email_public ?? "", website: pro.website ?? "" }); setEditingPro(true); setTab("chi-siamo"); }}
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 shrink-0 mt-1"
                >
                  <Pencil className="h-3 w-3" /> Modifica
                </button>
              )}
            </div>
          </div>
        );
      })()}

      {/* ── Header: profile pic + name + info (breeder only) ─────────────── */}
      {initialBreeder && <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-2">
        <div className="relative flex items-start gap-5">
          {/* Edit/Save buttons moved to right-side column below */}

          {/* Profile photo */}
          <div className="relative group shrink-0 w-20 h-20 md:w-24 md:h-24">
            <input ref={logoInputRef} type="file" accept="image/*" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadPhoto(f, "logo_url", setUploadingLogo); e.target.value = ""; }} />
            <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-full bg-primary overflow-hidden flex items-center justify-center text-white text-xl md:text-2xl font-bold">
              {breeder?.logo_url
                ? <Image src={breeder.logo_url} alt={breeder!.kennel_name} fill draggable={false}
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
                          {club.name}
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
                <Field label="Città" value={form.city} onChange={(v) => setForm({ ...form, city: v })} />
                <div>
                  <Field label="Indirizzo" value={form.address} onChange={(v) => setForm({ ...form, address: v })} />
                  <label className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground cursor-pointer">
                    <input type="checkbox" className="rounded" checked={form.show_address} onChange={(e) => setForm({ ...form, show_address: e.target.checked })} />
                    Mostra indirizzo sul profilo pubblico
                  </label>
                </div>
                <Field label="Anno di fondazione" type="number" value={form.year_established} onChange={(v) => setForm({ ...form, year_established: v })} />
                <Field label="Numero ENCI" value={form.enci_number} onChange={(v) => setForm({ ...form, enci_number: v })} />
                <div className="pt-2 mt-2 border-t border-border">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Contatti</p>
                  <div className="space-y-2">
                    <Field label="Telefono" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
                    <Field label="WhatsApp" value={form.whatsapp} onChange={(v) => setForm({ ...form, whatsapp: v })} />
                    <Field label="Email pubblica" type="email" value={form.email_public} onChange={(v) => setForm({ ...form, email_public: v })} />
                    <Field label="Sito web" value={form.website} onChange={(v) => setForm({ ...form, website: v })} placeholder="https://" />
                    <Field label="Facebook" value={form.facebook_url} onChange={(v) => setForm({ ...form, facebook_url: v })} placeholder="https://facebook.com/..." />
                    <Field label="Instagram" value={form.instagram_url} onChange={(v) => setForm({ ...form, instagram_url: v })} placeholder="https://instagram.com/..." />
                  </div>
                </div>
              </div>
            ) : (
              <>
                <h1 className="text-xl md:text-2xl font-semibold text-foreground leading-tight">{breeder!.kennel_name}</h1>
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
                {breeder!.affisso && (
                  <p className="text-sm text-primary font-medium mt-1 flex items-center gap-1">
                    <CheckCircle className="h-3.5 w-3.5" />
                    Affisso: {breeder!.affisso}
                  </p>
                )}
                {breeder!.enci_number && (
                  <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                    <CheckCircle className="h-3.5 w-3.5" />
                    ENCI n° {breeder!.enci_number}
                  </p>
                )}
                {(breeder!.breed_club_memberships ?? []).length > 0 && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Membro di {(breeder!.breed_club_memberships ?? []).map((slug, i, arr) => {
                      const club = getClubBySlug(slug);
                      const name = club?.name ?? slug;
                      return <span key={slug}>{club?.website ? <a href={club.website} target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">{name}</a> : name}{i < arr.length - 1 ? ", " : ""}</span>;
                    })}
                  </p>
                )}
                {location && (
                  <p className="flex items-center gap-1 mt-1.5 text-sm text-muted-foreground"><MapPin className="h-3.5 w-3.5" />{location}</p>
                )}
                {breeder!.year_established && (
                  <p className="text-sm text-muted-foreground mt-0.5">Dal {breeder!.year_established}</p>
                )}
                {breeder!.review_count > 0 && (
                  <p className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
                    <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                    {breeder!.average_rating.toFixed(1)} ({breeder!.review_count})
                  </p>
                )}
                {roleBadges}
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
            {!editing && (breeder!.affisso || (breeder!.breed_club_memberships ?? []).length > 0) && (
              <div className="flex items-center gap-3">
                {breeder!.affisso && (
                  <>
                    <a href="https://www.enci.it" target="_blank" rel="noopener noreferrer" title="ENCI">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src="/images/enci-logo.png" alt="ENCI" className="h-14 object-contain" style={{ mixBlendMode: "multiply" }} />
                    </a>
                    <a href="https://www.fci.be" target="_blank" rel="noopener noreferrer" title="FCI">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src="/images/fci-logo.png" alt="FCI" className="h-14 object-contain" style={{ mixBlendMode: "multiply" }} />
                    </a>
                  </>
                )}
                {(breeder!.breed_club_memberships ?? []).map((slug) => {
                  const club = getClubBySlug(slug);
                  if (!club) return null;
                  if (!club?.logo) return null;
                  return (
                    <a key={slug} href={club.website ?? undefined} target="_blank" rel="noopener noreferrer" title={club.name}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={club.logo} alt={club.name} className="h-14 object-contain" style={{ mixBlendMode: "multiply" }} />
                    </a>
                  );
                })}
              </div>
            )}
            {!isOwner && (
              <div className="flex items-center gap-2 mt-2">
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
      </div>}

      {/* ── Tabs ─────────────────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex border-b border-border mt-4">
            {visibleTabs.map((t) => (
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

        {/* ── TAB: Chi siamo ─────────────────────────────────────────────── */}
        {tab === "chi-siamo" && !initialBreeder && (() => {
          const pro = trainer ?? boarding!;
          const hasContacts = pro.phone || pro.email_public || pro.website;
          return (
            <div className="space-y-6">
              {proSaveError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-lg">{proSaveError}</div>
              )}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <h2 className="font-semibold">Chi siamo</h2>
                    {isOwner && !editingPro && (
                      <button
                        onClick={() => { setProForm({ name: pro.name, description: pro.description ?? "", city: pro.city ?? "", region: pro.region ?? "", phone: pro.phone ?? "", email_public: pro.email_public ?? "", website: pro.website ?? "" }); setEditingPro(true); }}
                        className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                      >
                        <Pencil className="h-3 w-3" /> Modifica
                      </button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {editingPro ? (
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm text-muted-foreground mb-1 block">Nome</label>
                        <input
                          type="text"
                          value={proForm.name}
                          onChange={(e) => setProForm({ ...proForm, name: e.target.value })}
                          className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                        />
                      </div>
                      <div>
                        <label className="text-sm text-muted-foreground mb-1 block">Descrizione</label>
                        <textarea
                          value={proForm.description}
                          onChange={(e) => setProForm({ ...proForm, description: e.target.value })}
                          rows={5}
                          className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-y"
                          placeholder="Racconta la tua esperienza, i tuoi metodi, le specializzazioni..."
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-sm text-muted-foreground mb-1 block">Regione</label>
                          <select value={proForm.region} onChange={(e) => setProForm({ ...proForm, region: e.target.value })}
                            className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30">
                            <option value="">Regione</option>
                            {regioni.map((r) => <option key={r.slug} value={r.nome}>{r.nome}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="text-sm text-muted-foreground mb-1 block">Città</label>
                          <input type="text" value={proForm.city} onChange={(e) => setProForm({ ...proForm, city: e.target.value })}
                            className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                        </div>
                      </div>
                      <div className="pt-2 border-t border-border space-y-2">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Contatti</p>
                        {[
                          { label: "Telefono", key: "phone" as const, type: "tel" },
                          { label: "Email pubblica", key: "email_public" as const, type: "email" },
                          { label: "Sito web", key: "website" as const, type: "url" },
                        ].map(({ label, key, type }) => (
                          <div key={key}>
                            <label className="text-sm text-muted-foreground mb-1 block">{label}</label>
                            <input type={type} value={proForm[key]} onChange={(e) => setProForm({ ...proForm, [key]: e.target.value })}
                              className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-2 pt-1">
                        <Button size="sm" onClick={saveProProfile} isLoading={savingPro}>
                          <Save className="h-3.5 w-3.5" /> Salva
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setEditingPro(false)} disabled={savingPro}>
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {pro.description
                        ? <p className="text-sm text-foreground whitespace-pre-wrap">{pro.description}</p>
                        : <p className="text-sm text-muted-foreground italic">{isOwner ? "Nessuna descrizione. Clicca Modifica per aggiungerla." : "Descrizione non ancora disponibile."}</p>}
                    </>
                  )}
                </CardContent>
              </Card>
              {(!editingPro && hasContacts) && (
                <Card>
                  <CardHeader><h2 className="font-semibold">Contatti</h2></CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    {pro.phone && <p className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" />{pro.phone}</p>}
                    {pro.email_public && <p className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground" />{pro.email_public}</p>}
                    {pro.website && (
                      <p className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-muted-foreground" />
                        <a href={pro.website} target="_blank" rel="noopener noreferrer" className="underline">{pro.website}</a>
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          );
        })()}
        {tab === "chi-siamo" && initialBreeder && (
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
              ) : breeder!.description ? (
                <div className="relative">
                  {isOwner && (
                    <button onClick={() => { setDescriptionDraft(breeder!.description ?? ""); setEditingDescription(true); }}
                      className="absolute top-0 right-0 text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                      <Pencil className="h-3 w-3" /> Modifica
                    </button>
                  )}
                  <div
                    className="prose prose-sm max-w-none text-muted-foreground [&_h1]:text-foreground [&_h1]:text-xl [&_h1]:font-bold [&_h1]:mt-4 [&_h1]:mb-2 [&_h2]:text-foreground [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:mt-3 [&_h2]:mb-1.5 [&_p]:my-1.5 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:my-0.5 [&_a]:text-primary [&_a]:underline [&_img]:rounded-xl [&_img]:my-3 [&_strong]:text-foreground"
                    dangerouslySetInnerHTML={{ __html: breeder!.description! }}
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
                      <Image src={url} alt={`${breeder?.kennel_name ?? ""} ${i + 1}`} fill className="object-cover" />
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

            {/* Contatti */}
            {(breeder!.phone || breeder!.whatsapp || breeder!.email_public || breeder!.website || breeder!.facebook_url || breeder!.instagram_url) && (
              <Card>
                <CardHeader><h2 className="font-semibold">Contatti</h2></CardHeader>
                <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                  {breeder!.phone && (
                    <a href={`tel:${breeder!.phone}`} className="flex items-center gap-2 hover:text-primary transition-colors">
                      <Phone className="h-4 w-4 text-muted-foreground" />{breeder!.phone}
                    </a>
                  )}
                  {breeder!.whatsapp && (
                    <a href={`https://wa.me/${breeder!.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-primary transition-colors">
                      <Phone className="h-4 w-4 text-muted-foreground" />WhatsApp: {breeder!.whatsapp}
                    </a>
                  )}
                  {breeder!.email_public && (
                    <a href={`mailto:${breeder!.email_public}`} className="flex items-center gap-2 hover:text-primary transition-colors">
                      <Mail className="h-4 w-4 text-muted-foreground" />{breeder!.email_public}
                    </a>
                  )}
                  {breeder!.website && (
                    <a href={breeder!.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-primary transition-colors truncate">
                      <Globe className="h-4 w-4 text-muted-foreground" />{breeder!.website}
                    </a>
                  )}
                  {breeder!.facebook_url && (
                    <a href={breeder!.facebook_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-primary transition-colors">
                      <Facebook className="h-4 w-4 text-muted-foreground" />Facebook
                    </a>
                  )}
                  {breeder!.instagram_url && (
                    <a href={breeder!.instagram_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-primary transition-colors">
                      <Instagram className="h-4 w-4 text-muted-foreground" />Instagram
                    </a>
                  )}
                </CardContent>
              </Card>
            )}

          </div>
        )}

        {/* ── TAB: I nostri cani ─────────────────────────────────────────── */}
        {tab === "riproduttori" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">
                I nostri cani{localDogs.length > 0 ? ` (${localDogs.length})` : ""}
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
                <p className="text-sm">{isOwner ? "Non hai ancora aggiunto cani." : "Nessun cane registrato."}</p>
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
                      </div>
                      <div className="p-4">
                        <p className="font-medium text-foreground">{dog.name}{dog.affisso ? ` ${dog.affisso}` : ""}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {[breed?.name_it, dog.sex === "maschio" ? "Maschio" : "Femmina", dog.color, dog.date_of_birth ? (() => { const y = Math.floor((Date.now() - new Date(dog.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000)); return y === 1 ? "1 anno" : `${y} anni`; })() : null].filter(Boolean).join(" · ")}
                        </p>
                        {(dog.pedigree_number || dog.titles.length > 0) && (() => {
                          const titoliEnci = dog.titles.filter((t) => (DOG_TITOLI_ENCI as readonly string[]).includes(t));
                          const titoli = dog.titles.filter((t) => ([...DOG_TITOLI_ESPOSITIVI, ...DOG_TITOLI_LAVORO] as readonly string[]).includes(t));
                          const certificati = dog.titles.filter((t) => ([...DOG_CERTIFICATI_ESPOSITIVI, ...DOG_CERTIFICATI_LAVORO] as readonly string[]).includes(t));
                          return (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {dog.pedigree_number && <span className="text-[10px] font-medium bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded-full">Pedigree</span>}
                              {titoliEnci.map((t) => (
                                <span key={t} className="text-[10px] font-medium bg-amber-600 text-white px-1.5 py-0.5 rounded-full">{t}</span>
                              ))}
                              {titoli.map((t) => (
                                <span key={t} className="text-[10px] font-medium bg-primary text-white px-1.5 py-0.5 rounded-full">{t}</span>
                              ))}
                              {certificati.map((t) => (
                                <span key={t} className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">{t}</span>
                              ))}
                            </div>
                          );
                        })()}
                        {Object.keys(dog.health_screenings).filter((k) => !k.endsWith("_source") && !k.endsWith("_year")).length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {Object.entries(dog.health_screenings).filter(([k]) => !k.endsWith("_source") && !k.endsWith("_year")).map(([key, val]) => (
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
                {dog.gallery_urls && dog.gallery_urls.length > 0 && (
                  <div className="flex gap-1.5 px-4 pt-3 overflow-x-auto">
                    {dog.gallery_urls.map((url, i) => (
                      <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-muted cursor-pointer" onClick={() => setLightboxIndex(i)}>
                        <img src={url} alt="" className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                )}
                <div className="p-6 space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">{dog.name}{dog.affisso ? ` ${dog.affisso}` : ""}</h3>
                    <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                      <span>{breed?.name_it}{dog.variety ? ` — ${dog.variety}` : ""}</span>
                      <span>·</span>
                      <span>{dog.sex === "maschio" ? "Maschio ♂" : "Femmina ♀"}</span>
                    </div>
                  </div>
                  {(dog.color || dog.date_of_birth) && (
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      {dog.color && <div><span className="text-muted-foreground">Mantello</span><p className="font-medium">{dog.color}</p></div>}
                      {dog.date_of_birth && <div><span className="text-muted-foreground">Data di nascita</span><p className="font-medium">{new Date(dog.date_of_birth).toLocaleDateString("it-IT")}</p></div>}
                    </div>
                  )}
                  {dog.pedigree_number && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">Pedigree (ROI)</span>
                      <p className="font-medium">{dog.pedigree_number}</p>
                    </div>
                  )}
                  {dog.titles.length > 0 && (() => {
                    const titoliEnci = dog.titles.filter((t) => (DOG_TITOLI_ENCI as readonly string[]).includes(t));
                    const titoli = dog.titles.filter((t) => ([...DOG_TITOLI_ESPOSITIVI, ...DOG_TITOLI_LAVORO] as readonly string[]).includes(t));
                    const certificati = dog.titles.filter((t) => ([...DOG_CERTIFICATI_ESPOSITIVI, ...DOG_CERTIFICATI_LAVORO] as readonly string[]).includes(t));
                    return (
                      <div className="space-y-3">
                        {titoliEnci.length > 0 && (
                          <div>
                            <p className="text-sm text-muted-foreground mb-1.5">Titoli ENCI</p>
                            <div className="flex flex-wrap gap-1.5">
                              {titoliEnci.map((t) => <span key={t} className="text-xs font-medium bg-amber-600 text-white px-2.5 py-1 rounded-full">{t}</span>)}
                            </div>
                          </div>
                        )}
                        {titoli.length > 0 && (
                          <div>
                            <p className="text-sm text-muted-foreground mb-1.5">Titoli</p>
                            <div className="flex flex-wrap gap-1.5">
                              {titoli.map((t) => <span key={t} className="text-xs font-medium bg-primary text-white px-2.5 py-1 rounded-full">{t}</span>)}
                            </div>
                          </div>
                        )}
                        {certificati.length > 0 && (
                          <div>
                            <p className="text-sm text-muted-foreground mb-1.5">Certificati</p>
                            <div className="flex flex-wrap gap-1.5">
                              {certificati.map((t) => <span key={t} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{t}</span>)}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                  {Object.keys(dog.health_screenings).filter((k) => !k.endsWith("_source") && !k.endsWith("_year")).length > 0 && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1.5">Screening sanitari</p>
                      <div className="space-y-1">
                        {Object.entries(dog.health_screenings).filter(([k]) => !k.endsWith("_source") && !k.endsWith("_year")).map(([key, val]) => {
                          const type = HEALTH_SCREENING_TYPES[key as keyof typeof HEALTH_SCREENING_TYPES];
                          const source = dog.health_screenings[`${key}_source`];
                          const year = dog.health_screenings[`${key}_year`];
                          return (
                            <div key={key} className="flex items-center justify-between text-sm">
                              <span>{type?.label ?? key}</span>
                              <span className="font-medium text-emerald-700">{val}{source && source !== "veterinario" ? ` (${HEALTH_SOURCE_LABELS[source] ?? source})` : ""}{year ? ` — ${year}` : ""}</span>
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

        {/* ── TAB: Cucciolate ──────────────────────────────────────────────── */}
        {tab === "cucciolate" && (
          <div className="space-y-6">
            {isOwner && (
              <div className="flex justify-end">
                <Button size="sm" onClick={() => openLitterEditor()}><Plus className="h-4 w-4" /> Nuova cucciolata</Button>
              </div>
            )}
            {(() => {
              const visibleLitters = isOwner ? localLitters : activeLitters;
              return visibleLitters.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">
                  <Dog className="h-8 w-8 mx-auto mb-3 text-border" />
                  <p className="text-sm">{isOwner ? "Non hai ancora pubblicato cucciolate." : "Nessun cucciolo disponibile al momento."}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {visibleLitters.map((litter) => {
                    const breed = breeds.find((b) => b.id === litter.breed_id);
                    const isDraft = litter.status === "bozza";
                    const motherPhoto = litter.mother?.photo_url;
                    const fatherPhoto = litter.is_external_father ? litter.external_father_photo_url : litter.father?.photo_url;
                    const puppies = litter.puppies ?? [];
                    const available = puppies.filter((p) => p.status === "disponibile").length;
                    const reserved = puppies.filter((p) => p.status === "prenotato").length;
                    const sold = puppies.filter((p) => p.status === "venduto").length;
                    const isExpanded = expandedLitterId === litter.id;

                    const coverImage = litter.images?.[0] ?? null;
                    return (
                      <div key={litter.id} className={`bg-white rounded-2xl border overflow-hidden ${isDraft ? "border-dashed border-border" : "border-border"}`}>
                        {/* Litter card header */}
                        <button onClick={() => setExpandedLitterId(isExpanded ? null : litter.id)} className="w-full text-left hover:bg-muted/30 transition-colors">
                          {coverImage && (
                            <div className="relative aspect-[5/1] bg-muted">
                              <Image src={coverImage} alt={litter.name} fill className="object-cover" />
                              {isDraft && isOwner && <span className="absolute top-3 left-3 bg-amber-100 text-amber-700 text-[10px] font-medium px-2 py-0.5 rounded-full">Bozza</span>}
                            </div>
                          )}
                          <div className="p-4">
                            <div className="flex items-center gap-4">
                              {/* Parent photos */}
                              <div className="flex -space-x-3 shrink-0">
                                <div className="w-12 h-12 rounded-full border-2 border-white bg-muted overflow-hidden">
                                  {motherPhoto ? <img src={motherPhoto} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">M</div>}
                                </div>
                                <div className="w-12 h-12 rounded-full border-2 border-white bg-muted overflow-hidden">
                                  {fatherPhoto ? <img src={fatherPhoto} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">P</div>}
                                </div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="font-medium text-foreground truncate">{litter.name}</p>
                                  {isDraft && isOwner && !coverImage && <span className="bg-amber-100 text-amber-700 text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0">Bozza</span>}
                                </div>
                                <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                                  {breed && <span>{breed.name_it}</span>}
                                  {litter.litter_date && <span>· {new Date(litter.litter_date).toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" })}</span>}
                                </div>
                                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                  {available > 0 && <span className="text-[11px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">{available} disponibil{available === 1 ? "e" : "i"}</span>}
                                  {reserved > 0 && <span className="text-[11px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">{reserved} prenotat{reserved === 1 ? "o" : "i"}</span>}
                                  {sold > 0 && <span className="text-[11px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{sold} vendut{sold === 1 ? "o" : "i"}</span>}
                                  {puppies.length === 0 && <span className="text-[11px] text-muted-foreground">Nessun cucciolo inserito</span>}
                                </div>
                              </div>
                              <ArrowRight className={`h-4 w-4 text-muted-foreground shrink-0 transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                            </div>
                          </div>
                        </button>

                        {/* Expanded content */}
                        {isExpanded && (
                          <div className="border-t border-border">
                            {/* Litter details */}
                            <div className="p-4 space-y-4">
                              {/* Parent cards */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {[
                                  { label: "Madre", dog: litter.mother, photo: motherPhoto },
                                  { label: litter.is_external_father ? "Padre (Monta esterna)" : "Padre", dog: litter.is_external_father ? null : litter.father, photo: fatherPhoto, external: litter.is_external_father ? { name: litter.external_father_name, kennel: litter.external_father_kennel, color: litter.external_father_color } : null },
                                ].map(({ label, dog, photo, external }) => (
                                  <div key={label} className="bg-white rounded-lg border border-border overflow-hidden flex" onClick={() => dog && setSelectedDogId(dog.id)} style={{ cursor: dog ? "pointer" : "default" }}>
                                    <div className="w-28 shrink-0 bg-muted">
                                      {photo
                                        ? <img src={photo} alt="" className="w-full h-full object-cover" />
                                        : <div className="w-full h-full flex items-center justify-center text-xl text-muted-foreground">{dog?.sex === "maschio" ? "♂" : "♀"}</div>}
                                    </div>
                                    <div className="p-3 min-w-0 flex-1">
                                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>
                                      <p className="font-medium text-sm text-foreground mt-0.5 truncate">{dog ? `${dog.name}${dog.affisso ? ` ${dog.affisso}` : ""}` : external?.name}</p>
                                      {dog && (
                                        <p className="mt-0.5 text-[10px] text-muted-foreground">
                                          {[dog.sex === "maschio" ? "Maschio" : "Femmina", dog.color, dog.date_of_birth ? (() => { const y = Math.floor((Date.now() - new Date(dog.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000)); return y === 1 ? "1 anno" : `${y} anni`; })() : null].filter(Boolean).join(" · ")}
                                        </p>
                                      )}
                                      {external?.kennel && <p className="text-[10px] text-muted-foreground mt-0.5">Allevamento: {external.kennel}</p>}
                                      {dog && (dog.pedigree_number || dog.titles.length > 0) && (() => {
                                        const titoliEnci = dog.titles.filter((t) => (DOG_TITOLI_ENCI as readonly string[]).includes(t));
                                        const titoli = dog.titles.filter((t) => ([...DOG_TITOLI_ESPOSITIVI, ...DOG_TITOLI_LAVORO] as readonly string[]).includes(t));
                                        const certificati = dog.titles.filter((t) => ([...DOG_CERTIFICATI_ESPOSITIVI, ...DOG_CERTIFICATI_LAVORO] as readonly string[]).includes(t));
                                        return (
                                          <div className="flex flex-wrap gap-1 mt-1.5">
                                            {dog.pedigree_number && <span className="text-[9px] font-medium bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded-full">Pedigree</span>}
                                            {titoliEnci.map((t) => <span key={t} className="text-[9px] font-medium bg-amber-600 text-white px-1.5 py-0.5 rounded-full">{t}</span>)}
                                            {titoli.map((t) => <span key={t} className="text-[9px] font-medium bg-primary text-white px-1.5 py-0.5 rounded-full">{t}</span>)}
                                            {certificati.map((t) => <span key={t} className="text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">{t}</span>)}
                                          </div>
                                        );
                                      })()}
                                      {dog && Object.keys(dog.health_screenings).filter((k) => !k.endsWith("_source") && !k.endsWith("_year")).length > 0 && (
                                        <div className="flex flex-wrap gap-1 mt-1">
                                          {Object.entries(dog.health_screenings).filter(([k]) => !k.endsWith("_source") && !k.endsWith("_year")).map(([key, val]) => (
                                            <span key={key} className="text-[9px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded-full">{key.toUpperCase()}: {val}</span>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>

                              {/* Badges */}
                              <div className="flex flex-wrap gap-2">
                                {litter.pedigree_included && <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">Pedigree</span>}
                                {litter.vaccinated && <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full">Vaccinati</span>}
                                {litter.microchipped && <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">Microchippati</span>}
                              </div>

                              {litter.notes && <p className="text-sm text-muted-foreground">{litter.notes}</p>}

                              {/* Individual puppies */}
                              {puppies.length > 0 && (
                                <div>
                                  <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Cuccioli ({puppies.length})</p>
                                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                                    {puppies.map((puppy) => (
                                      <div key={puppy.id} className="bg-muted/30 rounded-xl border border-border p-3">
                                        {puppy.photo_url && (
                                          <div className="aspect-square rounded-lg overflow-hidden bg-muted mb-2">
                                            <img src={puppy.photo_url} alt={puppy.name ?? "Cucciolo"} className="w-full h-full object-cover" />
                                          </div>
                                        )}
                                        <div className="space-y-1">
                                          {puppy.name && <p className="text-sm font-medium text-foreground">{puppy.name}</p>}
                                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                            <span>{puppy.sex === "maschio" ? "♂" : "♀"}</span>
                                            {puppy.color && <span>· {puppy.color}</span>}
                                          </div>
                                          <span className={`inline-block text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                                            puppy.status === "disponibile" ? "bg-emerald-100 text-emerald-700" :
                                            puppy.status === "prenotato" ? "bg-amber-100 text-amber-700" :
                                            "bg-gray-100 text-gray-500"
                                          }`}>
                                            {puppy.status === "disponibile" ? "Disponibile" : puppy.status === "prenotato" ? "Prenotato" : "Venduto"}
                                          </span>
                                          {puppy.price != null && !puppy.price_on_request && (
                                            <p className="text-xs font-semibold text-foreground">{`\u20AC${puppy.price.toLocaleString("it-IT")}`}</p>
                                          )}
                                          {puppy.price_on_request && (
                                            <p className="text-xs text-muted-foreground">Prezzo su richiesta</p>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Owner actions */}
                              {isOwner && (
                                <div className="flex items-center gap-3 pt-2 border-t border-border">
                                  <button onClick={() => openLitterEditor(litter)} className="text-xs text-primary hover:underline">Modifica</button>
                                  <button onClick={() => { if (confirm("Eliminare questa cucciolata e tutti i cuccioli?")) deleteLitter(litter.id); }} className="text-xs text-red-500 hover:underline">Elimina</button>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
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

        {/* ── TAB: Corsi ─────────────────────────────────────────────────── */}
        {tab === "corsi" && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="font-semibold">Corsi</h2>
                {isOwner && !editingCourses && (
                  <button
                    onClick={() => { setCoursesText(trainer?.courses_text ?? ""); setSelectedCourseTypes(trainer?.course_types ?? []); setEditingCourses(true); }}
                    className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                  >
                    <Pencil className="h-3 w-3" /> Modifica
                  </button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {editingCourses ? (
                <div className="space-y-4">
                  {coursesSaveError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-lg">{coursesSaveError}</div>
                  )}
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Discipline offerte</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {COURSE_OPTIONS.map((opt) => (
                        <label key={opt} className="flex items-center gap-2 text-sm cursor-pointer select-none">
                          <input
                            type="checkbox"
                            className="rounded border-border"
                            checked={selectedCourseTypes.includes(opt)}
                            onChange={() => setSelectedCourseTypes((prev) =>
                              prev.includes(opt) ? prev.filter((c) => c !== opt) : [...prev, opt]
                            )}
                          />
                          {opt}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Note aggiuntive</p>
                    <textarea
                      value={coursesText}
                      onChange={(e) => setCoursesText(e.target.value)}
                      rows={5}
                      className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-y"
                      placeholder="Livelli, orari, prezzi, metodi di addestramento..."
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={saveCourses} isLoading={savingCourses}>
                      <Save className="h-3.5 w-3.5" /> Salva
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setEditingCourses(false)} disabled={savingCourses}>
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {(trainer?.course_types ?? []).length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {(trainer?.course_types ?? []).map((type) => (
                        <span key={type} className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                          {type}
                        </span>
                      ))}
                    </div>
                  )}
                  {trainer?.courses_text ? (
                    <p className="text-sm text-foreground whitespace-pre-wrap">{trainer.courses_text}</p>
                  ) : (trainer?.course_types ?? []).length === 0 ? (
                    <p className="text-sm text-muted-foreground italic">
                      {isOwner ? "Nessun corso ancora inserito. Clicca Modifica per aggiungere i tuoi corsi." : "Nessun corso disponibile al momento."}
                    </p>
                  ) : null}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* ── TAB: Prenotazioni ──────────────────────────────────────────── */}
        {tab === "prenotazioni" && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="font-semibold">Pensione</h2>
                {isOwner && !editingPension && (
                  <button
                    onClick={() => { setPensionText(boarding?.pension_text ?? ""); setEditingPension(true); }}
                    className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                  >
                    <Pencil className="h-3 w-3" /> Modifica
                  </button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {editingPension ? (
                <div className="space-y-3">
                  {pensionSaveError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-lg">{pensionSaveError}</div>
                  )}
                  <textarea
                    value={pensionText}
                    onChange={(e) => setPensionText(e.target.value)}
                    rows={8}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-y"
                    placeholder="Descrivi i tuoi servizi di pensione: disponibilità, prezzi, struttura, orari di accoglienza..."
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={savePension} isLoading={savingPension}>
                      <Save className="h-3.5 w-3.5" /> Salva
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setEditingPension(false)} disabled={savingPension}>
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ) : boarding?.pension_text ? (
                <p className="text-sm text-foreground whitespace-pre-wrap">{boarding.pension_text}</p>
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  {isOwner ? "Nessun contenuto ancora inserito. Clicca Modifica per descrivere i tuoi servizi." : "Nessuna informazione disponibile al momento."}
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* ── TAB: Recensioni ────────────────────────────────────────────── */}
        {tab === "recensioni" && !breeder && (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-sm text-muted-foreground italic">Le recensioni saranno presto disponibili.</p>
            </CardContent>
          </Card>
        )}
        {tab === "recensioni" && breeder && (
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

      {/* ── Add Role Modal ───────────────────────────────────────────────── */}
      {confirmingRole && (() => {
        const copy = ROLE_COPY[confirmingRole];
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
            onClick={() => { if (!addingRole) setConfirmingRole(null); }}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
              <div className="px-6 py-5 border-b border-border">
                <h2 className="text-xl font-bold">Aggiungi servizio: {copy.label}</h2>
                <p className="text-sm text-muted-foreground mt-1">{copy.blurb}</p>
              </div>
              <div className="p-6 space-y-4">
                {addDone ? (
                  <div className="flex items-start gap-3 p-4 rounded-lg bg-green-50 border border-green-200">
                    <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-green-900">Servizio aggiunto</p>
                      <p className="text-sm text-green-800 mt-0.5">
                        <strong>{copy.label}</strong> è ora attivo sul tuo profilo.
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50 border border-border">
                      <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <p className="text-sm text-muted-foreground">
                        Stai per aggiungere il ruolo <strong>{copy.label}</strong> al tuo account. Una volta confermato, potrai compilare i dettagli del servizio.
                      </p>
                    </div>
                    {addError && (
                      <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-lg">{addError}</div>
                    )}
                    <div className="flex gap-3">
                      <Button onClick={() => addRole(confirmingRole)} isLoading={addingRole}>
                        Aggiungi servizio
                      </Button>
                      <Button variant="outline" onClick={() => setConfirmingRole(null)} disabled={addingRole}>
                        Annulla
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        );
      })()}

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

      {/* ── Litter Editor Modal ──────────────────────────────────────────── */}
      {editingLitterId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setEditingLitterId(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h3 className="font-semibold text-lg">{editingLitterId === "new" ? "Nuova cucciolata" : "Modifica cucciolata"}</h3>
              <button onClick={() => setEditingLitterId(null)} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-6 space-y-6">
              {/* Section: Genitori */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-foreground uppercase tracking-wide">Genitori</h4>
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">Madre *</label>
                  <select
                    value={litterForm.mother_id}
                    onChange={(e) => setLitterForm((f) => ({ ...f, mother_id: e.target.value }))}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    <option value="">Seleziona fattrice</option>
                    {localDogs.filter((d) => d.sex === "femmina").map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <label className="text-sm text-muted-foreground">Padre *</label>
                    <label className="flex items-center gap-1.5 text-xs cursor-pointer ml-auto">
                      <input type="checkbox" checked={litterForm.is_external_father} onChange={(e) => setLitterForm((f) => ({ ...f, is_external_father: e.target.checked, father_id: "" }))} className="rounded" />
                      Monta esterna
                    </label>
                  </div>
                  {!litterForm.is_external_father ? (
                    <select
                      value={litterForm.father_id}
                      onChange={(e) => setLitterForm((f) => ({ ...f, father_id: e.target.value }))}
                      className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
                    >
                      <option value="">Seleziona stallone</option>
                      {localDogs.filter((d) => d.sex === "maschio").map((d) => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  ) : (
                    <div className="space-y-3 p-3 bg-muted/30 rounded-lg border border-border">
                      <div className="grid grid-cols-2 gap-3">
                        <Field label="Nome (con Affisso) *" value={litterForm.external_father_name} onChange={(v) => setLitterForm((f) => ({ ...f, external_father_name: v }))} placeholder="Nome del padre" />
                        <Field label="Allevamento" value={litterForm.external_father_kennel} onChange={(v) => setLitterForm((f) => ({ ...f, external_father_kennel: v }))} placeholder="Nome allevamento" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <Field label="Colore" value={litterForm.external_father_color} onChange={(v) => setLitterForm((f) => ({ ...f, external_father_color: v }))} />
                        <Field label="Pedigree (ROI)" value={litterForm.external_father_pedigree_number} onChange={(v) => setLitterForm((f) => ({ ...f, external_father_pedigree_number: v }))} />
                      </div>
                      <div>
                        <label className="text-sm text-muted-foreground mb-1 block">Razza</label>
                        <select
                          value={litterForm.external_father_breed_id}
                          onChange={(e) => setLitterForm((f) => ({ ...f, external_father_breed_id: e.target.value }))}
                          className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
                        >
                          <option value="">Seleziona razza</option>
                          {allBreeds.map((b) => <option key={b.id} value={b.id}>{b.name_it}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-sm text-muted-foreground mb-1 block">Foto</label>
                        <ImageUpload images={litterForm.external_father_photo_url ? [litterForm.external_father_photo_url] : []} onChange={(imgs) => setLitterForm((f) => ({ ...f, external_father_photo_url: imgs[0] ?? "" }))} maxImages={1} folder="litters" />
                      </div>
                      <div>
                        <label className="text-sm text-muted-foreground mb-1 block">Titoli</label>
                        <div className="flex flex-wrap gap-1.5">
                          {DOG_TITLES.map((t) => (
                            <button key={t} type="button"
                              onClick={() => setLitterForm((f) => ({ ...f, external_father_titles: f.external_father_titles.includes(t) ? f.external_father_titles.filter((x) => x !== t) : [...f.external_father_titles, t] }))}
                              className={`text-xs px-2 py-1 rounded-full border transition-colors ${litterForm.external_father_titles.includes(t) ? "bg-primary text-white border-primary" : "border-border text-muted-foreground hover:border-primary/50"}`}
                            >{t}</button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="text-sm text-muted-foreground mb-1 block">Screening sanitari</label>
                        <div className="grid grid-cols-2 gap-2">
                          {Object.entries(HEALTH_SCREENING_TYPES).map(([key, hs]) => (
                            <div key={key}>
                              <label className="text-xs text-muted-foreground">{hs.label}</label>
                              <select
                                value={litterForm.external_father_health_screenings[key] ?? ""}
                                onChange={(e) => setLitterForm((f) => {
                                  const updated = { ...f.external_father_health_screenings };
                                  if (e.target.value) updated[key] = e.target.value; else delete updated[key];
                                  return { ...f, external_father_health_screenings: updated };
                                })}
                                className="w-full border border-border rounded-lg px-2 py-1 text-xs bg-white"
                              >
                                <option value="">—</option>
                                {hs.grades.map((g) => <option key={g} value={g}>{g}</option>)}
                              </select>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                {/* Auto-generated name */}
                <div className="bg-muted/50 rounded-lg px-3 py-2">
                  <p className="text-xs text-muted-foreground">Nome cucciolata</p>
                  <p className="text-sm font-medium text-foreground">{getLitterName()}</p>
                </div>
              </div>

              {/* Section: Dettagli */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-foreground uppercase tracking-wide">Dettagli cucciolata</h4>
                <Field label="Data di nascita" value={litterForm.litter_date} onChange={(v) => setLitterForm((f) => ({ ...f, litter_date: v }))} type="date" />
                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={litterForm.pedigree_included} onChange={(e) => setLitterForm((f) => ({ ...f, pedigree_included: e.target.checked }))} className="rounded" />
                    Pedigree
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={litterForm.vaccinated} onChange={(e) => setLitterForm((f) => ({ ...f, vaccinated: e.target.checked }))} className="rounded" />
                    Vaccinati
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={litterForm.microchipped} onChange={(e) => setLitterForm((f) => ({ ...f, microchipped: e.target.checked }))} className="rounded" />
                    Microchippati
                  </label>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">Foto cucciolata</label>
                  <ImageUpload images={litterForm.images} onChange={(imgs) => setLitterForm((f) => ({ ...f, images: imgs }))} maxImages={6} folder="litters" />
                </div>
                <Field label="Note" value={litterForm.notes} onChange={(v) => setLitterForm((f) => ({ ...f, notes: v }))} placeholder="Note aggiuntive sulla cucciolata" />
              </div>

              {/* Section: Cuccioli */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-foreground uppercase tracking-wide">Cuccioli ({litterForm.puppies.length})</h4>
                  <button type="button" onClick={() => setLitterForm((f) => ({ ...f, puppies: [...f.puppies, { name: "", sex: "maschio", color: "", variety: "", status: "disponibile", photo_url: "", price: "", price_on_request: false, microchip_number: "", notes: "" }] }))} className="text-xs text-primary hover:underline flex items-center gap-1">
                    <Plus className="h-3 w-3" /> Aggiungi cucciolo
                  </button>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">Numero cuccioli</label>
                  <input
                    type="number" min={0} max={20}
                    value={litterForm.puppies.length || ""}
                    onChange={(e) => {
                      const n = Math.max(0, Math.min(20, parseInt(e.target.value) || 0));
                      setLitterForm((f) => {
                        const current = f.puppies;
                        if (n > current.length) {
                          const toAdd = Array.from({ length: n - current.length }, () => ({ name: "", sex: "maschio" as const, color: "", variety: "", status: "disponibile" as const, photo_url: "", price: "", price_on_request: false, microchip_number: "", notes: "" }));
                          return { ...f, puppies: [...current, ...toAdd] };
                        }
                        return { ...f, puppies: current.slice(0, n) };
                      });
                    }}
                    placeholder="Es. 6"
                    className="w-32 border border-border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                {litterForm.puppies.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">Inserisci il numero di cuccioli o clicca &quot;Aggiungi cucciolo&quot;.</p>
                )}
                {litterForm.puppies.map((puppy, idx) => (
                  <div key={idx} className="p-3 bg-muted/30 rounded-lg border border-border space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium text-muted-foreground">Cucciolo {idx + 1}</p>
                      <button type="button" onClick={() => setLitterForm((f) => ({ ...f, puppies: f.puppies.filter((_, i) => i !== idx) }))} className="text-red-400 hover:text-red-600"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-sm text-muted-foreground mb-1 block">Sesso *</label>
                        <div className="flex gap-1">
                          {(["maschio", "femmina"] as const).map((s) => (
                            <button key={s} type="button"
                              onClick={() => setLitterForm((f) => ({ ...f, puppies: f.puppies.map((p, i) => i === idx ? { ...p, sex: s } : p) }))}
                              className={`flex-1 text-xs py-1.5 rounded-lg border transition-colors ${puppy.sex === s ? "bg-primary text-white border-primary" : "border-border text-muted-foreground"}`}
                            >{s === "maschio" ? "♂ Maschio" : "♀ Femmina"}</button>
                          ))}
                        </div>
                      </div>
                      <Field label="Mantello" value={puppy.color} onChange={(v) => setLitterForm((f) => ({ ...f, puppies: f.puppies.map((p, i) => i === idx ? { ...p, color: v } : p) }))} />
                    </div>
                    {(() => {
                      const m = localDogs.find((d) => d.id === litterForm.mother_id);
                      const f = !litterForm.is_external_father ? localDogs.find((d) => d.id === litterForm.father_id) : null;
                      return m?.variety && f?.variety && m.variety !== f.variety;
                    })() && (
                      <Field label="Varietà" value={puppy.variety} onChange={(v) => setLitterForm((f) => ({ ...f, puppies: f.puppies.map((p, i) => i === idx ? { ...p, variety: v } : p) }))} placeholder="Es. pelo lungo" />
                    )}
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="text-sm text-muted-foreground mb-1 block">Stato</label>
                        <select
                          value={puppy.status}
                          onChange={(e) => setLitterForm((f) => ({ ...f, puppies: f.puppies.map((p, i) => i === idx ? { ...p, status: e.target.value as "disponibile" | "prenotato" | "venduto" } : p) }))}
                          className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
                        >
                          <option value="disponibile">Disponibile</option>
                          <option value="prenotato">Prenotato</option>
                          <option value="venduto">Venduto</option>
                        </select>
                      </div>
                      <div>
                        <label className="flex items-center gap-1.5 text-sm text-muted-foreground mb-1">Prezzo</label>
                        <div className="flex items-center gap-2">
                          {!puppy.price_on_request && (
                            <input type="number" value={puppy.price} onChange={(e) => setLitterForm((f) => ({ ...f, puppies: f.puppies.map((p, i) => i === idx ? { ...p, price: e.target.value } : p) }))} placeholder="€" className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30" />
                          )}
                        </div>
                        <label className="flex items-center gap-1.5 text-xs mt-1 cursor-pointer">
                          <input type="checkbox" checked={puppy.price_on_request} onChange={(e) => setLitterForm((f) => ({ ...f, puppies: f.puppies.map((p, i) => i === idx ? { ...p, price_on_request: e.target.checked, price: "" } : p) }))} className="rounded" />
                          Su richiesta
                        </label>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-sm text-muted-foreground mb-1 block">Foto</label>
                        <ImageUpload images={puppy.photo_url ? [puppy.photo_url] : []} onChange={(imgs) => setLitterForm((f) => ({ ...f, puppies: f.puppies.map((p, i) => i === idx ? { ...p, photo_url: imgs[0] ?? "" } : p) }))} maxImages={1} folder="puppies" />
                      </div>
                      <Field label="Note" value={puppy.notes} onChange={(v) => setLitterForm((f) => ({ ...f, puppies: f.puppies.map((p, i) => i === idx ? { ...p, notes: v } : p) }))} placeholder="Note sul cucciolo" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-border">
              <button onClick={() => setEditingLitterId(null)} className="text-sm text-muted-foreground hover:text-foreground px-3 py-1.5">Annulla</button>
              <button
                onClick={saveLitter}
                disabled={savingLitter || !litterForm.mother_id || (!litterForm.is_external_father && !litterForm.father_id) || (litterForm.is_external_father && !litterForm.external_father_name.trim())}
                className="text-sm bg-primary text-white px-4 py-1.5 rounded-lg hover:bg-primary-dark disabled:opacity-40 transition-colors font-medium"
              >
                {savingLitter ? "Salvataggio..." : editingLitterId === "new" ? "Pubblica" : "Salva"}
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
            <div className="p-6 space-y-6">

              {/* ── Section: Anagrafica ──────────────────────────────── */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-foreground uppercase tracking-wide border-b border-border pb-2">Anagrafica</h4>
                <Field label="Nome (senza Affisso) *" value={dogForm.name} onChange={(v) => setDogForm((f) => ({ ...f, name: v }))} placeholder="Es. Apollo" />
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">Affisso</label>
                  <div className="flex gap-1.5 mb-2">
                    {breeder?.affisso && (
                      <button type="button" onClick={() => setDogForm((f) => ({ ...f, affisso_mode: "breeder", affisso: breeder?.affisso ?? "" }))}
                        className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${dogForm.affisso_mode === "breeder" ? "bg-primary text-white border-primary" : "border-border text-muted-foreground hover:border-primary"}`}>
                        {breeder?.affisso}
                      </button>
                    )}
                    <button type="button" onClick={() => setDogForm((f) => ({ ...f, affisso_mode: "other", affisso: "" }))}
                      className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${dogForm.affisso_mode === "other" ? "bg-primary text-white border-primary" : "border-border text-muted-foreground hover:border-primary"}`}>
                      Altro affisso
                    </button>
                    <button type="button" onClick={() => setDogForm((f) => ({ ...f, affisso_mode: "none", affisso: "" }))}
                      className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${dogForm.affisso_mode === "none" ? "bg-primary text-white border-primary" : "border-border text-muted-foreground hover:border-primary"}`}>
                      Nessun affisso
                    </button>
                  </div>
                  {dogForm.affisso_mode === "other" && (
                    <input type="text" value={dogForm.affisso} onChange={(e) => setDogForm((f) => ({ ...f, affisso: e.target.value }))} placeholder="Es. del Castello Incantato" className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30" />
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
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
                  <Field label="Mantello" value={dogForm.color} onChange={(v) => setDogForm((f) => ({ ...f, color: v }))} placeholder="Nero focato" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm text-muted-foreground mb-1 block">Razza</label>
                    <select value={dogForm.breed_id} onChange={(e) => setDogForm((f) => ({ ...f, breed_id: e.target.value }))}
                      className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30">
                      <option value="">Seleziona</option>
                      {allBreeds.filter((b) => (breeder?.breed_ids ?? []).includes(b.id)).map((b) => <option key={b.id} value={b.id}>{b.name_it}</option>)}
                    </select>
                  </div>
                  <Field label="Varietà" value={dogForm.variety} onChange={(v) => setDogForm((f) => ({ ...f, variety: v }))} placeholder="Es. pelo lungo" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Data di nascita" type="date" value={dogForm.date_of_birth} onChange={(v) => setDogForm((f) => ({ ...f, date_of_birth: v }))} />
                  <Field label="Pedigree (ROI)" value={dogForm.pedigree_number} onChange={(v) => setDogForm((f) => ({ ...f, pedigree_number: v }))} placeholder="ROI 12345" />
                </div>
                {dogForm.pedigree_number.trim() && (
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={dogForm.dna_deposited} onChange={(e) => setDogForm((f) => ({ ...f, dna_deposited: e.target.checked }))} className="rounded" />
                    DNA depositato
                  </label>
                )}
              </div>

              {/* ── Section: Salute ──────────────────────────────────── */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-foreground uppercase tracking-wide border-b border-border pb-2">Salute</h4>
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
                            if (val) {
                              hs[key] = val;
                              if (!hs[`${key}_source`]) hs[`${key}_source`] = "veterinario";
                            } else {
                              delete hs[key];
                              delete hs[`${key}_source`];
                              delete hs[`${key}_year`];
                            }
                            return { ...f, health_screenings: hs };
                          });
                        }}
                        className="w-full border border-border rounded-lg px-2 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
                      >
                        <option value="">Non effettuato</option>
                        {config.grades.map((g) => <option key={g} value={g}>{g}</option>)}
                      </select>
                      {dogForm.health_screenings[key] && (
                        <>
                          {dogForm.pedigree_number.trim() && config.sources.length > 1 ? (
                            <select
                              value={dogForm.health_screenings[`${key}_source`] ?? "veterinario"}
                              onChange={(e) => setDogForm((f) => {
                                const hs = { ...f.health_screenings, [`${key}_source`]: e.target.value };
                                return { ...f, health_screenings: hs };
                              })}
                              className="w-full border border-border rounded-lg px-2 py-1 text-xs bg-white mt-1 focus:outline-none focus:ring-2 focus:ring-primary/30"
                            >
                              {config.sources.map((s) => <option key={s} value={s}>{HEALTH_SOURCE_LABELS[s] ?? s}</option>)}
                            </select>
                          ) : (
                            <p className="text-[10px] text-muted-foreground mt-0.5">Veterinario</p>
                          )}
                          {config.hasYear && (
                            <input
                              type="number" min={2000} max={2099} placeholder="Anno"
                              value={dogForm.health_screenings[`${key}_year`] ?? ""}
                              onChange={(e) => setDogForm((f) => {
                                const hs = { ...f.health_screenings };
                                if (e.target.value) hs[`${key}_year`] = e.target.value; else delete hs[`${key}_year`];
                                return { ...f, health_screenings: hs };
                              })}
                              className="w-full border border-border rounded-lg px-2 py-1 text-xs bg-white mt-1 focus:outline-none focus:ring-2 focus:ring-primary/30"
                            />
                          )}
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Section: Esposizioni e titoli ────────────────────── */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-foreground uppercase tracking-wide border-b border-border pb-2">Esposizioni e titoli{!dogForm.pedigree_number.trim() ? <span className="font-normal text-muted-foreground ml-2 normal-case tracking-normal">(richiede pedigree)</span> : ""}</h4>

                <div className={!dogForm.pedigree_number.trim() ? "opacity-40 pointer-events-none space-y-4" : "space-y-4"}>
                  <div>
                    <label className="text-xs text-muted-foreground mb-2 block">Certificati espositivi</label>
                    <div className="flex flex-wrap gap-2">
                      {DOG_CERTIFICATI_ESPOSITIVI.map((title) => (
                        <button key={title} type="button"
                          onClick={() => setDogForm((f) => ({ ...f, titles: f.titles.includes(title) ? f.titles.filter((t) => t !== title) : [...f.titles, title] }))}
                          className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${dogForm.titles.includes(title) ? "bg-primary text-white border-primary" : "border-border text-muted-foreground hover:border-primary"}`}>
                          {title}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-2 block">Titoli espositivi</label>
                    <div className="flex flex-wrap gap-2">
                      {DOG_TITOLI_ESPOSITIVI.map((title) => (
                        <button key={title} type="button"
                          onClick={() => setDogForm((f) => ({ ...f, titles: f.titles.includes(title) ? f.titles.filter((t) => t !== title) : [...f.titles, title] }))}
                          className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${dogForm.titles.includes(title) ? "bg-primary text-white border-primary" : "border-border text-muted-foreground hover:border-primary"}`}>
                          {title}
                        </button>
                      ))}
                    </div>
                  </div>

                  {allBreeds.find((b) => b.id === dogForm.breed_id)?.is_working_breed && (
                    <>
                      <div>
                        <label className="text-xs text-muted-foreground mb-2 block">Certificati da lavoro</label>
                        <div className="flex flex-wrap gap-2">
                          {DOG_CERTIFICATI_LAVORO.map((title) => (
                            <button key={title} type="button"
                              onClick={() => setDogForm((f) => ({ ...f, titles: f.titles.includes(title) ? f.titles.filter((t) => t !== title) : [...f.titles, title] }))}
                              className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${dogForm.titles.includes(title) ? "bg-primary text-white border-primary" : "border-border text-muted-foreground hover:border-primary"}`}>
                              {title}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground mb-2 block">Titoli da lavoro</label>
                        <div className="flex flex-wrap gap-2">
                          {DOG_TITOLI_LAVORO.map((title) => (
                            <button key={title} type="button"
                              onClick={() => setDogForm((f) => ({ ...f, titles: f.titles.includes(title) ? f.titles.filter((t) => t !== title) : [...f.titles, title] }))}
                              className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${dogForm.titles.includes(title) ? "bg-primary text-white border-primary" : "border-border text-muted-foreground hover:border-primary"}`}>
                              {title}
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  <div>
                    <label className="text-xs text-muted-foreground mb-2 block">Titoli ENCI</label>
                    <div className="flex flex-wrap gap-4">
                      {["Riproduttore Selezionato ENCI", "Campione Riproduttore"].map((title) => (
                        <label key={title} className="flex items-center gap-2 text-sm cursor-pointer">
                          <input type="checkbox" checked={dogForm.titles.includes(title)} onChange={(e) => setDogForm((f) => ({ ...f, titles: e.target.checked ? [...f.titles, title] : f.titles.filter((t) => t !== title) }))} className="rounded" disabled={!dogForm.pedigree_number.trim()} />
                          {title}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Section: Foto ────────────────────────────────────── */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-foreground uppercase tracking-wide border-b border-border pb-2">Foto</h4>
                <ImageUpload
                  images={[...(dogForm.photo_url ? [dogForm.photo_url] : []), ...dogForm.gallery_urls]}
                  onChange={(imgs) => setDogForm((f) => ({ ...f, photo_url: imgs[0] ?? "", gallery_urls: imgs.slice(1) }))}
                  maxImages={10}
                  folder="breeding-dogs"
                />
              </div>

              {/* ── Section: Note ────────────────────────────────────── */}
              <div>
                <h4 className="text-sm font-semibold text-foreground uppercase tracking-wide border-b border-border pb-2 mb-4">Note</h4>
                <Field label="" value={dogForm.notes} onChange={(v) => setDogForm((f) => ({ ...f, notes: v }))} multiline placeholder="Informazioni aggiuntive sul soggetto..." />
              </div>

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
