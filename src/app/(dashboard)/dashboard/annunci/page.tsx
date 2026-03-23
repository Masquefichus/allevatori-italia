import Link from "next/link";
import { Plus, Eye, Edit, Trash2 } from "lucide-react";
import Button from "@/components/ui/Button";
import Card, { CardContent, CardHeader } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";

export default function AnnunciPage() {
  const listings = [
    {
      id: "1",
      title: "Cuccioli di Labrador Retriever",
      breed: "Labrador Retriever",
      status: "attivo" as const,
      puppies: 4,
      price: "1.500 - 2.000",
      views: 234,
      date: "10 Mar 2026",
    },
    {
      id: "2",
      title: "Cucciolata Golden Retriever",
      breed: "Golden Retriever",
      status: "attivo" as const,
      puppies: 6,
      price: "1.800 - 2.500",
      views: 189,
      date: "5 Mar 2026",
    },
    {
      id: "3",
      title: "Cuccioli Labrador cioccolato",
      breed: "Labrador Retriever",
      status: "venduto" as const,
      puppies: 0,
      price: "1.500",
      views: 567,
      date: "15 Gen 2026",
    },
  ];

  const statusBadge = {
    attivo: "success" as const,
    venduto: "default" as const,
    scaduto: "destructive" as const,
    bozza: "outline" as const,
  };

  const statusLabel = {
    attivo: "Attivo",
    venduto: "Venduto",
    scaduto: "Scaduto",
    bozza: "Bozza",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Annunci</h1>
          <p className="text-muted-foreground">
            Gestisci i tuoi annunci di cuccioli
          </p>
        </div>
        <Link href="/dashboard/annunci/nuovo">
          <Button>
            <Plus className="h-4 w-4" />
            Nuovo Annuncio
          </Button>
        </Link>
      </div>

      <div className="space-y-4">
        {listings.map((listing) => (
          <Card key={listing.id}>
            <CardContent className="flex flex-col sm:flex-row items-start sm:items-center gap-4 py-4">
              <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center text-2xl shrink-0">
                🐕
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-medium truncate">{listing.title}</h3>
                  <Badge variant={statusBadge[listing.status]}>
                    {statusLabel[listing.status]}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {listing.breed} &middot; {listing.puppies} cuccioli &middot;
                  &euro;{listing.price}
                </p>
                <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    {listing.views} visualizzazioni
                  </span>
                  <span>Pubblicato il {listing.date}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Button variant="ghost" size="sm">
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
