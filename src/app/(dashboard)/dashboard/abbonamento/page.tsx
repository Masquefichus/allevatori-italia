import { Check, Info, TrendingUp, Shield, HeartHandshake } from "lucide-react";
import Card, { CardContent } from "@/components/ui/Card";

export default function AbbonamentoPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Commissioni</h1>
        <p className="text-muted-foreground">
          Come funziona il nostro modello — gratis finché non vendi.
        </p>
      </div>

      {/* Main commission card */}
      <Card>
        <CardContent className="py-8">
          <div className="flex flex-col md:flex-row md:items-center gap-8">
            <div className="flex-1">
              <p className="text-sm font-medium text-secondary uppercase tracking-widest mb-2">Modello commissioni</p>
              <h2 className="text-4xl font-bold text-foreground mb-3">6,5%</h2>
              <p className="text-muted-foreground leading-relaxed max-w-md">
                Paghi solo quando trovi una famiglia per i tuoi cuccioli.
                Nessun abbonamento mensile, nessun costo fisso — sei libero di registrarti,
                creare il tuo profilo e pubblicare i tuoi annunci senza spendere nulla.
              </p>
            </div>
            <div className="bg-muted rounded-2xl p-6 min-w-[220px]">
              <p className="text-sm text-muted-foreground mb-3">Esempio</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Prezzo cucciolo</span>
                  <span className="font-medium">€1.200</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Commissione (6,5%)</span>
                  <span className="font-medium">€78</span>
                </div>
                <div className="border-t border-border pt-2 flex justify-between">
                  <span className="font-medium">Ricevi</span>
                  <span className="font-bold text-foreground">€1.122</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* What's included */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Cosa è incluso — senza costi aggiuntivi</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { icon: Check, label: "Profilo allevamento completo" },
            { icon: Check, label: "Foto e gallery illimitate" },
            { icon: Check, label: "Annunci senza limite" },
            { icon: Check, label: "Messaggistica con acquirenti" },
            { icon: Check, label: "Badge allevatore verificato" },
            { icon: Check, label: "Statistiche profilo" },
            { icon: Check, label: "Supporto dedicato" },
            { icon: Check, label: "Protezione pagamenti" },
            { icon: Check, label: "Visibilità nei risultati di ricerca" },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-3 bg-white border border-border rounded-xl px-4 py-3">
              <Icon className="h-4 w-4 text-secondary shrink-0" />
              <span className="text-sm">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Why this model */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="py-6">
            <TrendingUp className="h-6 w-6 text-secondary mb-3" />
            <h4 className="font-semibold mb-1">Allineati ai tuoi successi</h4>
            <p className="text-sm text-muted-foreground">Guadagniamo solo quando tu guadagni — il nostro incentivo è portarti le famiglie giuste.</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-6">
            <Shield className="h-6 w-6 text-secondary mb-3" />
            <h4 className="font-semibold mb-1">Pagamenti protetti</h4>
            <p className="text-sm text-muted-foreground">La commissione copre la protezione dei pagamenti — niente rischi di frode o chargeback imprevisti.</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-6">
            <HeartHandshake className="h-6 w-6 text-secondary mb-3" />
            <h4 className="font-semibold mb-1">Zero rischio iniziale</h4>
            <p className="text-sm text-muted-foreground">Prova la piattaforma, costruisci il tuo profilo e vedi i risultati prima di spendere un euro.</p>
          </CardContent>
        </Card>
      </div>

      {/* Info note */}
      <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-800">
        <Info className="h-4 w-4 shrink-0 mt-0.5" />
        <p>La commissione viene applicata al prezzo di vendita concordato tra allevatore e acquirente al momento della conferma del collocamento. Il pagamento avviene tramite la piattaforma sicura integrata.</p>
      </div>
    </div>
  );
}
