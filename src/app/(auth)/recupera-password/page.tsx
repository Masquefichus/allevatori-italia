"use client";

import { useState } from "react";
import Link from "next/link";
import { Dog, Mail, ArrowLeft } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Card, { CardContent } from "@/components/ui/Card";
import { createClient } from "@/lib/supabase/client";
import { SITE_NAME } from "@/lib/constants";

export default function RecoverPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    if (!supabase) {
      setError("Supabase non configurato. Aggiorna le variabili d'ambiente in .env.local.");
      setLoading(false);
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reimposta-password`,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSent(true);
    setLoading(false);
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
            <h1 className="text-2xl font-bold">Recupera Password</h1>
            <p className="text-muted-foreground mt-1">
              Inserisci la tua email per ricevere il link di reset
            </p>
          </div>

          {sent ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="h-8 w-8 text-green-600" />
              </div>
              <p className="text-muted-foreground mb-6">
                Se l&apos;email <strong>{email}</strong> e associata a un account,
                riceverai un link per reimpostare la password.
              </p>
              <Link href="/accedi">
                <Button variant="outline">
                  <ArrowLeft className="h-4 w-4" />
                  Torna al login
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg">
                  {error}
                </div>
              )}

              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="La tua email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="pl-10"
                />
              </div>

              <Button
                type="submit"
                isLoading={loading}
                className="w-full"
                size="lg"
              >
                Invia link di reset
              </Button>

              <div className="text-center">
                <Link
                  href="/accedi"
                  className="text-sm text-primary hover:underline inline-flex items-center gap-1"
                >
                  <ArrowLeft className="h-3 w-3" />
                  Torna al login
                </Link>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
