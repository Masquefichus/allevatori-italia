import { MetadataRoute } from "next";
import { razze } from "@/data/razze";
import { regioni } from "@/data/regioni";
import { SITE_URL } from "@/lib/constants";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages = [
    { url: SITE_URL, lastModified: new Date(), changeFrequency: "daily" as const, priority: 1 },
    { url: `${SITE_URL}/allevatori`, lastModified: new Date(), changeFrequency: "daily" as const, priority: 0.9 },
    { url: `${SITE_URL}/razze`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.8 },
    { url: `${SITE_URL}/regioni`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.7 },
    { url: `${SITE_URL}/accedi`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.3 },
    { url: `${SITE_URL}/registrati`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.3 },
  ];

  const breedPages = razze.map((razza) => ({
    url: `${SITE_URL}/razze/${razza.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  const regionPages = regioni.map((regione) => ({
    url: `${SITE_URL}/regioni/${regione.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  return [...staticPages, ...breedPages, ...regionPages];
}
