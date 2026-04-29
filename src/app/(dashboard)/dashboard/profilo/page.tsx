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
    const isBreeder = profile?.role === "breeder" || profile?.role === "admin";
    const isPro = isVet || isBreeder;

    if (!isPro) {
      router.replace("/dashboard/impostazioni");
      return;
    }

    const supabase = createClient();
    if (!supabase || !profile) {
      router.replace("/dashboard");
      return;
    }

    const table = isVet ? "vet_profiles" : "breeder_profiles";
    const publicPrefix = isVet ? "/veterinari" : "/allevatori";

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from(table)
      .select("slug")
      .eq("user_id", profile.id)
      .maybeSingle()
      .then(({ data }: { data: { slug: string } | null }) => {
        router.replace(data?.slug ? `${publicPrefix}/${data.slug}` : "/dashboard");
      });
  }, [loading, profile, router]);

  return (
    <div className="flex items-center justify-center py-24 text-muted-foreground">
      <Loader2 className="h-5 w-5 animate-spin" />
    </div>
  );
}
