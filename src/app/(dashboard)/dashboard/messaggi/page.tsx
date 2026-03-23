import { MessageCircle, Search } from "lucide-react";
import Card, { CardContent } from "@/components/ui/Card";

export default function MessaggiPage() {
  const conversations = [
    {
      id: "1",
      name: "Marco Rossi",
      lastMessage: "Buongiorno, avete cuccioli disponibili?",
      time: "2 ore fa",
      unread: true,
      breed: "Labrador Retriever",
    },
    {
      id: "2",
      name: "Giulia Bianchi",
      lastMessage: "Vorrei prenotare una visita all'allevamento",
      time: "5 ore fa",
      unread: true,
      breed: "Golden Retriever",
    },
    {
      id: "3",
      name: "Luca Verdi",
      lastMessage: "Grazie per le informazioni!",
      time: "1 giorno fa",
      unread: false,
      breed: "Labrador Retriever",
    },
    {
      id: "4",
      name: "Anna Neri",
      lastMessage: "Quando sara disponibile la prossima cucciolata?",
      time: "3 giorni fa",
      unread: false,
      breed: "Golden Retriever",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Messaggi</h1>
        <p className="text-muted-foreground">
          Gestisci le conversazioni con i potenziali acquirenti
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Cerca conversazioni..."
          className="w-full pl-10 pr-4 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <Card>
        <div className="divide-y divide-border">
          {conversations.map((conv) => (
            <div
              key={conv.id}
              className="flex items-start gap-3 p-4 hover:bg-muted transition-colors cursor-pointer"
            >
              <div className="w-10 h-10 bg-primary-light rounded-full flex items-center justify-center text-sm font-semibold text-primary-dark shrink-0">
                {conv.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium flex items-center gap-2">
                    {conv.name}
                    {conv.unread && (
                      <span className="w-2 h-2 bg-primary rounded-full" />
                    )}
                  </h3>
                  <span className="text-xs text-muted-foreground">
                    {conv.time}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground truncate">
                  {conv.lastMessage}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Re: {conv.breed}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {conversations.length === 0 && (
        <div className="text-center py-12">
          <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-medium mb-1">Nessun messaggio</h3>
          <p className="text-sm text-muted-foreground">
            I messaggi dei potenziali acquirenti appariranno qui
          </p>
        </div>
      )}
    </div>
  );
}
