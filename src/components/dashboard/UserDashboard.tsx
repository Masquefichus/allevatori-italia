import { MessageCircle, Search, Heart, MapPin, Dog } from "lucide-react";
import Card, { CardContent, CardHeader } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function UserDashboard({ userId, userName }: { userId: string; userName: string }) {
  const supabase = await createClient();

  // Conversazioni con allevatori
  const { data: convRows } = await supabase
    .from("conversations")
    .select("id, participant_1, participant_2, last_message_at")
    .or(`participant_1.eq.${userId},participant_2.eq.${userId}`)
    .order("last_message_at", { ascending: false })
    .limit(4);

  const recentConversations = await Promise.all(
    (convRows ?? []).map(async (conv) => {
      const otherId = conv.participant_1 === userId ? conv.participant_2 : conv.participant_1;
      const [{ data: profile }, { data: msgs }, { count: unread }] = await Promise.all([
        supabase.from("profiles").select("full_name").eq("id", otherId).single(),
        supabase.from("messages").select("content, sender_id")
          .eq("conversation_id", conv.id)
          .order("created_at", { ascending: false }).limit(1),
        supabase.from("messages").select("*", { count: "exact", head: true })
          .eq("conversation_id", conv.id)
          .eq("is_read", false)
          .neq("sender_id", userId),
      ]);
      return {
        id: conv.id,
        name: profile?.full_name ?? "Allevatore",
        lastMessage: msgs?.[0]?.content ?? "Nessun messaggio",
        isMine: msgs?.[0]?.sender_id === userId,
        unread: (unread ?? 0) > 0,
        time: conv.last_message_at
          ? new Date(conv.last_message_at).toLocaleDateString("it-IT", { day: "numeric", month: "short" })
          : "",
      };
    })
  );

  // Allevatori consigliati (approvati, ordinati per rating)
  const { data: suggestedBreeders } = await supabase
    .from("breeder_profiles")
    .select("id, kennel_name, slug, region, city, breed_ids, average_rating, review_count, is_premium")
    .eq("is_approved", true)
    .order("average_rating", { ascending: false })
    .limit(4);

  // Risolvi breed_ids → nomi
  const allBreedIds = [...new Set((suggestedBreeders ?? []).flatMap(b => b.breed_ids ?? []))];
  const breedMap: Record<string, string> = {};
  if (allBreedIds.length > 0) {
    const { data: breeds } = await supabase.from("breeds").select("id, name_it").in("id", allBreedIds);
    (breeds ?? []).forEach(b => { breedMap[b.id] = b.name_it; });
  }

  const stats = [
    { label: "Allevatori contattati", value: (convRows?.length ?? 0).toString(), icon: MessageCircle },
    { label: "Messaggi non letti", value: recentConversations.filter(c => c.unread).length.toString(), icon: MessageCircle },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Ciao, {userName} 👋</h1>
        <p className="text-muted-foreground">Trova il tuo prossimo compagno a quattro zampe</p>
      </div>

      {/* Quick search */}
      <Card className="border-primary/20 bg-primary-light">
        <CardContent className="py-5">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="flex-1">
              <h2 className="font-semibold text-primary-dark mb-1">Cerca il tuo cucciolo</h2>
              <p className="text-sm text-primary-dark/70">Sfoglia tutti gli allevatori certificati in Italia</p>
            </div>
            <Link
              href="/allevatori"
              className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors whitespace-nowrap"
            >
              <Search className="h-4 w-4" />
              Cerca allevatori
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="py-4">
              <stat.icon className="h-5 w-5 text-muted-foreground mb-2" />
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Messaggi con allevatori */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">I tuoi messaggi</h2>
              <Link href="/dashboard/messaggi" className="text-xs text-primary hover:underline">Vedi tutti</Link>
            </div>
          </CardHeader>
          <CardContent>
            {recentConversations.length === 0 ? (
              <div className="text-center py-6 space-y-2">
                <MessageCircle className="h-10 w-10 text-muted-foreground/40 mx-auto" />
                <p className="text-sm text-muted-foreground">
                  Non hai ancora contattato nessun allevatore.
                </p>
                <Link href="/allevatori" className="text-sm text-primary hover:underline">
                  Sfoglia gli allevatori →
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {recentConversations.map((conv) => (
                  <Link key={conv.id} href="/dashboard/messaggi"
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors block">
                    <div className="w-9 h-9 bg-primary-light rounded-full flex items-center justify-center text-xs font-semibold text-primary-dark shrink-0">
                      {conv.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-medium truncate">{conv.name}</p>
                        {conv.unread && <span className="w-2 h-2 bg-primary rounded-full shrink-0" />}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {conv.isMine ? "Tu: " : `${conv.name}: `}{conv.lastMessage}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">{conv.time}</span>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Allevatori consigliati */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="font-semibold flex items-center gap-2">
                <Heart className="h-4 w-4 text-primary" />
                Consigliati per te
              </h2>
              <Link href="/allevatori" className="text-xs text-primary hover:underline">Vedi tutti</Link>
            </div>
          </CardHeader>
          <CardContent>
            {!suggestedBreeders || suggestedBreeders.length === 0 ? (
              <div className="text-center py-6">
                <Dog className="h-10 w-10 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Nessun allevatore disponibile al momento.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {suggestedBreeders.map((breeder) => {
                  const breedNames = (breeder.breed_ids as string[] ?? [])
                    .slice(0, 2)
                    .map(id => breedMap[id])
                    .filter(Boolean);
                  return (
                    <Link key={breeder.id} href={`/allevatori/${breeder.slug}`}
                      className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted transition-colors block">
                      <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-xl shrink-0">
                        🐕
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="text-sm font-medium">{breeder.kennel_name}</p>
                          {breeder.is_premium && (
                            <Badge variant="secondary" className="text-[10px] py-0">Premium</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                          <MapPin className="h-3 w-3" />
                          {[breeder.city, breeder.region].filter(Boolean).join(", ")}
                        </div>
                        {breedNames.length > 0 && (
                          <div className="flex gap-1 flex-wrap mt-1">
                            {breedNames.map(name => (
                              <Badge key={name} variant="outline" className="text-[10px] py-0">{name}</Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      {breeder.average_rating > 0 && (
                        <div className="text-right shrink-0">
                          <p className="text-xs font-semibold text-yellow-500">★ {breeder.average_rating.toFixed(1)}</p>
                          <p className="text-[10px] text-muted-foreground">{breeder.review_count} rec.</p>
                        </div>
                      )}
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
