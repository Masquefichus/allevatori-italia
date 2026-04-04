"use client";

import { useState, useEffect } from "react";
import { User, Mail, Phone, MapPin, Save, Check } from "lucide-react";
import Card, { CardContent, CardHeader } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import { createClient } from "@/lib/supabase/client";
import { regioni, getProvinceByRegione } from "@/data/regioni";

export default function InformazioniPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    regione: "",
    provincia: "",
    citta: "",
  });

  useEffect(() => {
    async function loadProfile() {
      const supabase = createClient();
      if (!supabase) { setLoading(false); return; }

      const storageKey = `sb-nveyyjefsrdyjdtwwxda-auth-token`;
      const stored = localStorage.getItem(storageKey);
      if (!stored) { setLoading(false); return; }

      try {
        const session = JSON.parse(stored);
        await supabase.auth.setSession({
          access_token: session.access_token,
          refresh_token: session.refresh_token,
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data } = await (supabase.from("profiles") as any)
          .select("*")
          .eq("id", session.user.id)
          .single();

        if (data) {
          setForm({
            full_name: data.full_name || "",
            phone: data.phone || "",
            regione: "",
            provincia: "",
            citta: "",
          });
        }
      } catch {}

      setLoading(false);
    }

    loadProfile();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSaved(false);

    const supabase = createClient();
    if (!supabase) { setError("Supabase non configurato."); setSaving(false); return; }

    const storageKey = `sb-nveyyjefsrdyjdtwwxda-auth-token`;
    const stored = localStorage.getItem(storageKey);
    if (!stored) { setError("Sessione scaduta."); setSaving(false); return; }

    try {
      const session = JSON.parse(stored);
      await supabase.auth.setSession({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: updateError } = await (supabase.from("profiles") as any)
        .update({
          full_name: form.full_name,
          phone: form.phone,
        })
        .eq("id", session.user.id);

      if (updateError) {
        setError(`Errore: ${updateError.message}`);
      } else {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch {
      setError("Errore nel salvataggio.");
    }

    setSaving(false);
  };

  const province = form.regione ? getProvinceByRegione(form.regione) : [];

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Le mie Informazioni</h1>
        <p className="text-muted-foreground">Gestisci i tuoi dati personali</p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg">{error}</div>
      )}

      {saved && (
        <div className="bg-green-50 text-green-700 text-sm p-3 rounded-lg flex items-center gap-2">
          <Check className="h-4 w-4" />
          Informazioni salvate con successo!
        </div>
      )}

      <Card>
        <CardHeader>
          <h2 className="font-semibold flex items-center gap-2">
            <User className="h-5 w-5" />
            Dati Personali
          </h2>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            label="Nome e Cognome"
            value={form.full_name}
            onChange={(e) => setForm({ ...form, full_name: e.target.value })}
            placeholder="Mario Rossi"
          />
          <Input
            label="Telefono"
            type="tel"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="+39 333 1234567"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="font-semibold flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Posizione
          </h2>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Regione"
              value={form.regione}
              onChange={(e) => setForm({ ...form, regione: e.target.value, provincia: "" })}
              options={regioni.map((r) => ({ value: r.slug, label: r.nome }))}
              placeholder="Seleziona regione"
            />
            <Select
              label="Provincia"
              value={form.provincia}
              onChange={(e) => setForm({ ...form, provincia: e.target.value })}
              options={province.map((p) => ({ value: p.sigla, label: `${p.nome} (${p.sigla})` }))}
              placeholder="Seleziona provincia"
              disabled={!form.regione}
            />
          </div>
          <Input
            label="Città"
            value={form.citta}
            onChange={(e) => setForm({ ...form, citta: e.target.value })}
            placeholder="Es. Milano"
          />
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} isLoading={saving} className="cursor-pointer">
          <Save className="h-4 w-4" />
          Salva Informazioni
        </Button>
      </div>
    </div>
  );
}
