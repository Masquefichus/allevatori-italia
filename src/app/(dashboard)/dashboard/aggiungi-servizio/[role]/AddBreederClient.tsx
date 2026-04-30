"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Card, { CardContent, CardHeader } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { createClient } from "@/lib/supabase/client";
import { slugify } from "@/lib/utils";
import { regioni } from "@/data/regioni";

export default function AddBreederClient() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    kennel_name: "",
    region: "",
    province: "",
    city: "",
  });

  const selectedRegion = regioni.find((r) => r.nome === form.region);
  const provinces = selectedRegion?.province ?? [];

  const handleSubmit = async () => {
    if (!form.kennel_name.trim() || !form.region || !form.province) {
      setError("Nome allevamento, regione e provincia sono obbligatori.");
      return;
    }

    setError("");
    setSubmitting(true);

    const supabase = createClient();
    if (!supabase) { setError("Supabase non configurato."); setSubmitting(false); return; }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError("Sessione non valida. Riaccedi."); setSubmitting(false); return; }

    // Create the breeder profile via API
    const slug = slugify(form.kennel_name);
    const res = await fetch("/api/breeders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kennel_name: form.kennel_name.trim(),
        slug,
        region: form.region,
        province: form.province,
        city: form.city.trim() || null,
      }),
    });

    if (!res.ok) {
      const json = await res.json();
      setError(json.error ?? "Errore nella creazione del profilo.");
      setSubmitting(false);
      return;
    }

    // Add allevatore to profile_roles
    await (supabase as any).from("profile_roles").insert({ profile_id: user.id, role: "allevatore", is_active: true, is_approved: true });

    router.push(`/allevatori/${slug}`);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <Link href="/dashboard" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Torna alla dashboard
      </Link>

      <Card>
        <CardHeader>
          <h1 className="text-2xl font-bold">Crea il tuo profilo allevatore</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Inserisci le informazioni base del tuo allevamento. Potrai completare il profilo in seguito.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-lg">{error}</div>
          )}

          <Input
            label="Nome allevamento *"
            value={form.kennel_name}
            onChange={(e) => setForm({ ...form, kennel_name: e.target.value })}
            placeholder="Es. Allevamento Del Bosco"
          />

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Regione *</label>
            <select
              value={form.region}
              onChange={(e) => setForm({ ...form, region: e.target.value, province: "" })}
              className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="">Seleziona regione</option>
              {regioni.map((r) => <option key={r.slug} value={r.nome}>{r.nome}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Provincia *</label>
            <select
              value={form.province}
              onChange={(e) => setForm({ ...form, province: e.target.value })}
              disabled={!provinces.length}
              className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50"
            >
              <option value="">Seleziona provincia</option>
              {provinces.map((p) => <option key={p.sigla} value={p.nome}>{p.nome} ({p.sigla})</option>)}
            </select>
          </div>

          <Input
            label="Città"
            value={form.city}
            onChange={(e) => setForm({ ...form, city: e.target.value })}
            placeholder="Es. Milano"
          />

          <div className="flex gap-3 pt-2">
            <Button onClick={handleSubmit} isLoading={submitting}>
              Crea profilo allevatore
            </Button>
            <Link href="/dashboard">
              <Button variant="outline">Annulla</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
