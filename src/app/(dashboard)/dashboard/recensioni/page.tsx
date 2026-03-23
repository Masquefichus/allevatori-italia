import Card, { CardContent, CardHeader } from "@/components/ui/Card";
import Rating from "@/components/ui/Rating";
import Badge from "@/components/ui/Badge";

export default function RecensioniPage() {
  const reviews = [
    {
      id: "1",
      author: "Marco R.",
      rating: 5,
      title: "Esperienza fantastica",
      content:
        "Il nostro Labrador e arrivato sano, vaccinato e gia socializzato. L'allevatore ci ha seguito anche dopo l'acquisto.",
      date: "15 Feb 2026",
      approved: true,
    },
    {
      id: "2",
      author: "Giulia M.",
      rating: 5,
      title: "Allevamento serio",
      content:
        "Allevamento serio e professionale. I cani sono tenuti benissimo. Consigliatissimo!",
      date: "3 Gen 2026",
      approved: true,
    },
    {
      id: "3",
      author: "Luca P.",
      rating: 4,
      title: "Ottima esperienza",
      content:
        "Cucciolo bellissimo con tutti i documenti in regola. Tempi di attesa un po' lunghi.",
      date: "20 Dic 2025",
      approved: true,
    },
    {
      id: "4",
      author: "Sara T.",
      rating: 5,
      title: "Il migliore!",
      content: "Non potevamo trovare allevamento migliore. Grazie di tutto!",
      date: "10 Dic 2025",
      approved: false,
    },
  ];

  const avgRating =
    reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Recensioni</h1>
        <p className="text-muted-foreground">
          Le recensioni ricevute dai tuoi clienti
        </p>
      </div>

      {/* Summary */}
      <Card>
        <CardContent className="py-6 flex items-center gap-8">
          <div className="text-center">
            <div className="text-4xl font-bold">{avgRating.toFixed(1)}</div>
            <Rating value={avgRating} size="sm" />
            <p className="text-sm text-muted-foreground mt-1">
              {reviews.length} recensioni
            </p>
          </div>
          <div className="flex-1 space-y-1">
            {[5, 4, 3, 2, 1].map((stars) => {
              const count = reviews.filter((r) => r.rating === stars).length;
              const pct = (count / reviews.length) * 100;
              return (
                <div key={stars} className="flex items-center gap-2 text-sm">
                  <span className="w-3">{stars}</span>
                  <span className="text-yellow-400 text-xs">★</span>
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-yellow-400 rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-6 text-xs text-muted-foreground text-right">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.map((review) => (
          <Card key={review.id}>
            <CardContent className="py-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary-light rounded-full flex items-center justify-center text-sm font-semibold text-primary-dark">
                    {review.author.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">
                        {review.author}
                      </span>
                      {!review.approved && (
                        <Badge variant="secondary">In attesa</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {review.date}
                    </p>
                  </div>
                </div>
                <Rating value={review.rating} size="sm" />
              </div>
              {review.title && (
                <h3 className="font-medium text-sm mb-1">{review.title}</h3>
              )}
              <p className="text-sm text-muted-foreground">{review.content}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
