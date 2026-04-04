"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X, User, LogOut, LayoutDashboard, Dog } from "lucide-react";
import { NAV_LINKS, SITE_NAME } from "@/lib/constants";
import Button from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const { user, profile, loading } = useAuth();

  const handleLogout = async () => {
    try {
      const supabase = createClient();
      if (supabase) await supabase.auth.signOut();
    } catch (_) {
      // ignora errori — il redirect avviene comunque
    } finally {
      window.location.href = "/";
    }
  };

  return (
    <header className="bg-background border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <Dog className="h-7 w-7 text-primary" />
            <span className="text-lg font-semibold text-foreground tracking-tight">
              {SITE_NAME}
            </span>
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
            {!loading && (user || profile) ? (
              <div className="flex items-center gap-3">
                <Link href="/dashboard">
                  <Button variant="ghost" size="sm">
                    <LayoutDashboard className="h-4 w-4" />
                    Dashboard
                  </Button>
                </Link>
                <div className="relative">
                  <button
                    onClick={() => setAccountMenuOpen(!accountMenuOpen)}
                    className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
                  >
                    <User className="h-5 w-5" />
                    {profile?.full_name || user?.email || "Account"}
                  </button>
                  {accountMenuOpen && (
                    <>
                      {/* Overlay per chiudere cliccando fuori */}
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setAccountMenuOpen(false)}
                      />
                      <div className="absolute right-0 mt-2 w-48 bg-white border border-border rounded-lg shadow-lg z-20">
                        <Link
                          href="/dashboard/impostazioni"
                          className="block px-4 py-2 text-sm text-foreground hover:bg-muted"
                          onClick={() => setAccountMenuOpen(false)}
                        >
                          Impostazioni
                        </Link>
                        <button
                          onClick={handleLogout}
                          className="w-full text-left px-4 py-2 text-sm text-destructive hover:bg-muted flex items-center gap-2"
                        >
                          <LogOut className="h-4 w-4" />
                          Esci
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <>
                <Link href="/accedi">
                  <Button variant="ghost" size="sm">
                    Accedi
                  </Button>
                </Link>
                <Link href="/registrati">
                  <Button size="sm">Registrati</Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
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
            <div className="pt-3 border-t border-border space-y-2">
              {profile ? (
                <>
                  <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="outline" size="sm" className="w-full">
                      Dashboard
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-destructive"
                    onClick={handleLogout}
                  >
                    Esci
                  </Button>
                </>
              ) : (
                <>
                  <Link href="/accedi" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="outline" size="sm" className="w-full">
                      Accedi
                    </Button>
                  </Link>
                  <Link href="/registrati" onClick={() => setMobileMenuOpen(false)}>
                    <Button size="sm" className="w-full">
                      Registrati
                    </Button>
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
