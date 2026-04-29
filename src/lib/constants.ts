export const SITE_NAME = "AllevatoriItalia";
export const SITE_DESCRIPTION =
  "La directory italiana degli allevatori professionali di cani. Trova allevatori certificati ENCI nella tua regione.";
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/allevatori", label: "Allevatori" },
  { href: "/addestratori", label: "Addestratori" },
  { href: "/pensioni", label: "Pensioni" },
  { href: "/veterinari", label: "Veterinari" },
  { href: "/razze", label: "Razze" },
] as const;

export const DASHBOARD_NAV = [
  { href: "/dashboard", label: "Panoramica", icon: "LayoutDashboard" },
  { href: "/dashboard/annunci", label: "Annunci", icon: "Megaphone" },
  { href: "/dashboard/messaggi", label: "Messaggi", icon: "MessageCircle" },
  { href: "/dashboard/recensioni", label: "Recensioni", icon: "Star" },
  { href: "/dashboard/abbonamento", label: "Commissioni", icon: "Crown" },
  { href: "/dashboard/impostazioni", label: "Impostazioni", icon: "Settings" },
] as const;

export const ADMIN_NAV = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/utenti", label: "Utenti" },
  { href: "/admin/allevatori", label: "Allevatori" },
  { href: "/admin/recensioni", label: "Recensioni" },
  { href: "/admin/razze", label: "Razze" },
] as const;


export const DOG_TITOLI_ESPOSITIVI = [
  "Campione Italiano di Bellezza",
  "Campione Internazionale di Bellezza (C.I.B.)",
  "Giovane Campione Italiano",
] as const;

export const DOG_CERTIFICATI_ESPOSITIVI = [
  "CAC",
  "CACIB",
  "BOB",
  "BIS",
] as const;

export const DOG_TITOLI_LAVORO = [
  "IGP 1",
  "IGP 2",
  "IGP 3",
] as const;

export const DOG_CERTIFICATI_LAVORO = [
  "BH",
  "ZTP",
  "CAE-1",
  "CAE-2",
] as const;

export const DOG_TITOLI_ENCI = [
  "Riproduttore Selezionato ENCI",
  "Campione Riproduttore",
] as const;

export const DOG_TITLES = [...DOG_TITOLI_ESPOSITIVI, ...DOG_CERTIFICATI_ESPOSITIVI, ...DOG_TITOLI_LAVORO, ...DOG_CERTIFICATI_LAVORO, ...DOG_TITOLI_ENCI] as const;

export const HEALTH_SCREENING_TYPES = {
  hd: { label: "Displasia anca (HD)", grades: ["A", "B", "C", "D", "E"], sources: ["veterinario", "fsa", "celemasche"], hasYear: false },
  ed: { label: "Displasia gomito (ED)", grades: ["0", "1", "2", "3"], sources: ["veterinario", "fsa", "celemasche"], hasYear: false },
  eyes: { label: "Esame oculistico", grades: ["Esente", "Affetto"], sources: ["veterinario", "fsa"], hasYear: true },
  heart: { label: "Esame cardiologico", grades: ["Esente", "Affetto"], sources: ["veterinario"], hasYear: true },
  patella: { label: "Lussazione rotulea", grades: ["0", "1", "2", "3", "4"], sources: ["veterinario", "fsa"], hasYear: false },
  baer: { label: "Test BAER (udito)", grades: ["Normale", "Unilaterale", "Bilaterale"], sources: ["veterinario"], hasYear: false },
} as const;

export const HEALTH_SOURCE_LABELS: Record<string, string> = {
  veterinario: "Veterinario",
  fsa: "FSA",
  celemasche: "CeLeMaSche",
};

export const VET_SPECIALIZATIONS = [
  "Medicina generale",
  "Chirurgia",
  "Ortopedia",
  "Dermatologia",
  "Oncologia",
  "Cardiologia",
  "Oftalmologia",
  "Odontoiatria",
  "Comportamento",
  "Riproduzione",
  "Medicina interna",
  "Diagnostica per immagini",
  "Anestesiologia",
  "Animali esotici",
  "Omeopatia / Agopuntura",
  "Riabilitazione e fisioterapia",
] as const;

export const VET_LANGUAGES = [
  "italiano",
  "inglese",
  "francese",
  "tedesco",
  "spagnolo",
] as const;

export const SUBSCRIPTION_PLANS = {
  base: {
    name: "Base",
    price: 0,
    features: [
      "Profilo allevamento",
      "Fino a 3 foto",
      "1 annuncio attivo",
      "Messaggistica base",
    ],
  },
  premium: {
    name: "Premium",
    price: 1990, // €19.90/mese in centesimi
    features: [
      "Tutto del piano Base",
      "Fino a 20 foto",
      "5 annunci attivi",
      "Badge Premium",
      "Posizionamento prioritario",
      "Statistiche avanzate",
    ],
  },
  elite: {
    name: "Elite",
    price: 3990, // €39.90/mese
    features: [
      "Tutto del piano Premium",
      "Foto illimitate",
      "Annunci illimitati",
      "Badge Elite",
      "Primo nei risultati",
      "Supporto dedicato",
      "Pagina personalizzata",
    ],
  },
} as const;
