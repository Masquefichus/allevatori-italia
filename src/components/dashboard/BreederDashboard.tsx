import { Eye, MessageCircle, Star, TrendingUp, CheckCircle, AlertCircle, ExternalLink } from "lucide-react";
import Card, { CardContent, CardHeader } from "@/components/ui/Card";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

type ReviewRow = {
  id: string;
  rating: number;
  content: string | null;
  created_at: string;
  author: { full_name: string } | null;
};

export default async function BreederDashboard({ userId }: { userId: string }) {
  const supabase = await createClient();

  const { data: bp } = await supabase
    .from("breeder_profiles")
    .select("id, kennel_name, slug, review_count, average_rating, view_count, description, phone, email_public, website, breed_ids, region, city, logo_url")
    .eq("user_id", userId)
    .single();

  // Messaggi non letti
  const { data: convRows } = await supabase
    .from("conversations")
    .select("id")
    .or(`participant_1.eq.${userId},participant_2.eq.${userId}`);

  const convIds = convRows?.map(c => c.id) ?? [];

  const { count: unreadCount } = convIds.length > 0
    ? await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .neq("sender_id", userId)
        .eq("is_read", false)
        .in("conversation_id", convIds)
    : { count: 0 };

  // Messaggi recenti (ultimi 3)
  const { data: recentConvs } = await supabase
    .from("conversations")
    .select("id, participant_1, participant_2, last_message_at")
    .or(`participant_1.eq.${userId},participant_2.eq.${userId}`)
    .order("last_message_at", { ascending: false })
    .limit(3);

  const recentMessages = await Promise.all(
    (recentConvs ?? []).map(async (conv) => {
      const otherId = conv.participant_1 === userId ? conv.participant_2 : conv.participant_1;
      const [{ data: profile }, { data: msgs }] = await Promise.all([
        supabase.from("profiles").select("full_name").eq("id", otherId).single(),
        supabase.from("messages").select("content, sender_id")
          .eq("conversation_id", conv.id)
          .order("created_at", { ascending: false }).limit(1),
      ]);
      const lastMsg = msgs?.[0];
      const otherName = profile?.full_name ?? "Utente";
      return {
        id: conv.id,
        name: otherName,
        message: lastMsg?.content ?? "Nessun messaggio",
        isMine: lastMsg?.sender_id === userId,
        time: conv.last_message_at
          ? new Date(conv.last_message_at).toLocaleDateString("it-IT", { day: "numeric", month: "short" })
          : "",
      };
    })
  );

  // Tutte le recensioni recenti (ultimi 5)
  const { data: recentReviews } = bp
    ? await supabase
        .from("reviews")
        .select("id, rating, content, created_at, author:profiles(full_name)")
        .eq("breeder_id", bp.id)
        .eq("is_approved", true)
        .order("created_at", { ascending: false })
        .limit(5)
    : { data: [] };

  // --- Calcolo attrattività profilo ---
  const checks = [
    { label: "Nome allevamento", ok: !!bp?.kennel_name },
    { label: "Descrizione", ok: !!bp?.description },
    { label: "Regione e città", ok: !!(bp?.region && bp?.city) },
    { label: "Telefono o email pubblica", ok: !!(bp?.phone || bp?.email_public) },
    { label: "Razze allevate", ok: !!(bp?.breed_ids && (bp.breed_ids as string[]).length > 0) },
    { label: "Sito web o social", ok: !!bp?.website },
    { label: "Almeno una recensione", ok: (bp?.review_count ?? 0) > 0 },
    { label: "Logo / foto profilo", ok: !!bp?.logo_url },
  ];
  const completedCount = checks.filter(c => c.ok).length;
  const attractivenessScore = Math.round((completedCount / checks.length) * 100);

  const scoreColor =
    attractivenessScore >= 80 ? "text-green-600" :
    attractivenessScore >= 50 ? "text-yellow-500" :
    "text-red-500";

  const barColor =
    attractivenessScore >= 80 ? "bg-green-500" :
    attractivenessScore >= 50 ? "bg-yellow-400" :
    "bg-red-400";

  const stats = [
    { label: "Visualizzazioni profilo", value: bp?.view_count?.toString() ?? "0", icon: Eye, color: "text-blue-500" },
    { label: "Messaggi non letti", value: (unreadCount ?? 0).toString(), icon: MessageCircle, color: "text-primary" },
    { label: "Recensioni totali", value: bp?.review_count?.toString() ?? "0", icon: Star, color: "text-yellow-500" },
    { label: "Valutazione media", value: bp?.average_rating ? `${bp.average_rating.toFixed(1)} ★` : "—", icon: TrendingUp, color: "text-green-500" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">
            {bp ? `Ciao, ${bp.kennel_name} 👋` : "Dashboard Allevatore"}
          </h1>
          <p className="text-muted-foreground">Ecco come sta andando il tuo allevamento</p>
        </div>
        {bp?.slug && (
          <Link
            href={`/allevatori/${bp.slug}`}
            target="_blank"
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors shrink-0"
          >
            <ExternalLink className="h-4 w-4" />
            Vedi profilo pubblico
          </Link>
        )}
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="py-4">
              <stat.icon className={`h-5 w-5 mb-2 ${stat.color}`} />
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Attrattività profilo */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Attrattività del profilo</h2>
            <span className={`text-xl font-bold ${scoreColor}`}>{attractivenessScore}%</span>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="w-full bg-muted rounded-full h-2.5">
              <div
                className={`h-2.5 rounded-full transition-all ${barColor}`}
                style={{ width: `${attractivenessScore}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {attractivenessScore >= 80
                ? "Ottimo! Il tuo profilo è molto completo e attraente."
                : attractivenessScore >= 50
                ? "Buon lavoro, ma puoi migliorare ancora per attirare più clienti."
                : "Il tuo profilo è incompleto. Completalo per aumentare la visibilità."}
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {checks.map((check) => (
              <div key={check.label} className="flex items-center gap-2 text-sm">
                {check.ok
                  ? <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                  : <AlertCircle className="h-4 w-4 text-muted-foreground/50 shrink-0" />}
                <span className={check.ok ? "text-foreground" : "text-muted-foreground"}>{check.label}</span>
              </div>
            ))}
          </div>
          {attractivenessScore < 100 && (
            <div className="pt-1">
              {bp?.slug && (
                <Link href={`/allevatori/${bp.slug}`} className="text-sm text-primary hover:underline font-medium">
                  Modifica il profilo →
                </Link>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recensioni + Messaggi */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recensioni recenti */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="font-semibold flex items-center gap-2">
                <Star className="h-4 w-4 text-yellow-500" />
                Ultime recensioni
              </h2>
              <Link href="/dashboard/recensioni" className="text-xs text-primary hover:underline">Vedi tutte</Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {!recentReviews || recentReviews.length === 0 ? (
              <div className="text-center py-6 space-y-1">
                <Star className="h-8 w-8 text-muted-foreground/30 mx-auto" />
                <p className="text-sm text-muted-foreground">Nessuna recensione ancora.</p>
                <p className="text-xs text-muted-foreground">Le recensioni aumentano la fiducia dei potenziali clienti.</p>
              </div>
            ) : (
              (recentReviews as ReviewRow[]).map((r) => (
                <div key={r.id} className="p-3 rounded-xl bg-muted/50 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{r.author?.full_name ?? "Utente"}</span>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`h-3.5 w-3.5 ${i < r.rating ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground/30"}`}
                        />
                      ))}
                    </div>
                  </div>
                  {r.content && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{r.content}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {new Date(r.created_at).toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" })}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Messaggi recenti */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="font-semibold flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-primary" />
                Messaggi recenti
              </h2>
              <Link href="/dashboard/messaggi" className="text-xs text-primary hover:underline">Vedi tutti</Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentMessages.length === 0 ? (
              <div className="text-center py-6 space-y-1">
                <MessageCircle className="h-8 w-8 text-muted-foreground/30 mx-auto" />
                <p className="text-sm text-muted-foreground">Nessun messaggio ancora.</p>
                <p className="text-xs text-muted-foreground">I clienti interessati ti contatteranno qui.</p>
              </div>
            ) : (
              recentMessages.map((msg) => (
                <Link key={msg.id} href="/dashboard/messaggi"
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted transition-colors block">
                  <div className="w-9 h-9 bg-primary-light rounded-full flex items-center justify-center text-xs font-semibold text-primary-dark shrink-0">
                    {msg.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{msg.name}</p>
                    <p className="text-sm text-muted-foreground truncate">
                      {msg.isMine ? "Tu: " : `${msg.name}: `}{msg.message}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">{msg.time}</span>
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
