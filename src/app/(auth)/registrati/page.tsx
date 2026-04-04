"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Dog, Mail, Lock, User, Building2 } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Card, { CardContent } from "@/components/ui/Card";
import Turnstile from "@/components/ui/Turnstile";
import { createClient } from "@/lib/supabase/client";
import { SITE_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";

export default function RegisterPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"user" | "breeder">("user");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (password.length < 8) {
      setError("La password deve essere di almeno 8 caratteri.");
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

    const supabase = createClient();
    if (!supabase) {
      setError("Supabase non configurato. Aggiorna le variabili d'ambiente in .env.local.");
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, role } },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  };

  if (success) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center bg-muted px-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Controlla la tua email</h1>
            <p className="text-muted-foreground mb-6">
              Abbiamo inviato un link di conferma a <strong>{email}</strong>.
              Clicca sul link per attivare il tuo account.
            </p>
            <Link href="/accedi">
              <Button variant="outline">Torna al login</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-muted px-4 py-8">
      <Card className="w-full max-w-md">
        <CardContent className="p-8">
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2 mb-4">
              <Dog className="h-10 w-10 text-primary" />
              <span className="text-2xl font-bold">{SITE_NAME}</span>
            </Link>
            <h1 className="text-2xl font-bold">Crea il tuo account</h1>
            <p className="text-muted-foreground mt-1">Unisciti alla community di {SITE_NAME}</p>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-6">
            <button
              type="button"
              onClick={() => setRole("user")}
              className={cn(
                "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
                role === "user" ? "border-primary bg-primary-light" : "border-border hover:border-gray-300"
              )}
            >
              <User className={cn("h-6 w-6", role === "user" ? "text-primary" : "text-muted-foreground")} />
              <span className={cn("text-sm font-medium", role === "user" ? "text-primary-dark" : "text-foreground")}>
                Cerco un cucciolo
              </span>
            </button>
            <button
              type="button"
              onClick={() => setRole("breeder")}
              className={cn(
                "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
                role === "breeder" ? "border-primary bg-primary-light" : "border-border hover:border-gray-300"
              )}
            >
              <Building2 className={cn("h-6 w-6", role === "breeder" ? "text-primary" : "text-muted-foreground")} />
              <span className={cn("text-sm font-medium", role === "breeder" ? "text-primary-dark" : "text-foreground")}>
                Sono un allevatore
              </span>
            </button>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            {error && (
              <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg">{error}</div>
            )}

            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input type="text" placeholder="Nome e cognome" value={fullName} onChange={(e) => setFullName(e.target.value)} required className="pl-10" />
            </div>

            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required className="pl-10" />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input type="password" placeholder="Password (min. 8 caratteri)" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} className="pl-10" />
            </div>

            <Turnstile onVerify={setTurnstileToken} onExpire={() => setTurnstileToken(null)} />

            <Button type="submit" isLoading={loading} disabled={!turnstileToken} className="w-full" size="lg">
              {role === "breeder" ? "Registrati come Allevatore" : "Registrati"}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Hai già un account?{" "}
            <Link href="/accedi" className="text-primary font-medium hover:underline">Accedi</Link>
          </p>

          <p className="text-center text-xs text-muted-foreground mt-4">
            Registrandoti accetti i nostri{" "}
            <Link href="/termini" className="underline">Termini di Servizio</Link>{" "}
            e la{" "}
            <Link href="/termini" className="underline">Privacy Policy</Link>.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
