"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import {
  Menu, X, Dog, ChevronUp, ChevronDown,
  MessageCircle, Heart, Settings, LogOut,
  LayoutDashboard, Megaphone, Star, ExternalLink, User, Shield,
} from "lucide-react";
import { NAV_LINKS, SITE_NAME } from "@/lib/constants";
import Button from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";

const BREEDER_MENU = [
  { href: "/dashboard", label: "Panoramica", icon: LayoutDashboard },
  { href: "/dashboard/profilo", label: "Profilo", icon: User },
  { href: "/dashboard/messaggi", label: "Messaggi", icon: MessageCircle },
  { href: "/dashboard/recensioni", label: "Recensioni", icon: Star },
  { href: "/dashboard/impostazioni", label: "Impostazioni", icon: Settings },
];

const USER_MENU = [
  { href: "/dashboard/profilo", label: "Profilo", icon: User },
  { href: "/dashboard/messaggi", label: "Messaggi", icon: MessageCircle },
  { href: "/dashboard/salvati", label: "Preferiti", icon: Heart },
  { href: "/dashboard/impostazioni", label: "Impostazioni", icon: Settings },
];

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [breederSlug, setBreederSlug] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user, profile, loading } = useAuth();

  const handleLogout = async () => {
    try {
      const supabase = createClient();
      if (supabase) await supabase.auth.signOut();
    } catch (_) {}
    finally {
      window.location.href = "/";
    }
  };

  // Fetch breeder slug for public profile link
  useEffect(() => {
    if (!user || (profile?.role !== "breeder" && profile?.role !== "admin")) return;
    const supabase = createClient();
    if (!supabase) return;
    (supabase as any)
      .from("breeder_profiles")
      .select("slug")
      .eq("user_id", user.id)
      .single()
      .then(({ data }: { data: { slug: string } | null }) => {
        if (data?.slug) setBreederSlug(data.slug);
      });
  }, [user, profile?.role]);

  // Close dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const firstName = profile?.full_name?.split(" ")[0] || user?.email?.split("@")[0] || "Account";
  const initials = profile?.full_name
    ? profile.full_name.split(" ").slice(0, 2).map((w: string) => w[0]).join("").toUpperCase()
    : (user?.email?.[0] ?? "?").toUpperCase();

  const menuItems = (profile?.role === "breeder" || profile?.role === "admin") ? BREEDER_MENU : USER_MENU;
  const isLoggedIn = !loading && (!!user || !!profile);

  return (
    <header className="bg-background border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <Dog className="h-7 w-7 text-primary" />
            <span className="text-lg font-semibold text-foreground tracking-tight">{SITE_NAME}</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-7">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Desktop Auth */}
          <div className="hidden md:flex items-center gap-3">
            {isLoggedIn ? (
              <div className="relative" ref={dropdownRef}>
                {/* Trigger */}
                <button
                  onClick={() => setDropdownOpen((o) => !o)}
                  className="flex items-center gap-2 text-sm font-medium text-foreground hover:text-muted-foreground transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-muted border border-border flex items-center justify-center text-xs font-semibold text-foreground">
                    {initials}
                  </div>
                  {firstName}
                  {dropdownOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                </button>

                {/* Dropdown */}
                {dropdownOpen && (
                  <div className="absolute right-0 mt-3 w-64 bg-white border border-border rounded-2xl shadow-lg z-50 py-2 overflow-hidden">
                    {/* Greeting */}
                    <div className="px-5 pt-3 pb-4">
                      <p className="text-xl font-bold text-foreground">Ciao, {firstName}!</p>
                    </div>
                    <div className="border-t border-border" />

                    {/* Nav items */}
                    <div className="py-1">
                      {menuItems.map((item) => {
                        const Icon = item.icon;
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setDropdownOpen(false)}
                            className="flex items-center gap-3 px-5 py-2.5 text-sm text-foreground hover:bg-muted transition-colors"
                          >
                            <Icon className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
                            {item.label}
                          </Link>
                        );
                      })}
                    </div>

                    {breederSlug && (
                      <>
                        <div className="border-t border-border" />
                        <div className="py-1">
                          <Link
                            href={`/allevatori/${breederSlug}`}
                            onClick={() => setDropdownOpen(false)}
                            className="flex items-center gap-3 px-5 py-2.5 text-sm text-foreground hover:bg-muted transition-colors"
                          >
                            <ExternalLink className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
                            Profilo pubblico
                          </Link>
                        </div>
                      </>
                    )}

                    {profile?.role === "admin" && (
                      <>
                        <div className="border-t border-border" />
                        <div className="py-1">
                          <Link
                            href="/admin"
                            onClick={() => setDropdownOpen(false)}
                            className="flex items-center gap-3 px-5 py-2.5 text-sm text-amber-600 hover:bg-amber-50 transition-colors"
                          >
                            <Shield className="h-4 w-4" strokeWidth={1.5} />
                            Admin Panel
                          </Link>
                        </div>
                      </>
                    )}

                    <div className="border-t border-border" />

                    {/* Logout */}
                    <div className="py-1">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-5 py-2.5 text-sm text-foreground hover:bg-muted transition-colors"
                      >
                        <LogOut className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
                        Esci
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link href="/accedi">
                  <Button variant="ghost" size="sm">Accedi</Button>
                </Link>
                <Link href="/registrati">
                  <Button size="sm">Registrati</Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button className="md:hidden p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border py-4 space-y-3">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block text-sm font-medium text-muted-foreground hover:text-foreground py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-3 border-t border-border space-y-1">
              {isLoggedIn ? (
                <>
                  <p className="text-sm font-semibold px-1 pb-2">Ciao, {firstName}!</p>
                  {menuItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-3 py-2 text-sm text-foreground"
                      >
                        <Icon className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
                        {item.label}
                      </Link>
                    );
                  })}
                  {breederSlug && (
                    <Link
                      href={`/allevatori/${breederSlug}`}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 py-2 text-sm text-foreground"
                    >
                      <ExternalLink className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
                      Profilo pubblico
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 py-2 text-sm text-foreground w-full mt-2 border-t border-border pt-3"
                  >
                    <LogOut className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
                    Esci
                  </button>
                </>
              ) : (
                <>
                  <Link href="/accedi" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="outline" size="sm" className="w-full">Accedi</Button>
                  </Link>
                  <Link href="/registrati" onClick={() => setMobileMenuOpen(false)}>
                    <Button size="sm" className="w-full">Registrati</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
