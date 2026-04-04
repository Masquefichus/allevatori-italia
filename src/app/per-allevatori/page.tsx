import { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle,
  Users,
  CreditCard,
  BookOpen,
  Scale,
  Shield,
  Star,
  MessageCircle,
  Lock,
} from "lucide-react";
import Button from "@/components/ui/Button";
import Card, { CardContent } from "@/components/ui/Card";
import { SITE_NAME } from "@/lib/constants";

export const metadata: Metadata = {
  title: `Per Allevatori | ${SITE_NAME}`,
  description: `Unisciti alla rete degli allevatori certificati su ${SITE_NAME}. Connettiti con famiglie serie, gestisci le cucciolate e proteggi i tuoi pagamenti.`,
};

const freePerks = [
  {
    icon: Users,
    title: "Famiglie pronte ad adottare",
    description: "Connettiti con acquirenti seri, già informati e motivati.",
  },
  {
    icon: Scale,
    title: "Contratti per ogni situazione",
    description: "Modelli per vendita cuccioli, comproprietà, stud dog e guardian home.",
  },
  {
    icon: Star,
    title: "Visibilità sulle schede razza",
    description: "Il tuo profilo appare direttamente nelle pagine delle razze che allevi.",
  },
];

const services = [
  {
    icon: BookOpen,
    title: "Impara dai migliori",
    description:
      "Accedi a risorse educative su salute canina, allevamento responsabile e socializzazione — curate con esperti del settore.",
  },
  {
    icon: Users,
    title: "Colloca i tuoi cuccioli",
    description:
      "Connettiti con famiglie serie che cercano esattamente la tua razza. Gestisci la lista d'attesa direttamente dalla piattaforma.",
  },
  {
    icon: Scale,
    title: "Supporto legale",
    description:
      "Modelli di contratto professionali per ogni tipo di accordo. Tutela nei confronti di acquirenti scorretti e documentazione sempre in ordine.",
  },
  {
    icon: MessageCircle,
    title: "Supporta i tuoi acquirenti",
    description:
      "Condividi risorse di socializzazione e informazioni sanitarie specifiche per razza direttamente con le famiglie che adottano da te.",
  },
  {
    icon: CreditCard,
    title: "Pagamenti sicuri e registro cucciolate",
    description:
      "Lista d'attesa integrata, strumenti per la gestione delle cucciolate, pagamenti protetti sulla piattaforma e archivio documenti.",
  },
  {
    icon: Shield,
    title: "La tua reputazione, protetta",
    description:
      "Solo famiglie che hanno acquistato tramite la piattaforma possono lasciare una recensione. Nessuna recensione anonima, nessun abuso.",
  },
];

const steps = [
  {
    number: "01",
    title: "Registrati",
    description: "Compila il nostro questionario. Ci racconta il tuo allevamento, le razze, le certificazioni e le tue pratiche.",
  },
  {
    number: "02",
    title: "Verifica del profilo",
    description: "Il nostro team esamina la tua candidatura e verifica la certificazione ENCI. Non puoi pagare per entrare.",
  },
  {
    number: "03",
    title: "Entra nella community",
    description: "Ricevi il badge di allevatore verificato, il profilo personalizzato e inizia a ricevere richieste da famiglie serie.",
  },
];

const testimonials = [
  {
    quote:
      "Da quando sono su AllevatoriItalia ricevo solo richieste serie. Le famiglie arrivano già informate sulla razza — è una differenza enorme.",
    name: "Marco R.",
    kennel: "Allevamento della Valle",
    breed: "Labrador Retriever",
  },
  {
    quote:
      "I pagamenti gestiti dalla piattaforma mi hanno tolto un peso enorme. Niente più caparre informali o discussioni su bonifici.",
    name: "Giulia T.",
    kennel: "Kennel Quattro Zampe",
    breed: "Golden Retriever",
  },
  {
    quote:
      "La visibilità sulle schede razza è fantastica. Mi trovano famiglie che non avrei mai raggiunto altrimenti.",
    name: "Antonio M.",
    kennel: "Allevamento Sole e Terra",
    breed: "Pastore Maremmano",
  },
];

const faqs = [
  {
    q: "Chi siete?",
    a: `${SITE_NAME} è una piattaforma italiana costruita da appassionati di cani per connettere allevatori certificati con famiglie che cercano un cucciolo responsabilmente. Non siamo un sito di annunci — siamo una rete selezionata.`,
  },
  {
    q: "Quanto costa iscriversi?",
    a: `Iscriversi a ${SITE_NAME} è completamente gratuito. Non puoi nemmeno pagare per entrare — l'unico requisito è rispettare i nostri standard.`,
  },
  {
    q: "Come guadagna la piattaforma?",
    a: `${SITE_NAME} guadagna solo quando collochi con successo un cucciolo tramite la piattaforma. Viene trattenuta una piccola percentuale sull'importo della transazione. Nessun abbonamento, nessun costo fisso — paghiamo insieme solo al successo.`,
  },
  {
    q: "Perché usare i pagamenti della piattaforma?",
    a: "I pagamenti sulla piattaforma sono protetti, tracciati e documentati. Eviti caparre informali, rischi di insolvenza e controversie non documentate. In caso di problema, hai uno storico completo a tua disposizione.",
  },
  {
    q: "Posso fissare liberamente il prezzo dei miei cuccioli?",
    a: "Sì, hai il controllo totale sul prezzo di listino. Vedi sempre in anticipo il tuo guadagno netto prima di confermare un collocamento.",
  },
  {
    q: "Come viene protetta la mia privacy?",
    a: `Teniamo tutte le informazioni al sicuro e non le condividiamo mai senza il tuo consenso. Non abbiamo mai venduto dati a terze parti.`,
  },
];

export default function PerAllevatoriPage() {
  return (
    <div className="bg-background">

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="pt-20 pb-16 md:pt-28 md:pb-20 text-center border-b border-border">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-secondary text-sm font-medium uppercase tracking-widest mb-4">Per allevatori</p>
          <h1 className="font-serif text-5xl md:text-6xl text-foreground leading-tight mb-6">
            Il supporto che tu e i tuoi cani meritate
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed mb-10">
            Una piattaforma sicura per allevatori certificati che vogliono connettersi
            con acquirenti seri, proteggere i propri pagamenti e far crescere la propria reputazione.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/registrati">
              <Button size="lg">
                Registrati gratuitamente
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/come-funziona">
              <Button size="lg" variant="outline">
                Come funziona per le famiglie
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Free perks ────────────────────────────────────────────────────── */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="font-serif text-4xl md:text-5xl text-foreground mb-4">
              I membri della nostra community ricevono gratuitamente…
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {freePerks.map((perk, i) => (
              <div key={i} className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-light mb-6">
                  <perk.icon className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-3">{perk.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{perk.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Services ──────────────────────────────────────────────────────── */}
      <section className="py-20 bg-muted/40 border-y border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-secondary text-sm font-medium uppercase tracking-widest mb-3">Strumenti</p>
            <h2 className="font-serif text-4xl md:text-5xl text-foreground mb-4">
              Pensa ai tuoi cani.<br />Al resto ci pensiamo noi.
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Tutto ciò di cui hai bisogno per gestire le cucciolate, collocare i cuccioli
              e costruire la tua reputazione — in un unico posto.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((s, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary-light mb-4">
                    <s.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">{s.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{s.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── How to join ───────────────────────────────────────────────────── */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-secondary text-sm font-medium uppercase tracking-widest mb-3">Come si entra</p>
            <h2 className="font-serif text-4xl md:text-5xl text-foreground mb-4">
              Come diventare un allevatore verificato
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Ogni allevatore nella nostra community viene verificato. Ecco come funziona.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {steps.map((step, i) => (
              <div key={i} className="flex gap-6">
                <div className="font-serif text-5xl text-border leading-none shrink-0 select-none pt-1">{step.number}</div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">{step.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-14">
            <Link href="/registrati">
              <Button size="lg">
                Inizia ora — è gratuito
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Testimonials ──────────────────────────────────────────────────── */}
      <section className="py-20 bg-muted/40 border-y border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-secondary text-sm font-medium uppercase tracking-widest mb-3">Community</p>
            <h2 className="font-serif text-4xl md:text-5xl text-foreground">
              Cosa dicono gli allevatori
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <Card key={i}>
                <CardContent className="p-8">
                  <div className="flex gap-0.5 mb-5">
                    {[...Array(5)].map((_, j) => (
                      <Star key={j} className="h-4 w-4 fill-secondary text-secondary" />
                    ))}
                  </div>
                  <p className="text-muted-foreground leading-relaxed text-sm mb-6 italic">
                    &ldquo;{t.quote}&rdquo;
                  </p>
                  <div>
                    <div className="font-semibold text-foreground text-sm">{t.name}</div>
                    <div className="text-xs text-muted-foreground">{t.kennel} · {t.breed}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── Right to breed statement ──────────────────────────────────────── */}
      <section className="py-20 bg-primary text-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Lock className="h-10 w-10 text-white/30 mx-auto mb-6" />
          <h2 className="font-serif text-4xl md:text-5xl font-normal mb-6">
            Proteggiamo insieme il diritto di allevare responsabilmente
          </h2>
          <p className="text-white/70 leading-relaxed text-lg mb-10">
            {SITE_NAME} non è solo una vetrina. È una community di allevatori certificati
            che credono nella qualità, nella trasparenza e nel benessere animale.
            Unirsi significa far parte di qualcosa di più grande — e avere al proprio fianco
            una piattaforma che ti supporta in ogni passo.
          </p>
          <Link href="/registrati">
            <Button size="lg" className="bg-white text-primary hover:bg-white/90 shadow-none">
              Unisciti alla community
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────────────────────────── */}
      <section className="py-20 border-t border-border">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-secondary text-sm font-medium uppercase tracking-widest mb-3">FAQ</p>
            <h2 className="font-serif text-4xl text-foreground">Domande frequenti</h2>
          </div>
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <h3 className="font-semibold text-foreground mb-2">{faq.q}</h3>
                  <p className="text-muted-foreground leading-relaxed text-sm">{faq.a}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ─────────────────────────────────────────────────────── */}
      <section className="py-16 border-t border-border text-center">
        <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="font-serif text-3xl md:text-4xl text-foreground mb-6">
            La vita è più bella con un cane ben allevato.
          </p>
          <p className="text-muted-foreground mb-8">
            Registrati gratuitamente e unisciti alla rete degli allevatori certificati in Italia.
          </p>
          <Link href="/registrati">
            <Button size="lg">
              Registrati ora
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

    </div>
  );
}
