"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Card, { CardContent, CardHeader } from "@/components/ui/Card";
import { regioni } from "@/data/regioni";
import { razze } from "@/data/razze";
import { SPECIALIZATIONS, HEALTH_CERTIFICATIONS } from "@/lib/constants";

export default function ProfiloPage() {
  const [selectedRegion, setSelectedRegion] = useState("");

  const provinces = selectedRegion
    ? regioni.find((r) => r.nome === selectedRegion)?.province ?? []
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Profilo Allevamento</h1>
        <p className="text-muted-foreground">
          Gestisci le informazioni del tuo allevamento
        </p>
      </div>

      <form className="space-y-6">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <h2 className="font-semibold">Informazioni Base</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="Nome Allevamento"
              placeholder="Es. Allevamento Del Sole"
              id="kennel_name"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Numero ENCI"
                placeholder="Es. MI-12345"
                id="enci_number"
              />
              <Input
                label="Anno di fondazione"
                type="number"
                placeholder="Es. 2005"
                id="year_established"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Descrizione
              </label>
              <textarea
                rows={5}
                placeholder="Descrivi il tuo allevamento, la tua filosofia, la tua esperienza..."
                className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </CardContent>
        </Card>

        {/* Location */}
        <Card>
          <CardHeader>
            <h2 className="font-semibold">Posizione</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Regione"
                id="region"
                placeholder="Seleziona regione"
                options={regioni.map((r) => ({
                  value: r.nome,
                  label: r.nome,
                }))}
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
              />
              <Select
                label="Provincia"
                id="province"
                placeholder="Seleziona provincia"
                options={provinces.map((p) => ({
                  value: p.nome,
                  label: `${p.nome} (${p.sigla})`,
                }))}
                disabled={!selectedRegion}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Citta" placeholder="Es. Monza" id="city" />
              <Input
                label="Indirizzo"
                placeholder="Es. Via Roma 1"
                id="address"
              />
            </div>
          </CardContent>
        </Card>

        {/* Contact */}
        <Card>
          <CardHeader>
            <h2 className="font-semibold">Contatti</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Telefono"
                type="tel"
                placeholder="+39 02 1234567"
                id="phone"
              />
              <Input
                label="WhatsApp"
                type="tel"
                placeholder="+39 333 1234567"
                id="whatsapp"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Email pubblica"
                type="email"
                placeholder="info@allevamento.it"
                id="email_public"
              />
              <Input
                label="Sito Web"
                type="url"
                placeholder="https://www.allevamento.it"
                id="website"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Facebook"
                placeholder="URL pagina Facebook"
                id="facebook_url"
              />
              <Input
                label="Instagram"
                placeholder="URL profilo Instagram"
                id="instagram_url"
              />
            </div>
          </CardContent>
        </Card>

        {/* Breeds */}
        <Card>
          <CardHeader>
            <h2 className="font-semibold">Razze Allevate</h2>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {razze.slice(0, 30).map((breed) => (
                <label
                  key={breed.slug}
                  className="flex items-center gap-2 text-sm cursor-pointer p-2 rounded hover:bg-muted"
                >
                  <input type="checkbox" className="rounded" />
                  {breed.name_it}
                </label>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Specializations */}
        <Card>
          <CardHeader>
            <h2 className="font-semibold">Specializzazioni</h2>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {SPECIALIZATIONS.map((spec) => (
                <label
                  key={spec}
                  className="flex items-center gap-2 text-sm cursor-pointer px-3 py-2 rounded-lg border border-border hover:bg-muted"
                >
                  <input type="checkbox" className="rounded" />
                  {spec}
                </label>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Health Certs */}
        <Card>
          <CardHeader>
            <h2 className="font-semibold">Certificazioni Sanitarie</h2>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {HEALTH_CERTIFICATIONS.map((cert) => (
                <label
                  key={cert}
                  className="flex items-center gap-2 text-sm cursor-pointer p-2 rounded hover:bg-muted"
                >
                  <input type="checkbox" className="rounded" />
                  {cert}
                </label>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex justify-end gap-3">
          <Button variant="outline" type="button">
            Annulla
          </Button>
          <Button type="submit">Salva Profilo</Button>
        </div>
      </form>
    </div>
  );
}
