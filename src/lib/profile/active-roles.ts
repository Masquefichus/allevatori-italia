import type { createClient as createServerClient } from "@/lib/supabase/server";
import type { createClient as createBrowserClient } from "@/lib/supabase/client";

export type ServiceRole = "allevatore" | "addestratore" | "pensione";

export const ROLE_TABLE: Record<ServiceRole, string> = {
  allevatore: "breeder_profiles",
  addestratore: "trainer_profiles",
  pensione: "boarding_profiles",
};

type ServerClient = Awaited<ReturnType<typeof createServerClient>>;
type BrowserClient = NonNullable<ReturnType<typeof createBrowserClient>>;
type DbClient = ServerClient | BrowserClient;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any;

export async function getActiveRoles(
  supabase: DbClient,
  userId: string,
): Promise<Set<ServiceRole>> {
  const { data } = await (supabase as AnyClient)
    .from("profile_roles")
    .select("role, is_active")
    .eq("profile_id", userId);

  return new Set(
    (data ?? [])
      .filter((r: { is_active: boolean }) => r.is_active)
      .map((r: { role: ServiceRole }) => r.role),
  );
}

export async function hasActiveRole(
  supabase: DbClient,
  userId: string,
  role: ServiceRole,
): Promise<boolean> {
  const { data } = await (supabase as AnyClient)
    .from("profile_roles")
    .select("is_active")
    .eq("profile_id", userId)
    .eq("role", role)
    .maybeSingle();

  return data?.is_active === true;
}

export async function activeProfileIds(
  supabase: DbClient,
  role: ServiceRole,
): Promise<string[]> {
  const { data } = await (supabase as AnyClient)
    .from("profile_roles")
    .select("profile_id")
    .eq("role", role)
    .eq("is_active", true);

  return (data ?? []).map((r: { profile_id: string }) => r.profile_id);
}
