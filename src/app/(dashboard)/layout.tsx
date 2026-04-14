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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";

const BREEDER_NAV = [
  { href: "/dashboard", label: "Panoramica", icon: LayoutDashboard },
  { href: "/dashboard/profilo", label: "Profilo", icon: User },
  { href: "/dashboard/annunci", label: "Cucciolate", icon: Megaphone },
  { href: "/dashboard/messaggi", label: "Messaggi", icon: MessageCircle },
  { href: "/dashboard/recensioni", label: "Recensioni", icon: Star },
  { href: "/dashboard/impostazioni", label: "Impostazioni", icon: Settings },
];

const USER_NAV = [
  { href: "/dashboard", label: "La mia area", icon: Search },
  { href: "/dashboard/messaggi", label: "Messaggi", icon: MessageCircle },
  { href: "/dashboard/salvati", label: "Preferiti", icon: Heart },
  { href: "/dashboard/impostazioni", label: "Impostazioni", icon: Settings },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useAuth();
  const [role, setRole] = useState<"breeder" | "user" | "admin" | null>(null);

  // Auth guard: redirect unauthenticated users
  useEffect(() => {
    if (!loading && !user) {
      router.replace(`/accedi?redirect=${pathname}`);
    }
  }, [loading, user, pathname, router]);

  // Fetch role from Supabase for role-based navigation
  useEffect(() => {
    const fetchRole = async () => {
      if (!user) return;
      const supabase = createClient();
      if (!supabase) return;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: profile } = await (supabase as any)
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
      setRole(profile?.role ?? "user");
    };
    if (user) {
      fetchRole();
    }
  }, [user]);

  if (loading || !user) {
    return <div className="min-h-screen bg-muted" />;
  }

  const nav = role === "breeder" || role === "admin" ? BREEDER_NAV : USER_NAV;

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
