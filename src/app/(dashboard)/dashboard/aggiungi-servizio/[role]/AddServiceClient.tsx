"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import Card, { CardContent, CardHeader } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";
import { slugify } from "@/lib/utils";

type ServiceRole = "allevatore" | "addestratore" | "pensione";

const ROLE_PROFILE_TABLE: Record<Exclude<ServiceRole, "allevatore">, string> = {
  addestratore: "trainer_profiles",
  pensione: "boarding_profiles",
};

export default function AddServiceClient({ role, label, blurb }: { role: ServiceRole; label: string; blurb: string }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const submit = async () => {
    setError("");
    setSubmitting(true);
    const supabase = createClient();
    if (!supabase) {
      setError("Supabase non configurato.");
      setSubmitting(false);
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError("Sessione non valida. Riaccedi.");
      setSubmitting(false);
      return;
    }

    const { error: roleError } = await supabase
      .from("profile_roles")
      .insert({ profile_id: user.id, role, is_active: true, is_approved: true });

    // 23505 = unique violation → role already exists, treat as idempotent success
    if (roleError && roleError.code !== "23505") {
      setError(roleError.message);
      setSubmitting(false);
      return;
    }

    // For addestratore/pensione, also scaffold a minimal profile row so the
    // public ServicesBand pill can link to a real page. allevatore uses a
    // separate onboarding flow and isn't created here.
    if (role !== "allevatore") {
      const table = ROLE_PROFILE_TABLE[role];

      // Derive name + slug from existing breeder profile if the user has one,
      // else from their full_name. Slug uniqueness is per-table.
      const { data: breeder } = await supabase
        .from("breeder_profiles")
        .select("kennel_name, slug, region, province, city")
        .eq("user_id", user.id)
        .maybeSingle();

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single();

      const baseName = breeder?.kennel_name ?? profile?.full_name ?? "Profilo";
      const baseSlug = breeder?.slug ?? slugify(baseName);

      // Collision-proof slug: append short user-id suffix if base is taken
      const { data: existing } = await supabase.from(table).select("id").eq("slug", baseSlug).maybeSingle();
      const finalSlug = existing ? `${baseSlug}-${user.id.slice(0, 8)}` : baseSlug;

      const { error: profileError } = await supabase
        .from(table)
        .insert({
          user_id: user.id,
          name: baseName,
          slug: finalSlug,
          region: breeder?.region ?? null,
          province: breeder?.province ?? null,
          city: breeder?.city ?? null,
        });

      if (profileError && profileError.code !== "23505") {
        setError(profileError.message);
        setSubmitting(false);
        return;
      }
    }

    setDone(true);
    setSubmitting(false);
    router.refresh();
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <Link href="/dashboard" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Torna alla dashboard
      </Link>

      <Card>
        <CardHeader>
          <h1 className="text-2xl font-bold">Aggiungi servizio: {label}</h1>
          <p className="text-sm text-muted-foreground mt-1">{blurb}</p>
        </CardHeader>

        <CardContent className="space-y-4">
          {done ? (
            <div className="flex items-start gap-3 p-4 rounded-lg bg-green-50 border border-green-200">
              <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-green-900">Servizio aggiunto</p>
                <p className="text-sm text-green-800">
                  <strong>{label}</strong> è attivo sul tuo account. Completa i dettagli del servizio dalla dashboard.
                </p>
                <Link href="/dashboard" className="text-sm text-primary hover:underline font-medium inline-block mt-1">
                  Vai alla dashboard →
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50 border border-border">
                <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <p className="text-sm text-muted-foreground">
                  Stai per aggiungere il ruolo <strong>{label}</strong> al tuo account. Una volta confermato, potrai compilare i dettagli del servizio.
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-lg">{error}</div>
              )}

              <div className="flex gap-3">
                <Button onClick={submit} isLoading={submitting}>Aggiungi servizio</Button>
                <Link href="/dashboard">
                  <Button variant="outline">Annulla</Button>
                </Link>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
