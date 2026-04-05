import { Metadata } from "next";
import razzeEnriched from "@/data/razze-enriched.json";
import type { RazzaEnricched } from "@/data/razze-types";
import RazzePageClient from "./RazzePageClient";

const razze = razzeEnriched as RazzaEnricched[];

export const metadata: Metadata = {
  title: "Razze di Cani",
  description:
    "Scopri tutte le razze di cani disponibili in Italia. Trova allevatori specializzati per ogni razza.",
};

export default function RazzePage() {
  const italianBreeds = razze.filter((r) => r.is_italian_breed);
  const breedsByGroup = razze.reduce(
    (acc, breed) => {
      const group = breed.group_fci;
      if (!acc[group]) acc[group] = [];
      acc[group].push(breed);
      return acc;
    },
    {} as Record<number, RazzaEnricched[]>
  );

  return (
    <RazzePageClient
      italianBreeds={italianBreeds}
      breedsByGroup={breedsByGroup}
      totalCount={razze.length}
    />
  );
}
