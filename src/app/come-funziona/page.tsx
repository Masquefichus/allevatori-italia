import { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Search,
  MessageCircle,
  Heart,
  Shield,
  Star,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import Button from "@/components/ui/Button";
import Card, { CardContent } from "@/components/ui/Card";
import { SITE_NAME } from "@/lib/constants";

export const metadata: Metadata = {
  title: `Come funziona | ${SITE_NAME}`,
  description: `Scopri come ${SITE_NAME} ti aiuta a trovare il cane giusto, con fiducia e trasparenza. Allevatori certificati ENCI, standard verificati.`,
};

const steps = [
  {
    icon: Search,
    number: "01",
    title: "Cerca per razza o regione",
    description:
      "Esplora 359 razze riconosciute FCI con schede dettagliate su carattere, taglia, energia e compatibilità. Quando trovi la razza giusta, vedi direttamente gli allevatori certificati che la allevano.",
  },
  {
    icon: Shield,
    number: "02",
    title: "Ogni allevatore è già stato verificato",
    description:
      "Non devi fare tu il lavoro di controllo. Prima che un allevatore appaia su AllevatoriItalia, il nostro team verifica la certificazione ENCI, le pratiche di allevamento e gli standard di benessere. Solo chi passa entra.",
  },
  {
    icon: MessageCircle,
    number: "03",
    title: "Connettiti direttamente",
    description:
      "Contatta l'allevatore, fai domande, visita il kennel. Leggi le recensioni lasciate da famiglie reali che hanno già adottato. Nessun intermediario, nessuna opacità.",
  },
  {
    icon: Heart,
    number: "04",
    title: "Porta a casa il tuo cane con fiducia",
    description:
      "Il cucciolo viene con pedigree, certificazioni sanitarie e tutto il supporto dell'allevatore. Il pagamento è gestito in modo sicuro sulla piattaforma — protetto per te, tracciato per tutti.",
  },
];

const problems = [
  "Annunci senza informazioni sull'allevatore",
  "Nessun modo per verificare la certificazione ENCI",
  "Foto attraenti ma nessuna garanzia sanitaria",
  "Venditori improvvisati che si spacciano per allevatori",
  "Pagamenti non protetti e nessun contratto",
  "Cuccioli socializzati male o con problemi di salute nascosti",
];

const standards = [
  {
    icon: Shield,
    title: "Certificazione ENCI",
    description:
      "Solo allevatori registrati presso l'Ente Nazionale della Cinofilia Italiana. La certificazione è verificata dal nostro team, non autodichiarata.",
  },
  {
    icon: Heart,
    title: "Salute e socializzazione",
    description:
      "Valutiamo le pratiche di socializzazione dei cuccioli — esposizione a suoni, persone, altri animali — nei primi mesi di vita. Un cucciolo ben socializzato è un cane equilibrato.",
  },
  {
    icon: Star,
    title: "Ambiente e cura",
    description:
      "Gli ambienti devono essere puliti, sicuri e stimolanti. Verifichiamo che i cani abbiano spazio, attività fisica e interazione quotidiana.",
  },
  {
    icon: CheckCircle,
    title: "Trasparenza con gli acquirenti",
    description:
      "L'allevatore deve essere disponibile a rispondere alle domande, a mostrare i genitori e a fornire tutta la documentazione sanitaria prima della vendita.",
  },
];

const faqs = [
  {
    q: "Come posso essere sicuro che l'allevatore sia affidabile?",
    a: `Ogni allevatore su ${SITE_NAME} ha superato la nostra verifica prima di essere pubblicato. Controlliamo la certificazione ENCI, le pratiche dichiarate e raccogliamo recensioni verificate da famiglie reali. Non puoi pagare per entrare nella piattaforma — l'unico criterio è rispettare i nostri standard.`,
  },
  {
    q: "I pagamenti sono sicuri?",
    a: `Sì. I pagamenti gestiti tramite ${SITE_NAME} sono protetti e tracciati. Hai sempre una documentazione completa della transazione e, in caso di problemi, il nostro team è a tua disposizione.`,
  },
  {
    q: "Posso visitare il kennel prima di acquistare?",
    a: "Assolutamente sì, e te lo consigliamo. Un allevatore serio non ha nulla da nascondere. Usa la messaggistica della piattaforma per organizzare la visita e fai tutte le domande che vuoi prima di decidere.",
  },
  {
    q: "Cosa succede se ho un problema dopo l'acquisto?",
    a: `Le recensioni sulla piattaforma sono visibili a tutti e non possono essere rimosse dall'allevatore. In caso di controversia, ${SITE_NAME} ha accesso allo storico completo della transazione e può supportarti.`,
  },
  {
    q: "Come vengono selezionate le razze mostrate?",
    a: "Mostriamo tutte le 359 razze ufficialmente riconosciute dalla FCI — la Fédération Cynologique Internationale, l'organizzazione cinofila mondiale. Ogni scheda razza include dati su carattere, taglia, energia, compatibilità e allevatori disponibili.",
  },
];

export default function ComeFunzionaPage() {
  return (
    <div className="bg-background">

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="pt-20 pb-16 md:pt-28 md:pb-20 text-center border-b border-border">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-secondary text-sm font-medium uppercase tracking-widest mb-4">Come funziona</p>
          <h1 className="font-serif text-5xl md:text-6xl text-foreground leading-tight mb-6">
            Trovare il cane giusto non dovrebbe essere rischioso
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            Un cane è molto più di un cane — è un membro della famiglia e un amico per tutta la vita.
            {SITE_NAME} è nato per assicurarsi che tu possa trovarlo con fiducia, trasparenza e serenità.
          </p>
        </div>
      </section>

      {/* ── The problem ───────────────────────────────────────────────────── */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-secondary text-sm font-medium uppercase tracking-widest mb-4">Il problema</p>
              <h2 className="font-serif text-4xl md:text-5xl text-foreground mb-6">
                Il mercato dei cuccioli è pieno di insidie
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-6">
                Chi cerca un cucciolo si trova spesso di fronte a annunci anonimi, venditori senza
                certificazioni e nessuna garanzia reale. È difficile distinguere un allevatore serio
                da chi alleva in modo irresponsabile — e le conseguenze possono essere molto dolorose,
                per te e per il tuo cane.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                {SITE_NAME} risolve questo problema a monte: selezioniamo gli allevatori prima
                che tu li veda. Così puoi cercare serenamente, sapendo che chiunque trovi
                sulla piattaforma ha già superato la nostra verifica.
              </p>
            </div>
            <div>
              <div className="bg-white rounded-2xl border border-border p-8 shadow-sm">
                <div className="flex items-center gap-2 mb-6">
                  <AlertTriangle className="h-5 w-5 text-secondary" />
                  <span className="text-sm font-semibold text-foreground">Rischi comuni senza una piattaforma verificata</span>
                </div>
                <ul className="space-y-4">
                  {problems.map((p) => (
                    <li key={p} className="flex items-start gap-3 text-sm text-muted-foreground">
                      <span className="w-1.5 h-1.5 rounded-full bg-secondary mt-2 shrink-0" />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── How it works: 4 steps ─────────────────────────────────────────── */}
      <section className="py-20 bg-muted/40 border-y border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-secondary text-sm font-medium uppercase tracking-widest mb-3">Il percorso</p>
            <h2 className="font-serif text-4xl md:text-5xl text-foreground mb-4">
              Dalla ricerca al benvenuto a casa
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Ogni passo è pensato per darti certezze, non ansie.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {steps.map((step, i) => (
              <Card key={i}>
                <CardContent className="p-8">
                  <div className="flex items-start gap-6">
                    <div className="font-serif text-5xl text-border leading-none shrink-0 select-none">{step.number}</div>
                    <div>
                      <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-primary-light mb-4">
                        <step.icon className="h-5 w-5 text-primary" />
                      </div>
                      <h3 className="text-lg font-semibold text-foreground mb-2">{step.title}</h3>
                      <p className="text-muted-foreground leading-relaxed text-sm">{step.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link href="/allevatori">
              <Button size="lg">
                Cerca un allevatore
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Our standards ─────────────────────────────────────────────────── */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-secondary text-sm font-medium uppercase tracking-widest mb-3">I nostri standard</p>
            <h2 className="font-serif text-4xl md:text-5xl text-foreground mb-4">
              Cosa verifichiamo prima che tu li veda
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Siamo impegnati nella salute e nel benessere dei cani — e nella tua serenità.
              Questi sono i criteri che ogni allevatore deve rispettare.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {standards.map((s, i) => (
              <Card key={i}>
                <CardContent className="p-8 flex gap-6">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary-light shrink-0 self-start">
                    <s.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">{s.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{s.description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── Commitment statement ──────────────────────────────────────────── */}
      <section className="py-20 bg-primary text-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-serif text-4xl md:text-5xl font-normal mb-6">
            "Perfetto" non deve essere nemico del "buono"
          </h2>
          <p className="text-white/70 leading-relaxed text-lg mb-8">
            Non stiamo cercando solo gli allevatori con più titoli o le strutture più grandi.
            Stiamo cercando allevatori seri — certificati, trasparenti, e davvero appassionati
            del benessere delle loro razze. Questo è lo standard che protegge te.
          </p>
          <Link href="/allevatori">
            <Button size="lg" className="bg-white text-primary hover:bg-white/90 shadow-none">
              Trova il tuo allevatore
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
            La vita è più bella con un cane.
          </p>
          <p className="text-muted-foreground mb-8">
            Inizia la ricerca oggi — con la certezza di essere nel posto giusto.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/allevatori">
              <Button size="lg">Cerca un allevatore <ArrowRight className="h-4 w-4" /></Button>
            </Link>
            <Link href="/razze">
              <Button size="lg" variant="outline">Esplora le razze</Button>
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
