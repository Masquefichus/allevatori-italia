import { ExternalLink, MapPin } from "lucide-react";

interface Props {
  citta: string | null;
  provincia?: string | null;
  regione?: string | null;
  nome: string;
  latitude?: number | null;
  longitude?: number | null;
  address?: string | null;
}

export default function PensioneMap({
  citta,
  provincia,
  regione,
  nome,
  latitude,
  longitude,
  address,
}: Props) {
  // Se abbiamo coordinate precise, usa quelle. Altrimenti cerca per testo.
  const hasCoords = latitude != null && longitude != null;
  const queryText = encodeURIComponent(
    [address, citta, provincia, regione, "Italia"].filter(Boolean).join(", ")
  );

  const embedSrc = hasCoords
    ? `https://maps.google.com/maps?q=${latitude},${longitude}&t=&z=14&ie=UTF8&iwloc=&output=embed`
    : `https://maps.google.com/maps?q=${queryText}&t=&z=12&ie=UTF8&iwloc=&output=embed`;

  const openHref = hasCoords
    ? `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${nome}, ${queryText}`)}`;

  return (
    <div className="space-y-3">
      <div className="rounded-xl overflow-hidden border border-border bg-muted h-64">
        <iframe
          src={embedSrc}
          loading="lazy"
          className="w-full h-full"
          title={`Mappa di ${nome}`}
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs text-muted-foreground flex items-start gap-1.5">
          <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0" />
          <span>
            {hasCoords
              ? "Posizione esatta della struttura."
              : "Posizione approssimativa basata su città/regione. Indirizzo esatto fornito dalla pensione al contatto."}
          </span>
        </p>
        <a
          href={openHref}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-primary hover:underline shrink-0 inline-flex items-center gap-1"
        >
          Apri su Maps
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </div>
  );
}
