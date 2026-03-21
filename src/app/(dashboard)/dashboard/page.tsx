import { Eye, MessageCircle, Star, Megaphone } from "lucide-react";
import Card, { CardContent, CardHeader } from "@/components/ui/Card";

export default function DashboardPage() {
  const stats = [
    {
      label: "Visualizzazioni profilo",
      value: "1.234",
      icon: Eye,
      change: "+12%",
    },
    {
      label: "Messaggi ricevuti",
      value: "28",
      icon: MessageCircle,
      change: "+5",
    },
    {
      label: "Recensioni",
      value: "24",
      icon: Star,
      change: "+2",
    },
    {
      label: "Annunci attivi",
      value: "3",
      icon: Megaphone,
      change: "0",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Panoramica del tuo allevamento
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="py-4">
              <div className="flex items-center justify-between mb-2">
                <stat.icon className="h-5 w-5 text-muted-foreground" />
                <span className="text-xs text-green-600 font-medium">
                  {stat.change}
                </span>
              </div>
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="text-sm text-muted-foreground">
                {stat.label}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <h2 className="font-semibold">Messaggi Recenti</h2>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              {
                name: "Marco Rossi",
                message: "Buongiorno, avete cuccioli disponibili?",
                time: "2 ore fa",
              },
              {
                name: "Giulia Bianchi",
                message: "Vorrei prenotare una visita all'allevamento",
                time: "5 ore fa",
              },
              {
                name: "Luca Verdi",
                message: "Grazie per le informazioni!",
                time: "1 giorno fa",
              },
            ].map((msg) => (
              <div
                key={msg.name}
                className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted transition-colors cursor-pointer"
              >
                <div className="w-9 h-9 bg-primary-light rounded-full flex items-center justify-center text-xs font-semibold text-primary-dark shrink-0">
                  {msg.name.charAt(0)}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium">{msg.name}</p>
                  <p className="text-sm text-muted-foreground truncate">
                    {msg.message}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {msg.time}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="font-semibold">Ultime Recensioni</h2>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              {
                author: "Anna M.",
                rating: 5,
                text: "Esperienza fantastica!",
                date: "3 giorni fa",
              },
              {
                author: "Paolo R.",
                rating: 4,
                text: "Ottimo allevamento, cucciolo bellissimo.",
                date: "1 settimana fa",
              },
              {
                author: "Sara L.",
                rating: 5,
                text: "Professionali e disponibili.",
                date: "2 settimane fa",
              },
            ].map((review) => (
              <div
                key={review.author}
                className="p-3 rounded-lg hover:bg-muted transition-colors"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">{review.author}</span>
                  <div className="flex">
                    {Array.from({ length: 5 }, (_, i) => (
                      <span
                        key={i}
                        className={`text-xs ${
                          i < review.rating
                            ? "text-yellow-400"
                            : "text-gray-200"
                        }`}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{review.text}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {review.date}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
