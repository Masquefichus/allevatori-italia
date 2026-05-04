"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Megaphone,
  MessageCircle,
  Star,
  Settings,
  Search,
  Heart,
  User,
  Shield,
  Receipt,
  Plus,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";

type NavItem = { href: string; label: string; icon: LucideIcon };

const SEEKER_NAV: NavItem[] = [
  { href: "/dashboard", label: "La mia area", icon: Search },
  { href: "/dashboard/messaggi", label: "Messaggi", icon: MessageCircle },
  { href: "/dashboard/salvati", label: "Preferiti", icon: Heart },
  { href: "/dashboard/impostazioni", label: "Impostazioni", icon: Settings },
];

type AccountType = "seeker" | "service_pro" | "vet" | null;
type Role = "breeder" | "user" | "admin" | null;
type ServiceRole = "allevatore" | "addestratore" | "pensione";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useAuth();
  const [role, setRole] = useState<Role>(null);
  const [accountType, setAccountType] = useState<AccountType>(null);
  const [profileLinks, setProfileLinks] = useState<NavItem[]>([]);
  const [activeServiceRoles, setActiveServiceRoles] = useState<Set<ServiceRole>>(
    new Set()
  );

  // Auth guard: redirect unauthenticated users
  useEffect(() => {
    if (!loading && !user) {
      router.replace(`/accedi?redirect=${pathname}`);
    }
  }, [loading, user, pathname, router]);

  // Fetch role + account_type
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      const supabase = createClient();
      if (!supabase) return;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: profile } = await (supabase as any)
        .from("profiles")
        .select("role, account_type")
        .eq("id", user.id)
        .single();
      setRole(profile?.role ?? "user");
      setAccountType((profile?.account_type as AccountType) ?? "seeker");
    };
    if (user) {
      fetchProfile();
    }
  }, [user]);

  // Fetch profile links for the sidebar.
  // - vet: single link to vet_profiles slug
  // - service_pro: read profile_roles, then build one link per active role
  //   (allevatore→breeder_profiles, pensione→boarding_profiles, addestratore→trainer_profiles)
  // - admin (legacy): single link to breeder_profiles slug, like before
  useEffect(() => {
    if (!user || role === null) return;
    const supabase = createClient();
    if (!supabase) return;

    if (accountType === "vet") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase as any)
        .from("vet_profiles")
        .select("slug")
        .eq("user_id", user.id)
        .maybeSingle()
        .then(({ data }: { data: { slug: string } | null }) => {
          if (data?.slug)
            setProfileLinks([
              { href: `/veterinari/${data.slug}`, label: "Profilo", icon: User },
            ]);
        });
      return;
    }

    if (accountType === "service_pro") {
      (async () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: roles } = await (supabase as any)
          .from("profile_roles")
          .select("role, is_active")
          .eq("profile_id", user.id);

        const active = new Set<ServiceRole>(
          (roles ?? [])
            .filter((r: { is_active: boolean }) => r.is_active)
            .map((r: { role: ServiceRole }) => r.role)
        );
        setActiveServiceRoles(active);

        // Recupera tutti gli slug attivi in parallelo
        const queries = await Promise.all([
          active.has("allevatore")
            ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (supabase as any)
                .from("breeder_profiles")
                .select("slug")
                .eq("user_id", user.id)
                .maybeSingle()
            : Promise.resolve({ data: null }),
          active.has("pensione")
            ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (supabase as any)
                .from("boarding_profiles")
                .select("slug")
                .eq("user_id", user.id)
                .maybeSingle()
            : Promise.resolve({ data: null }),
          active.has("addestratore")
            ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (supabase as any)
                .from("trainer_profiles")
                .select("slug")
                .eq("user_id", user.id)
                .maybeSingle()
            : Promise.resolve({ data: null }),
        ]);

        const allevatoreSlug = (queries[0] as { data?: { slug?: string } }).data?.slug;
        const pensioneSlug = (queries[1] as { data?: { slug?: string } }).data?.slug;
        const addestratoreSlug = (queries[2] as { data?: { slug?: string } })
          .data?.slug;

        // Una singola voce "Profilo" → primo URL disponibile.
        // ProProfileClient mostra tab interne per gli altri ruoli.
        // Priorità statica: allevatore → pensione → addestratore.
        const firstHref = allevatoreSlug
          ? `/allevatori/${allevatoreSlug}`
          : pensioneSlug
            ? `/pensioni/${pensioneSlug}`
            : addestratoreSlug
              ? `/addestratori/${addestratoreSlug}`
              : null;

        if (firstHref) {
          setProfileLinks([{ href: firstHref, label: "Profilo", icon: User }]);
        } else {
          setProfileLinks([]);
        }
      })();
      return;
    }

    // Admin (legacy): keep old behavior
    if (role === "admin") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase as any)
        .from("breeder_profiles")
        .select("slug")
        .eq("user_id", user.id)
        .maybeSingle()
        .then(({ data }: { data: { slug: string } | null }) => {
          if (data?.slug)
            setProfileLinks([
              { href: `/allevatori/${data.slug}`, label: "Profilo", icon: User },
            ]);
        });
    }
  }, [user, role, accountType]);

  if (loading || !user) {
    return <div className="min-h-screen bg-muted" />;
  }

  const isBreeder = role === "breeder" || role === "admin";
  const isVet = accountType === "vet";
  const isServicePro = accountType === "service_pro";
  const isProfessional = isBreeder || isVet;

  // Per service_pro mostriamo Cucciolate solo se ha realmente il ruolo allevatore.
  // Per admin (legacy) lo mostriamo comunque, come prima.
  const showCucciolate =
    role === "admin" || activeServiceRoles.has("allevatore");

  const nav: NavItem[] = isProfessional
    ? [
        { href: "/dashboard", label: "Panoramica", icon: LayoutDashboard },
        ...profileLinks,
        { href: "/dashboard/messaggi", label: "Messaggi", icon: MessageCircle },
        { href: "/dashboard/recensioni", label: "Recensioni", icon: Star },
        ...(showCucciolate
          ? [
              { href: "/dashboard/annunci", label: "Cucciolate", icon: Megaphone },
              { href: "/dashboard/abbonamento", label: "Commissioni", icon: Receipt },
            ]
          : []),
        ...(isServicePro
          ? [
              {
                href: "/dashboard/aggiungi-servizio",
                label: "Aggiungi servizio",
                icon: Plus,
              },
            ]
          : []),
        { href: "/dashboard/impostazioni", label: "Impostazioni", icon: Settings },
      ]
    : SEEKER_NAV;

  return (
    <div className="min-h-screen bg-muted">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <aside className="w-full lg:w-64 shrink-0">
            <nav className="bg-white rounded-xl border border-border p-2 space-y-1">
              {role === null ? (
                /* Skeleton mentre carica il ruolo */
                Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-9 rounded-lg bg-muted animate-pulse mx-1"
                  />
                ))
              ) : (
                <>
                  {nav.map((item) => {
                    const Icon = item.icon;
                    const isActive =
                      pathname === item.href ||
                      (item.href !== "/dashboard" && pathname.startsWith(item.href));
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                          isActive
                            ? "bg-primary-light text-primary-dark"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        {item.label}
                      </Link>
                    );
                  })}
                  {role === "admin" && (
                    <Link
                      href="/admin"
                      className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-amber-600 hover:bg-amber-50 mt-1 border-t border-border pt-2"
                    >
                      <Shield className="h-4 w-4" />
                      Admin Panel
                    </Link>
                  )}
                </>
              )}
            </nav>
          </aside>

          {/* Main content */}
          <div className="flex-1 min-w-0">{children}</div>
        </div>
      </div>
    </div>
  );
}
