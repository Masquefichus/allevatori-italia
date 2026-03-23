import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, MapPin } from "lucide-react";
import Button from "@/components/ui/Button";
import Card, { CardContent } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { regioni, getRegioneBySlug } from "@/data/regioni";
import { SITE_NAME } from "@/lib/constants";

interface RegionPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: RegionPageProps): Promise<Metadata> {
  const { slug } = await params;
  const region = getRegioneBySlug(slug);
  if (!region) {
    return { title: "Regione non trovata" };
  }
  return {
    title: `Allevatori di Cani in ${region.nome}`,
    description: `Trova allevatori professionali di cani in ${region.nome}. Allevamenti certificati ENCI nelle province di ${region.province.map((p) => p.nome).join(", ")}.`,
  };
}

export default async function RegionDetailPage({ params }: RegionPageProps) {
  const { slug } = await params;
  const region = getRegioneBySlug(slug);

  if (!region) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Regione non trovata</h1>
          <Link href="/regioni">
            <Button variant="outline">Torna alle regioni</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted">
      <div className="bg-white border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link
            href="/regioni"
            className="text-sm text-primary hover:underline flex items-center gap-1 mb-4"
          >
            <ArrowLeft className="h-3 w-3" />
            Tutte le regioni
          </Link>

          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-primary-light rounded-2xl flex items-center justify-center">
              <MapPin className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">
                Allevatori in {region.nome}
              </h1>
              <p className="text-muted-foreground">
                {region.province.length} province
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mt-4">
            {region.province.map((p) => (
              <Badge key={p.sigla} variant="outline">
                {p.nome} ({p.sigla})
              </Badge>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <p className="text-muted-foreground mb-8">
          Connetti Supabase per visualizzare gli allevatori in {region.nome} registrati su {SITE_NAME}.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <div className="h-32 bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center">
                <span className="text-3xl">🐕</span>
              </div>
              <CardContent className="space-y-2">
                <div className="h-4 bg-muted rounded w-3/4 animate-pulse" />
                <div className="h-3 bg-muted rounded w-1/2 animate-pulse" />
                <div className="h-3 bg-muted rounded w-2/3 animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
