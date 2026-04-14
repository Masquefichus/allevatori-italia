"use client";

import { useState, useEffect, useCallback } from "react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { Search } from "lucide-react";

type Role = "user" | "breeder" | "admin";

interface User {
  id: string;
  full_name: string | null;
  role: Role;
  created_at: string;
}

const roleBadge: Record<Role, "default" | "primary" | "secondary"> = {
  user: "default",
  breeder: "primary",
  admin: "secondary",
};

const roleLabel: Record<Role, string> = {
  user: "Utente",
  breeder: "Allevatore",
  admin: "Admin",
};

export default function AdminUtentiPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<Role | "">("");
  const [changingRole, setChangingRole] = useState<string | null>(null);

  const fetchUsers = useCallback(() => {
    setLoading(true);
    const qs = new URLSearchParams();
    if (search) qs.set("search", search);
    if (roleFilter) qs.set("role", roleFilter);
    fetch(`/api/admin/users?${qs}`)
      .then((r) => r.ok ? r.json() : [])
      .then((data) => setUsers(Array.isArray(data) ? data : []))
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  }, [search, roleFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleRoleChange = async (userId: string, newRole: Role) => {
    setChangingRole(userId);
    const r = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, role: newRole }),
    });
    if (r.ok) {
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, role: newRole } : u));
    }
    setChangingRole(null);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Gestione Utenti</h1>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Cerca per nome..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value as Role | "")}
          className="px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">Tutti i ruoli</option>
          <option value="user">Utente</option>
          <option value="breeder">Allevatore</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-4 font-medium text-muted-foreground">Nome</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Ruolo attuale</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Registrato</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Cambia ruolo</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-muted-foreground">Caricamento...</td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-muted-foreground">Nessun utente trovato.</td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="border-b border-border hover:bg-muted/50">
                    <td className="p-4 font-medium">{user.full_name ?? "—"}</td>
                    <td className="p-4">
                      <Badge variant={roleBadge[user.role]}>{roleLabel[user.role]}</Badge>
                    </td>
                    <td className="p-4 text-muted-foreground">
                      {new Date(user.created_at).toLocaleDateString("it-IT")}
                    </td>
                    <td className="p-4">
                      <select
                        value={user.role}
                        disabled={changingRole === user.id}
                        onChange={(e) => handleRoleChange(user.id, e.target.value as Role)}
                        className="text-xs px-2 py-1 rounded border border-border focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
                      >
                        <option value="user">Utente</option>
                        <option value="breeder">Allevatore</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
