import Link from "next/link";
import { redirect } from "next/navigation";
import { Dog, GraduationCap, Home, ArrowRight, CheckCircle2 } from "lucide-react";
import Card, { CardContent } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { createClient } from "@/lib/supabase/server";

const SERVICES = [
  {
    role: "allevatore" as const,
    label: "Allevatore",
    icon: Dog,
    blurb:
      "Pubblica cucciolate, gestisci riproduttori e mostra le tue razze sulla directory allevatori.",
    publicBase: "/allevatori",
    profileTable: "breeder_profiles",
  },
  {
    role: "addestratore" as const,
    label: "Addestratore",
    icon: GraduationCap,
    blurb:
      "Offri corsi, educazione di base e discipline sportive sulla directory addestratori.",
    publicBase: "/addestratori",
    profileTable: "trainer_profiles",
  },
  {
    role: "pensione" as const,
    label: "Pensione per cani",
    icon: Home,
    blurb:
      "Pubblica la tua struttura di pensione, dog sitting o pet hotel sulla directory pensioni.",
    publicBase: "/pensioni",
    profileTable: "boarding_profiles",
  },
];

export default async function AggiungiServizioHubPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/accedi?redirect=/dashboard/aggiungi-servizio");

  // Carica i ruoli attivi + slug profili pubblici in parallelo
  const [rolesRes, breederRes, trainerRes, boardingRes] = await Promise.all([
    supabase
      .from("profile_roles")
      .select("role, is_active")
      .eq("profile_id", user.id),
    supabase
      .from("breeder_profiles")
      .select("slug")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("trainer_profiles")
      .select("slug")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("boarding_profiles")
      .select("slug")
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  const activeRoles = new Set(
    (rolesRes.data ?? [])
      .filter((r) => r.is_active)
      .map((r) => r.role as string)
  );

  const slugByRole: Record<string, string | undefined> = {
    allevatore: breederRes.data?.slug,
    addestratore: trainerRes.data?.slug,
    pensione: boardingRes.data?.slug,
  };

  const totalActive = SERVICES.filter((s) => activeRoles.has(s.role)).length;

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold">I tuoi servizi</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Sei un professionista multi-disciplinare? Attiva uno o più servizi sul tuo
          account. Ogni servizio ha la sua pagina pubblica e la sua sezione editabile.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {SERVICES.map((s) => {
          const isActive = activeRoles.has(s.role);
          const slug = slugByRole[s.role];
          const Icon = s.icon;

          return (
            <Card key={s.role} className={isActive ? "border-primary/40" : undefined}>
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-11 h-11 rounded-xl bg-primary-light text-primary flex items-center justify-center">
                    <Icon className="h-5 w-5" />
                  </div>
                  {isActive && (
                    <Badge variant="success">
                      <CheckCircle2 className="h-3 w-3 mr-1 inline" />
                      Attivo
                    </Badge>
                  )}
                </div>
                <h2 className="font-semibold text-lg">{s.label}</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.blurb}</p>

                {isActive ? (
                  slug ? (
                    <Link
                      href={`${s.publicBase}/${slug}`}
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline pt-1"
                    >
                      Apri profilo pubblico
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  ) : (
                    <p className="text-xs text-muted-foreground pt-1">
                      Profilo in fase di scaffolding.
                    </p>
                  )
                ) : (
                  <Link
                    href={`/dashboard/aggiungi-servizio/${s.role}`}
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline pt-1"
                  >
                    Aggiungi {s.label.toLowerCase()}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {totalActive === 0 && (
        <Card className="bg-muted/40 border-dashed">
          <CardContent className="p-6 text-center text-sm text-muted-foreground">
            Nessun servizio ancora attivo. Scegli uno dei profili sopra per iniziare.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
