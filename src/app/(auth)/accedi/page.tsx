"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Dog, Mail, Lock } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Card, { CardContent } from "@/components/ui/Card";
import { createClient } from "@/lib/supabase/client";
import { SITE_NAME } from "@/lib/constants";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/dashboard";

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseKey) {
        setError("Supabase non configurato.");
        setLoading(false);
        return;
      }

      // Direct API call to avoid Supabase JS client lock issues
      const res = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": supabaseKey,
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error_description || data.msg || "Email o password errati");
        setLoading(false);
        return;
      }

      // Store session directly in localStorage (Supabase client reads from here)
      const storageKey = `sb-nveyyjefsrdyjdtwwxda-auth-token`;
      localStorage.setItem(storageKey, JSON.stringify({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_at: data.expires_at,
        expires_in: data.expires_in,
        token_type: data.token_type,
        user: data.user,
      }));

      window.location.href = "/dashboard";
    } catch (err) {
      setError("Errore di connessione. Riprova.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-muted px-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-8">
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2 mb-4">
              <Dog className="h-10 w-10 text-primary" />
              <span className="text-2xl font-bold">{SITE_NAME}</span>
            </Link>
            <h1 className="text-2xl font-bold">Bentornato</h1>
            <p className="text-muted-foreground mt-1">
              Accedi al tuo account
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg">
                {error}
              </div>
            )}

            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="pl-10"
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="pl-10"
              />
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2">
                <input type="checkbox" className="rounded" />
                <span className="text-muted-foreground">Ricordami</span>
              </label>
              <Link
                href="/recupera-password"
                className="text-primary hover:underline"
              >
                Password dimenticata?
              </Link>
            </div>

            <Button
              type="submit"
              isLoading={loading}
              className="w-full"
              size="lg"
            >
              Accedi
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Non hai un account?{" "}
            <Link href="/registrati" className="text-primary font-medium hover:underline">
              Registrati
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
