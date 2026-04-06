"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { Dog, Mail, Lock } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Card, { CardContent } from "@/components/ui/Card";
import Turnstile from "@/components/ui/Turnstile";
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
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/dashboard";
  const errorParam = searchParams.get("error");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const supabase = createClient();
      if (!supabase) {
        setError("Supabase non configurato.");
        setLoading(false);
        return;
      }

      // Verifica CAPTCHA solo se il widget ha prodotto un token
      if (turnstileToken) {
        const captchaRes = await fetch("/api/turnstile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: turnstileToken }),
        });
        if (!captchaRes.ok) {
          setError("Verifica CAPTCHA fallita. Riprova.");
          setLoading(false);
          return;
        }
      }

      const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });

      if (signInError) {
        setError(signInError.message);
        setLoading(false);
        return;
      }

      router.push(redirect);
    } catch {
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
            {(error || errorParam === "auth") && (
              <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg">
                {error || "Il link di reset non è valido o è scaduto. Richiedine uno nuovo."}
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
              <Link href="/recupera-password" className="text-primary hover:underline">
                Password dimenticata?
              </Link>
            </div>

            <Turnstile onVerify={setTurnstileToken} onExpire={() => setTurnstileToken(null)} />

            <Button type="submit" isLoading={loading} disabled={!!process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && !turnstileToken} className="w-full" size="lg">
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
