"use client";

import { useState } from "react";
import Card, { CardContent, CardHeader } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { User, Lock, Bell, Trash2 } from "lucide-react";

export default function ImpostazioniPage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Impostazioni</h1>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            <h2 className="font-semibold">Informazioni Account</h2>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Nome completo" placeholder="Il tuo nome" />
            <Input label="Email" type="email" placeholder="La tua email" disabled />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Telefono" type="tel" placeholder="+39 ..." />
          </div>
          <Button>Salva modifiche</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-primary" />
            <h2 className="font-semibold">Cambia Password</h2>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            label="Password attuale"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="La tua password attuale"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Nuova password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minimo 8 caratteri"
            />
            <Input
              label="Conferma nuova password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Ripeti la password"
            />
          </div>
          <Button>Aggiorna Password</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            <h2 className="font-semibold">Notifiche</h2>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { label: "Nuovi messaggi", desc: "Ricevi una notifica quando ricevi un nuovo messaggio" },
            { label: "Nuove recensioni", desc: "Ricevi una notifica quando qualcuno lascia una recensione" },
            { label: "Aggiornamenti piattaforma", desc: "Ricevi aggiornamenti su nuove funzionalità" },
            { label: "Newsletter", desc: "Ricevi la newsletter settimanale" },
          ].map((item) => (
            <label key={item.label} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted cursor-pointer">
              <div>
                <p className="text-sm font-medium">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
              <input type="checkbox" defaultChecked className="h-4 w-4 rounded border-border text-primary focus:ring-primary" />
            </label>
          ))}
          <Button>Salva preferenze</Button>
        </CardContent>
      </Card>

      <Card className="border-red-200">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-red-600" />
            <h2 className="font-semibold text-red-600">Zona Pericolosa</h2>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            L&apos;eliminazione dell&apos;account è permanente e non può essere annullata. Tutti i tuoi dati verranno rimossi.
          </p>
          <Button variant="destructive">Elimina Account</Button>
        </CardContent>
      </Card>
    </div>
  );
}
