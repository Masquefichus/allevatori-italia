import { Metadata } from "next";
import Link from "next/link";
import { MapPin } from "lucide-react";
import Card, { CardContent } from "@/components/ui/Card";
import { regioni } from "@/data/regioni";

export const metadata: Metadata = {
  title: "Allevatori per Regione",
  description:
    "Trova allevatori di cani professionali nella tua regione. Tutte le 20 regioni italiane coperte.",
};

export default function RegioniPage() {
  return (
    <div className="min-h-screen bg-muted">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold mb-2">Allevatori per Regione</h1>
        <p className="text-muted-foreground mb-8">
          Trova allevatori di cani professionali in tutte le 20 regioni italiane
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {regioni.map((region) => (
            <Link key={region.slug} href={`/regioni/${region.slug}`}>
              <Card hover className="h-full">
                <CardContent className="text-center py-6">
                  <MapPin className="h-8 w-8 text-primary mx-auto mb-3" />
                  <h2 className="font-semibold text-lg">{region.nome}</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    {region.province.length} province
                  </p>
                  <div className="flex flex-wrap justify-center gap-1 mt-3">
                    {region.province.slice(0, 4).map((p) => (
                      <span
                        key={p.sigla}
                        className="text-xs bg-muted px-2 py-0.5 rounded"
                      >
                        {p.nome}
                      </span>
                    ))}
                    {region.province.length > 4 && (
                      <span className="text-xs text-muted-foreground">
                        +{region.province.length - 4}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
