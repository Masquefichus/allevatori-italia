"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Users, Building2, Star, CreditCard, Clock } from "lucide-react";
import Card, { CardContent, CardHeader } from "@/components/ui/Card";

interface Stats {
  totalUsers: number;
  totalBreeders: number;
  pendingBreeders: number;
  totalReviews: number;
  pendingReviews: number;
  premiumSubs: number;
}

interface PendingBreeder {
  id: string;
  kennel_name: string;
  region: string | null;
  created_at: string;
}

interface PendingReview {
  id: string;
  rating: number;
  author: { full_name: string | null } | null;
  breeder: { kennel_name: string } | null;
  created_at: string;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [pendingBreeders, setPendingBreeders] = useState<PendingBreeder[]>([]);
  const [pendingReviews, setPendingReviews] = useState<PendingReview[]>([]);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data) setStats(data); });

    fetch("/api/admin/breeders?status=pending")
      .then((r) => r.ok ? r.json() : [])
      .then((data) => setPendingBreeders(Array.isArray(data) ? data.slice(0, 5) : []));

    fetch("/api/admin/reviews?status=pending")
      .then((r) => r.ok ? r.json() : [])
      .then((data) => setPendingReviews(Array.isArray(data) ? data.slice(0, 5) : []));
  }, []);

  const handleApproveBreeder = async (id: string) => {
    const r = await fetch("/api/admin/breeders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ breeder_id: id, action: "approve" }),
    });
    if (r.ok) {
      setPendingBreeders((prev) => prev.filter((b) => b.id !== id));
      setStats((prev) => prev ? { ...prev, pendingBreeders: prev.pendingBreeders - 1 } : prev);
    }
  };

  const handleRejectBreeder = async (id: string) => {
    const r = await fetch("/api/admin/breeders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ breeder_id: id, action: "reject" }),
    });
    if (r.ok) {
      setPendingBreeders((prev) => prev.filter((b) => b.id !== id));
      setStats((prev) => prev ? { ...prev, pendingBreeders: prev.pendingBreeders - 1 } : prev);
    }
  };

  const handleApproveReview = async (id: string) => {
    const r = await fetch("/api/admin/reviews", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ review_id: id, action: "approve" }),
    });
    if (r.ok) {
      setPendingReviews((prev) => prev.filter((rev) => rev.id !== id));
      setStats((prev) => prev ? { ...prev, pendingReviews: prev.pendingReviews - 1 } : prev);
    }
  };

  const handleDeleteReview = async (id: string) => {
    const r = await fetch("/api/admin/reviews", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ review_id: id, action: "delete" }),
    });
    if (r.ok) {
      setPendingReviews((prev) => prev.filter((rev) => rev.id !== id));
      setStats((prev) => prev ? { ...prev, pendingReviews: prev.pendingReviews - 1 } : prev);
    }
  };

  const statCards = stats ? [
    { label: "Utenti totali", value: stats.totalUsers, icon: Users, color: "text-blue-600" },
    { label: "Allevatori", value: stats.totalBreeders, icon: Building2, color: "text-green-600" },
    { label: "Recensioni", value: stats.totalReviews, icon: Star, color: "text-yellow-600" },
    { label: "Abbonati Premium", value: stats.premiumSubs, icon: CreditCard, color: "text-purple-600" },
  ] : [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats === null ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}><CardContent className="py-4"><div className="h-16 bg-muted animate-pulse rounded" /></CardContent></Card>
          ))
        ) : (
          statCards.map((stat) => (
            <Card key={stat.label}>
              <CardContent className="py-4">
                <stat.icon className={`h-6 w-6 ${stat.color} mb-2`} />
                <div className="text-2xl font-bold">{stat.value.toLocaleString("it-IT")}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending breeders */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Allevatori in Attesa</h2>
              {stats && stats.pendingBreeders > 0 && (
                <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Clock className="h-3 w-3" />{stats.pendingBreeders}
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {pendingBreeders.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">Nessun allevatore in attesa</p>
            ) : (
              <>
                {pendingBreeders.map((b) => (
                  <div key={b.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted">
                    <div>
                      <p className="text-sm font-medium">{b.kennel_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {b.region} · {new Date(b.created_at).toLocaleDateString("it-IT")}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleApproveBreeder(b.id)} className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full hover:bg-green-200">Approva</button>
                      <button onClick={() => handleRejectBreeder(b.id)} className="text-xs bg-red-100 text-red-700 px-3 py-1 rounded-full hover:bg-red-200">Rifiuta</button>
                    </div>
                  </div>
                ))}
                {stats && stats.pendingBreeders > 5 && (
                  <Link href="/admin/allevatori" className="block text-xs text-primary text-center pt-2 hover:underline">
                    Vedi tutti ({stats.pendingBreeders})
                  </Link>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Pending reviews */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Recensioni da Moderare</h2>
              {stats && stats.pendingReviews > 0 && (
                <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Clock className="h-3 w-3" />{stats.pendingReviews}
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {pendingReviews.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">Nessuna recensione in attesa</p>
            ) : (
              <>
                {pendingReviews.map((rev) => (
                  <div key={rev.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted">
                    <div>
                      <p className="text-sm font-medium">
                        {rev.author?.full_name ?? "Utente"} → {rev.breeder?.kennel_name ?? "—"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {rev.rating}/5 stelle · {new Date(rev.created_at).toLocaleDateString("it-IT")}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleApproveReview(rev.id)} className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full hover:bg-green-200">Approva</button>
                      <button onClick={() => handleDeleteReview(rev.id)} className="text-xs bg-red-100 text-red-700 px-3 py-1 rounded-full hover:bg-red-200">Rimuovi</button>
                    </div>
                  </div>
                ))}
                {stats && stats.pendingReviews > 5 && (
                  <Link href="/admin/recensioni" className="block text-xs text-primary text-center pt-2 hover:underline">
                    Vedi tutte ({stats.pendingReviews})
                  </Link>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
