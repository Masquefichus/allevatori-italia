import { Search } from "lucide-react";
import Card, { CardContent } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";

export default function AdminUtentiPage() {
  const users = [
    { name: "Mario Rossi", email: "mario@email.com", role: "breeder", status: "active", joined: "15 Gen 2026" },
    { name: "Laura Bianchi", email: "laura@email.com", role: "user", status: "active", joined: "20 Feb 2026" },
    { name: "Giuseppe Verdi", email: "giuseppe@email.com", role: "breeder", status: "active", joined: "1 Mar 2026" },
    { name: "Anna Neri", email: "anna@email.com", role: "user", status: "active", joined: "5 Mar 2026" },
    { name: "Paolo Gialli", email: "paolo@email.com", role: "admin", status: "active", joined: "1 Gen 2026" },
  ];

  const roleBadge = {
    user: "default" as const,
    breeder: "primary" as const,
    admin: "secondary" as const,
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Gestione Utenti</h1>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Cerca utenti..."
          className="w-full pl-10 pr-4 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-4 font-medium text-muted-foreground">Nome</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Email</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Ruolo</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Registrato</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Azioni</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.email} className="border-b border-border hover:bg-muted/50">
                  <td className="p-4 font-medium">{user.name}</td>
                  <td className="p-4 text-muted-foreground">{user.email}</td>
                  <td className="p-4">
                    <Badge variant={roleBadge[user.role as keyof typeof roleBadge]}>
                      {user.role}
                    </Badge>
                  </td>
                  <td className="p-4 text-muted-foreground">{user.joined}</td>
                  <td className="p-4">
                    <button className="text-xs text-primary hover:underline">
                      Dettagli
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
