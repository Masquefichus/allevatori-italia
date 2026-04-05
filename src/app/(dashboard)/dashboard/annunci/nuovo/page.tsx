"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Card, { CardContent, CardHeader } from "@/components/ui/Card";
import { razze } from "@/data/razze";
import { HEALTH_CERTIFICATIONS } from "@/lib/constants";

export default function NuovoAnnuncioPage() {
  const [priceOnRequest, setPriceOnRequest] = useState(false);

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/dashboard/annunci"
          className="text-sm text-primary hover:underline flex items-center gap-1 mb-2"
        >
          <ArrowLeft className="h-3 w-3" />
          Torna alle cucciolate
        </Link>
        <h1 className="text-2xl font-bold">Nuova Cucciolata</h1>
        <p className="text-muted-foreground">
          Crea una nuova cucciolata per i tuoi cuccioli
        </p>
      </div>

      <form className="space-y-6">
        <Card>
          <CardHeader>
            <h2 className="font-semibold">Informazioni Cucciolata</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="Titolo annuncio"
              placeholder="Es. Cuccioli di Labrador Retriever disponibili"
              id="title"
            />
            <Select
              label="Razza"
              id="breed"
              placeholder="Seleziona la razza"
              options={razze.map((r) => ({
                value: r.slug,
                label: r.name_it,
              }))}
            />
            <div>
              <label className="block text-sm font-medium mb-1">
                Descrizione
              </label>
              <textarea
                rows={5}
                placeholder="Descrivi la cucciolata, i genitori, le caratteristiche..."
                className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="font-semibold">Dettagli</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="Data di nascita"
                type="date"
                id="litter_date"
              />
              <Input
                label="Cuccioli disponibili"
                type="number"
                min={0}
                placeholder="Es. 4"
                id="available_puppies"
              />
              <Select
                label="Sesso disponibile"
                id="gender"
                placeholder="Seleziona"
                options={[
                  { value: "maschio", label: "Solo maschi" },
                  { value: "femmina", label: "Solo femmine" },
                  { value: "entrambi", label: "Maschi e femmine" },
                ]}
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm cursor-pointer mb-3">
                <input
                  type="checkbox"
                  checked={priceOnRequest}
                  onChange={(e) => setPriceOnRequest(e.target.checked)}
                  className="rounded"
                />
                Prezzo su richiesta
              </label>
              {!priceOnRequest && (
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Prezzo minimo (EUR)"
                    type="number"
                    placeholder="1500"
                    id="price_min"
                  />
                  <Input
                    label="Prezzo massimo (EUR)"
                    type="number"
                    placeholder="2000"
                    id="price_max"
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

<div className="flex justify-end gap-3">
          <Button variant="outline" type="button">
            Salva come Bozza
          </Button>
          <Button type="submit">Pubblica Annuncio</Button>
        </div>
      </form>
    </div>
  );
}
