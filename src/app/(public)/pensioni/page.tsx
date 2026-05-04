import { Metadata } from "next";
import Link from "next/link";
import {
  MapPin,
  Home,
  ShieldCheck,
  Star,
  Stethoscope,
  Calendar,
  MessageCircle,
  Dog,
  Eye,
  Heart,
  Building2,
  ArrowRight,
} from "lucide-react";
import Card, { CardContent } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { SITE_NAME } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: `Pensioni per Cani | ${SITE_NAME}`,
  description:
    "Trova pensioni, dog sitter e pet hotel verificati in Italia: servizi, recensioni e contatto diretto.",
};

export default async function PensioniPage() {
  const supabase = await createClient();

  const { data: boardings } = await supabase
    .from("boarding_profiles")
    .select(
      "id, slug, name, description, region, province, city, logo_url, gallery_urls"
    )
    .eq("is_approved", true)
    .order("created_at", { ascending: false });

  const list = boardings ?? [];
  const totalApprovate = list.length;
  const totalCitta = new Set(list.map((b) => b.city).filter(Boolean)).size;
  const totalRegioni = new Set(list.map((b) => b.region).filter(Boolean)).size;

  return (
    <div className="min-h-screen bg-background">
      {/* Hero / Cover */}
      <section
        id="cerca"
        className="relative border-b border-border overflow-hidden"
      >
        <div className="absolute inset-0 z-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://placedog.net/1600/700?id=200"
            alt=""
            className="w-full h-full object-cover"
            aria-hidden
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/35 to-black/15" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-20 pb-16 md:pt-28 md:pb-20">
          <p className="text-white/90 text-sm font-medium uppercase tracking-widest mb-3 drop-shadow">
            Pensioni · Dog sitter · Pet hotel
          </p>
          <h1 className="font-serif text-4xl md:text-6xl text-white mb-4 drop-shadow-md">
            Pensioni per cani
          </h1>
          <p className="text-white/95 mb-8 max-w-xl mx-auto drop-shadow text-base md:text-lg">
            Strutture selezionate per il tuo cane durante ferie o trasferte. Servizi,
            recensioni e contatto diretto in un solo posto.
          </p>
          <a
            href="#directory"
            className="inline-flex items-center gap-2 bg-white text-foreground rounded-full px-6 py-3 text-sm font-semibold shadow-md hover:shadow-lg transition-shadow"
          >
            Esplora le pensioni
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </section>

      {/* Trust strip */}
      <section className="bg-white border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            {[
              {
                icon: ShieldCheck,
                value: totalApprovate > 0 ? `${totalApprovate}` : "—",
                label: totalApprovate === 1 ? "pensione verificata" : "pensioni verificate",
              },
              {
                icon: MapPin,
                value: totalCitta > 0 ? `${totalCitta}` : "—",
                label: totalCitta === 1 ? "città coperta" : "città coperte",
              },
              {
                icon: Home,
                value: totalRegioni > 0 ? `${totalRegioni}` : "—",
                label: totalRegioni === 1 ? "regione" : "regioni",
              },
              {
                icon: Stethoscope,
                value: "100%",
                label: "controllo documenti",
              },
            ].map((k) => (
              <div key={k.label} className="flex flex-col items-center gap-1">
                <k.icon className="h-5 w-5 text-primary" />
                <p className="text-xl font-semibold text-foreground">{k.value}</p>
                <p className="text-xs text-muted-foreground leading-tight">{k.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Come funziona */}
      <section className="bg-white border-b border-border py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-serif text-2xl md:text-3xl text-center mb-10">
            Come funziona
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              {
                icon: Calendar,
                title: "Trova le pensioni nella tua zona",
                desc: "Filtra per regione e città. Vedi solo strutture con profilo verificato.",
              },
              {
                icon: Home,
                title: "Confronta servizi e recensioni",
                desc: "Leggi le esperienze di altri proprietari prima di contattare.",
              },
              {
                icon: MessageCircle,
                title: "Contatta direttamente la struttura",
                desc: "Telefono, email o WhatsApp: nessun intermediario fra te e la pensione.",
              },
              {
                icon: Dog,
                title: "Vai in vacanza sereno",
                desc: "Ricevi aggiornamenti dalla pensione durante il soggiorno del tuo cane.",
              },
            ].map((s) => (
              <div key={s.title} className="text-center">
                <div className="w-12 h-12 rounded-xl bg-primary-light text-primary flex items-center justify-center mx-auto mb-3">
                  <s.icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-sm mb-1">{s.title}</h3>
                <p className="text-sm text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Perché scegliere una pensione verificata */}
      <section className="bg-background border-b border-border py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="font-serif text-2xl md:text-3xl mb-2">
              Perché scegliere una pensione verificata
            </h2>
            <p className="text-muted-foreground text-sm max-w-xl mx-auto">
              I gruppi Facebook e i contatti casuali non offrono garanzie. Qui trovi solo
              strutture controllate.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: ShieldCheck,
                title: "Identità verificata",
                desc: "Ogni pensione è approvata dal team prima di apparire nella directory pubblica.",
              },
              {
                icon: Star,
                title: "Recensioni reali",
                desc: "Pubblichiamo solo recensioni di chi ha effettivamente lasciato il proprio cane. Niente review anonime.",
              },
              {
                icon: Eye,
                title: "Trasparenza prima del contatto",
                desc: "Vedi servizi, foto, posizione e contatti diretti prima di inviare un messaggio.",
              },
            ].map((c) => (
              <div key={c.title} className="text-center">
                <div className="w-12 h-12 rounded-xl bg-primary-light text-primary flex items-center justify-center mx-auto mb-3">
                  <c.icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-base mb-1.5">{c.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Directory */}
      <section
        id="directory"
        className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12"
      >
        <div className="flex items-end justify-between gap-4 flex-wrap mb-6">
          <div>
            <h2 className="font-serif text-2xl md:text-3xl">Pensioni in Italia</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {totalApprovate > 0
                ? `${totalApprovate} struttur${totalApprovate === 1 ? "a" : "e"} verificat${totalApprovate === 1 ? "a" : "e"}`
                : "La directory è in fase di popolamento"}
            </p>
          </div>
        </div>

        {list.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center space-y-3">
              <Home className="h-12 w-12 text-muted-foreground/30 mx-auto" />
              <p className="text-base font-medium text-foreground">
                Nessuna pensione ancora registrata.
              </p>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Stiamo lavorando per popolare questa sezione. Se gestisci una pensione,
                puoi registrarti ora e la tua struttura comparirà appena il profilo sarà
                approvato.
              </p>
              <Link
                href="/registrati"
                className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
              >
                Registra la tua pensione
                <ArrowRight className="h-4 w-4" />
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {list.map((b) => (
              <PensioneCard key={b.id} boarding={b} />
            ))}
          </div>
        )}
      </section>

      {/* FAQ */}
      <section className="bg-white border-t border-border py-14">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-serif text-2xl md:text-3xl text-center mb-2">
            Domande frequenti
          </h2>
          <p className="text-center text-sm text-muted-foreground mb-8">
            Le risposte alle domande che ci fanno più spesso i proprietari.
          </p>
          <div className="space-y-3">
            {FAQ_ITEMS.map((f) => (
              <details
                key={f.q}
                className="group bg-background border border-border rounded-xl px-5 py-4 open:border-primary/30 open:bg-primary-light/10"
              >
                <summary className="flex items-center justify-between gap-4 cursor-pointer list-none font-medium text-sm md:text-base text-foreground">
                  <span>{f.q}</span>
                  <span
                    className="text-muted-foreground text-lg transition-transform group-open:rotate-45 select-none"
                    aria-hidden
                  >
                    +
                  </span>
                </summary>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                  {f.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA finale doppia */}
      <section className="bg-gradient-to-b from-background to-primary-light/30 border-t border-border py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Card className="bg-white">
              <CardContent className="p-7 space-y-3">
                <div className="w-11 h-11 rounded-xl bg-primary-light text-primary flex items-center justify-center">
                  <Dog className="h-5 w-5" />
                </div>
                <h3 className="font-serif text-xl">Cerchi una pensione per il tuo cane?</h3>
                <p className="text-sm text-muted-foreground">
                  Filtra per zona e contatta direttamente le strutture verificate.
                </p>
                <a
                  href="#directory"
                  className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                >
                  Vai alla directory
                  <ArrowRight className="h-4 w-4" />
                </a>
              </CardContent>
            </Card>
            <Card className="bg-white">
              <CardContent className="p-7 space-y-3">
                <div className="w-11 h-11 rounded-xl bg-secondary/15 text-secondary flex items-center justify-center">
                  <Building2 className="h-5 w-5" />
                </div>
                <h3 className="font-serif text-xl">Gestisci una pensione?</h3>
                <p className="text-sm text-muted-foreground">
                  Iscrivi gratis la tua struttura e ricevi richieste qualificate da
                  proprietari di tutta Italia.
                </p>
                <Link
                  href="/registrati"
                  className="inline-flex items-center gap-2 text-sm font-medium text-secondary hover:underline"
                >
                  Crea il profilo gratis
                  <Heart className="h-4 w-4" />
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* JSON-LD FAQPage per rich snippets */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: FAQ_ITEMS.map((f) => ({
              "@type": "Question",
              name: f.q,
              acceptedAnswer: { "@type": "Answer", text: f.a },
            })),
          }),
        }}
      />
    </div>
  );
}

const FAQ_ITEMS: { q: string; a: string }[] = [
  {
    q: "Quanto costa una pensione per cani in Italia?",
    a: "Il prezzo medio va da 18€ a 45€ a notte, in base a taglia, servizi inclusi e regione. Le strutture di lusso o con suite private possono superare i 70€. Molte pensioni applicano sconti per soggiorni settimanali (5-15%).",
  },
  {
    q: "Cosa devo portare quando lascio il cane in pensione?",
    a: "Generalmente: libretto sanitario aggiornato (vaccinazioni obbligatorie), una coperta o oggetto familiare, il cibo abituale per i primi giorni, eventuali farmaci con prescrizione. Le pensioni serie ti danno una checklist al momento della prenotazione.",
  },
  {
    q: "Quali vaccinazioni sono obbligatorie?",
    a: "Quasi tutte le pensioni richiedono: cimurro, parvovirosi, epatite, leptospirosi (vaccino tetravalente) e antirabbica. Molte richiedono anche la tosse dei canili (Bordetella). Verifica con la singola struttura.",
  },
  {
    q: "Cosa succede se il mio cane si ammala durante il soggiorno?",
    a: "Le pensioni serie hanno un veterinario di riferimento (alcune lo hanno interno). In caso di problema vieni avvisato immediatamente. Le spese veterinarie urgenti sono di norma a carico del proprietario, salvo diversi accordi.",
  },
  {
    q: "I cani non sterilizzati sono accettati?",
    a: "Dipende dalla pensione. Alcune accettano femmine in calore in box separato, altre solo maschi non sterilizzati, altre ancora richiedono la sterilizzazione. Verifica direttamente con la struttura.",
  },
  {
    q: "Posso ricevere aggiornamenti durante il soggiorno?",
    a: "Sì, molte pensioni offrono foto giornaliere via WhatsApp e alcune anche videochiamate programmate (servizio in genere gratuito o a basso costo). Chiedi alla pensione cosa offre.",
  },
  {
    q: "Quanto tempo prima devo prenotare?",
    a: "In bassa stagione anche pochi giorni prima è sufficiente. Per agosto, periodo natalizio o ponti consigliamo di prenotare con 2-3 mesi di anticipo: le strutture migliori si riempiono presto.",
  },
];

interface BoardingCardData {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  region: string | null;
  province: string | null;
  city: string | null;
  logo_url: string | null;
  gallery_urls: string[] | null;
}

function PensioneCard({ boarding: b }: { boarding: BoardingCardData }) {
  const cover = b.gallery_urls?.[0] ?? b.logo_url ?? null;

  return (
    <Link href={`/pensioni/${b.slug}`}>
      <Card hover className="cursor-pointer h-full overflow-hidden">
        <div className="h-40 bg-gradient-to-br from-primary-light to-primary-light/50 flex items-center justify-center relative overflow-hidden">
          {cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={cover}
              alt={`Foto di ${b.name}`}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <Home className="h-12 w-12 text-primary/60" />
          )}
          <div className="absolute top-3 right-3">
            <Badge variant="success">
              <ShieldCheck className="h-3 w-3 mr-1 inline" />
              Verificata
            </Badge>
          </div>
        </div>
        <CardContent className="space-y-2.5">
          <div className="flex items-start gap-3">
            {b.logo_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={b.logo_url}
                alt=""
                className="h-10 w-10 rounded-full object-cover border border-border shrink-0 -mt-1"
              />
            )}
            <h3 className="font-semibold text-lg leading-tight">{b.name}</h3>
          </div>
          {(b.city || b.region) && (
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {[b.city, b.region].filter(Boolean).join(", ")}
            </p>
          )}
          {b.description && (
            <p className="text-sm text-muted-foreground line-clamp-3">{b.description}</p>
          )}
          <div className="pt-2 border-t border-border">
            <span className="text-sm text-primary font-medium inline-flex items-center gap-1">
              Vedi profilo
              <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
