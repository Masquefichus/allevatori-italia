import { Check, Crown } from "lucide-react";
import Button from "@/components/ui/Button";
import Card, { CardContent, CardHeader } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { SUBSCRIPTION_PLANS } from "@/lib/constants";

export default function AbbonamentoPage() {
  const currentPlan = "base";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Abbonamento</h1>
        <p className="text-muted-foreground">
          Gestisci il tuo piano e sblocca funzionalita premium
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Object.entries(SUBSCRIPTION_PLANS).map(([key, plan]) => (
          <Card
            key={key}
            className={
              key === "premium"
                ? "ring-2 ring-primary relative"
                : ""
            }
          >
            {key === "premium" && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge variant="primary" className="flex items-center gap-1">
                  <Crown className="h-3 w-3" />
                  Consigliato
                </Badge>
              </div>
            )}
            <CardHeader className="text-center">
              <h3 className="text-lg font-bold">{plan.name}</h3>
              <div className="mt-2">
                {plan.price === 0 ? (
                  <span className="text-3xl font-bold">Gratis</span>
                ) : (
                  <div>
                    <span className="text-3xl font-bold">
                      &euro;{(plan.price / 100).toFixed(2)}
                    </span>
                    <span className="text-muted-foreground">/mese</span>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2">
                {plan.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-2 text-sm"
                  >
                    <Check className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Button
                className="w-full"
                variant={key === currentPlan ? "outline" : "primary"}
                disabled={key === currentPlan}
              >
                {key === currentPlan ? "Piano Attuale" : "Scegli Piano"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
