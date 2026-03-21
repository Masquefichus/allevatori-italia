import { Users, Building2, Star, CreditCard } from "lucide-react";
import Card, { CardContent, CardHeader } from "@/components/ui/Card";

export default function AdminDashboard() {
  const stats = [
    { label: "Utenti totali", value: "1.234", icon: Users, color: "text-blue-600" },
    { label: "Allevatori", value: "156", icon: Building2, color: "text-green-600" },
    { label: "Recensioni", value: "432", icon: Star, color: "text-yellow-600" },
    { label: "Abbonati Premium", value: "42", icon: CreditCard, color: "text-purple-600" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="py-4">
              <stat.icon className={`h-6 w-6 ${stat.color} mb-2`} />
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <h2 className="font-semibold">Allevatori in Attesa di Approvazione</h2>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { name: "Nuovo Allevamento Roma", region: "Lazio", date: "Oggi" },
              { name: "Cuccioli d'Oro", region: "Toscana", date: "Ieri" },
              { name: "Pastori del Sud", region: "Puglia", date: "2 giorni fa" },
            ].map((breeder) => (
              <div
                key={breeder.name}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-muted"
              >
                <div>
                  <p className="text-sm font-medium">{breeder.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {breeder.region} &middot; {breeder.date}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full hover:bg-green-200">
                    Approva
                  </button>
                  <button className="text-xs bg-red-100 text-red-700 px-3 py-1 rounded-full hover:bg-red-200">
                    Rifiuta
                  </button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="font-semibold">Recensioni da Moderare</h2>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              {
                author: "Sara T.",
                breeder: "Allevamento Del Sole",
                rating: 5,
                date: "Oggi",
              },
              {
                author: "Paolo G.",
                breeder: "Casa dei Molossi",
                rating: 2,
                date: "Ieri",
              },
              {
                author: "Chiara L.",
                breeder: "Lagotto dei Colli",
                rating: 4,
                date: "3 giorni fa",
              },
            ].map((review) => (
              <div
                key={review.author}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-muted"
              >
                <div>
                  <p className="text-sm font-medium">
                    {review.author} → {review.breeder}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {review.rating}/5 stelle &middot; {review.date}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full hover:bg-green-200">
                    Approva
                  </button>
                  <button className="text-xs bg-red-100 text-red-700 px-3 py-1 rounded-full hover:bg-red-200">
                    Rimuovi
                  </button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
