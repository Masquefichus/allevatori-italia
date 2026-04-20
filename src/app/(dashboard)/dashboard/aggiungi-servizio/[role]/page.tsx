import { notFound } from "next/navigation";
import AddServiceClient from "./AddServiceClient";

const VALID_ROLES = ["allevatore", "addestratore", "pensione"] as const;
type ServiceRole = (typeof VALID_ROLES)[number];

const ROLE_COPY: Record<ServiceRole, { label: string; blurb: string }> = {
  allevatore: {
    label: "Allevatore",
    blurb: "Registra il tuo allevamento per pubblicare cucciolate e gestire riproduttori.",
  },
  addestratore: {
    label: "Addestratore",
    blurb: "Offri corsi di addestramento, educazione di base e discipline sportive.",
  },
  pensione: {
    label: "Pensione per cani",
    blurb: "Offri servizi di pensione, dog sitting e pet hotel.",
  },
};

export default async function AggiungiServizioPage({ params }: { params: Promise<{ role: string }> }) {
  const { role } = await params;
  if (!VALID_ROLES.includes(role as ServiceRole)) notFound();

  const typedRole = role as ServiceRole;
  const copy = ROLE_COPY[typedRole];

  return <AddServiceClient role={typedRole} label={copy.label} blurb={copy.blurb} />;
}
