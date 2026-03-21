import { Metadata } from "next";
import Link from "next/link";
import Card, { CardContent } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { razze, gruppiFCI } from "@/data/razze";

export const metadata: Metadata = {
  title: "Razze di Cani",
  description:
    "Scopri tutte le razze di cani disponibili in Italia. Trova allevatori specializzati per ogni razza.",
};

export default function RazzePage() {
  const breedsByGroup = razze.reduce(
    (acc, breed) => {
      const group = breed.group_fci;
      if (!acc[group]) acc[group] = [];
      acc[group].push(breed);
      return acc;
    },
    {} as Record<number, typeof razze>
  );

  const italianBreeds = razze.filter((r) => r.is_italian_breed);

  return (
    <div className="min-h-screen bg-muted">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold mb-2">Razze di Cani</h1>
        <p className="text-muted-foreground mb-8">
          Esplora {razze.length} razze e trova l&apos;allevatore giusto per te
        </p>

        {/* Italian Breeds Section */}
        <div className="mb-12">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <span>🇮🇹</span> Razze Italiane
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {italianBreeds.map((breed) => (
              <Link key={breed.slug} href={`/razze/${breed.slug}`}>
                <Card hover>
                  <CardContent className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center shrink-0">
                      🇮🇹
                    </div>
                    <div>
                      <h3 className="font-medium">{breed.name_it}</h3>
                      <p className="text-xs text-muted-foreground">
                        {breed.name_en}
                      </p>
                    </div>
                    <Badge variant="outline" className="ml-auto">
                      {breed.size_category}
                    </Badge>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* All Breeds by FCI Group */}
        {Object.entries(breedsByGroup)
          .sort(([a], [b]) => Number(a) - Number(b))
          .map(([group, breeds]) => (
            <div key={group} className="mb-10">
              <h2 className="text-xl font-bold mb-1">
                Gruppo {group}
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                {gruppiFCI[Number(group)]}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {breeds.map((breed) => (
                  <Link key={breed.slug} href={`/razze/${breed.slug}`}>
                    <Card hover>
                      <CardContent className="flex items-center gap-3 py-3">
                        <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center shrink-0 text-lg">
                          {breed.is_italian_breed ? "🇮🇹" : "🐕"}
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-medium text-sm truncate">
                            {breed.name_it}
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            {breed.origin_country}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
