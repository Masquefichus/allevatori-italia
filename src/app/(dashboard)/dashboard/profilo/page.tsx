"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { createClient } from "@/lib/supabase/client";

// /dashboard/profilo no longer hosts an editor — the public profile is the
// canonical edit surface (LinkedIn / Yelp-for-Business pattern). This page
// just redirects each role to where it should now go.
export default function ProfiloRedirect() {
  const { profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const isVet = profile?.account_type === "vet";
    const isServicePro = profile?.account_type === "service_pro";
    const isPro = isVet || isServicePro;

    if (!isPro) {
      router.replace("/dashboard/impostazioni");
      return;
    }

    const supabase = createClient();
    if (!supabase || !profile) {
      router.replace("/dashboard");
      return;
    }

    if (isVet) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase as any)
        .from("vet_profiles")
        .select("slug")
        .eq("user_id", profile.id)
        .maybeSingle()
        .then(({ data }: { data: { slug: string } | null }) => {
          router.replace(data?.slug ? `/veterinari/${data.slug}` : "/dashboard");
        });
      return;
    }

    // service_pro: pick the first active per-role profile we find.
    (async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: roles } = await (supabase as any)
        .from("profile_roles")
        .select("role, is_active")
        .eq("profile_id", profile.id);
      const active = new Set<string>(
        (roles ?? [])
          .filter((r: { is_active: boolean }) => r.is_active)
          .map((r: { role: string }) => r.role),
      );

      const lookups: Array<[string, string, string]> = [
        ["allevatore", "breeder_profiles", "/allevatori"],
        ["pensione", "boarding_profiles", "/pensioni"],
        ["addestratore", "trainer_profiles", "/addestratori"],
      ];
      for (const [r, table, prefix] of lookups) {
        if (!active.has(r)) continue;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data } = await (supabase as any)
          .from(table).select("slug").eq("user_id", profile.id).maybeSingle();
        if (data?.slug) {
          router.replace(`${prefix}/${data.slug}`);
          return;
        }
      }
      router.replace("/dashboard");
    })();
  }, [loading, profile, router]);

  return (
    <div className="flex items-center justify-center py-24 text-muted-foreground">
      <Loader2 className="h-5 w-5 animate-spin" />
    </div>
  );
}
