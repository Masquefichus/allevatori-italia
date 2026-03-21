import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, MapPin } from "lucide-react";
import Button from "@/components/ui/Button";
import Card, { CardContent } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { razze } from "@/data/razze";
import { SITE_NAME } from "@/lib/constants";

interface BreedPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: BreedPageProps): Promise<Metadata> {
  const { slug } = await params;
  const breed = razze.find((r) => r.slug === slug);
  if (!breed) {
    return { title: "Razza non trovata" };
  }
  return {
    title: `Allevatori di ${breed.name_it} in Italia`,
    description: `Trova allevatori professionali di ${breed.name_it} in Italia. Cuccioli disponibili con pedigree e certificazioni sanitarie.`,
  };
}

export default async function BreedDetailPage({ params }: BreedPageProps) {
  const { slug } = await params;
  const breed = razze.find((r) => r.slug === slug);

  if (!breed) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Razza non trovata</h1>
          <Link href="/razze">
            <Button variant="outline">Torna alle razze</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted">
      {/* Header */}
      <div className="bg-white border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link
            href="/razze"
            className="text-sm text-primary hover:underline flex items-center gap-1 mb-4"
          >
            <ArrowLeft className="h-3 w-3" />
            Tutte le razze
          </Link>

          <div className="flex items-start gap-6">
            <div className="w-24 h-24 bg-muted rounded-2xl flex items-center justify-center text-4xl shrink-0">
              {breed.is_italian_breed ? "🇮🇹" : "🐕"}
            </div>
            <div>
              <h1 className="text-3xl font-bold">{breed.name_it}</h1>
              <p className="text-muted-foreground">{breed.name_en}</p>
              <div className="flex flex-wrap gap-2 mt-3">
                <Badge variant="outline">
                  Gruppo FCI {breed.group_fci}
                </Badge>
                <Badge variant="outline">{breed.group_name_it}</Badge>
                <Badge variant="primary">
                  Taglia {breed.size_category}
                </Badge>
                {breed.is_italian_breed && (
                  <Badge variant="success">Razza Italiana</Badge>
                )}
                <Badge variant="outline">
                  Origine: {breed.origin_country}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-xl font-bold mb-6">
          Allevatori di {breed.name_it} in Italia
        </h2>

        <p className="text-muted-foreground mb-8">
          Connetti Supabase per visualizzare gli allevatori di {breed.name_it} registrati su {SITE_NAME}.
        </p>

        {/* Placeholder breeder cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} hover className="cursor-pointer">
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
