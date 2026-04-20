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
  return <RazzePageClient allBreeds={razze} />;
}
