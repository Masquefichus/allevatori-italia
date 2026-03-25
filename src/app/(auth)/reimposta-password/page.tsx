"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Dog, Lock } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Card, { CardContent } from "@/components/ui/Card";
import { createClient } from "@/lib/supabase/client";
import { SITE_NAME } from "@/lib/constants";

export default function ReimpostaPasswordPage() {
  return (
    <Suspense>
      <ReimpostaPasswordForm />
    </Suspense>
  );
}

function ReimpostaPasswordForm() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) {
      setError("Supabase non configurato.");
      setVerifying(false);
      return;
    }

    // PKCE Authorization Code flow: ?code=...
    const code = searchParams.get("code");
    if (code) {
      supabase.auth
        .exchangeCodeForSession(code)
        .then(({ error }) => {
          if (error) {
            router.replace("/accedi?error=auth");
          } else {
            setVerifying(false);
          }
        });
      return;
    }

    // PKCE OTP flow: ?token_hash=...&type=recovery
    const tokenHash = searchParams.get("token_hash");
    const type = searchParams.get("type");
    if (tokenHash && type === "recovery") {
      supabase.auth
        .verifyOtp({ token_hash: tokenHash, type: "recovery" })
        .then(({ error }) => {
          if (error) {
            router.replace("/accedi?error=auth");
          } else {
            setVerifying(false);
          }
        });
      return;
    }

    // Legacy implicit flow: #access_token=...&type=recovery
    const hash = window.location.hash.substring(1);
    const hashParams = new URLSearchParams(hash);
    const accessToken = hashParams.get("access_token");
    const refreshToken = hashParams.get("refresh_token");
    const hashType = hashParams.get("type");
    if (accessToken && refreshToken && hashType === "recovery") {
      supabase.auth
        .setSession({ access_token: accessToken, refresh_token: refreshToken })
        .then(({ error }) => {
          if (error) {
            router.replace("/accedi?error=auth");
          } else {
            window.history.replaceState(null, "", window.location.pathname);
            setVerifying(false);
          }
        });
      return;
    }

    // Fallback: check if a session already exists (e.g. set by /api/auth/callback)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setVerifying(false);
      } else {
        router.replace("/accedi?error=auth");
      }
    });
  }, [searchParams, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("La password deve essere di almeno 8 caratteri.");
      return;
    }
    if (password !== confirm) {
      setError("Le password non coincidono.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    if (!supabase) {
      setError("Supabase non configurato.");
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setTimeout(() => router.replace("/accedi"), 3000);
  };

  if (verifying) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center bg-muted px-4">
        <p className="text-muted-foreground">Verifica in corso…</p>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-muted px-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-8">
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2 mb-4">
              <Dog className="h-10 w-10 text-primary" />
              <span className="text-2xl font-bold">{SITE_NAME}</span>
            </Link>
            <h1 className="text-2xl font-bold">Nuova Password</h1>
            <p className="text-muted-foreground mt-1">Scegli una nuova password per il tuo account</p>
          </div>

          {success ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock className="h-8 w-8 text-green-600" />
              </div>
              <p className="text-muted-foreground">Password aggiornata! Verrai reindirizzato al login…</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg">{error}</div>
              )}
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="password"
                  placeholder="Nuova password (min. 8 caratteri)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pl-10"
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="password"
                  placeholder="Conferma nuova password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  className="pl-10"
                />
              </div>
              <Button type="submit" isLoading={loading} className="w-full" size="lg">
                Aggiorna Password
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
