import { SITE_NAME, SITE_DESCRIPTION, SITE_URL } from "@/lib/constants";

interface JsonLdProps {
  type: "website" | "organization" | "breeder" | "breed";
  data?: Record<string, unknown>;
}

export function WebsiteJsonLd() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE_URL}/allevatori?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

export function OrganizationJsonLd() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    description: SITE_DESCRIPTION,
    areaServed: {
      "@type": "Country",
      name: "Italy",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

export function BreederJsonLd({ data }: { data: Record<string, unknown> }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const jsonLd: any = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `${SITE_URL}/allevatori/${data.slug}`,
    name: data.kennel_name,
    description: data.description,
    address: {
      "@type": "PostalAddress",
      addressRegion: data.region,
      addressLocality: data.city || data.province,
      addressCountry: "IT",
    },
  };

  if (data.average_rating) {
    jsonLd.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: data.average_rating,
      reviewCount: data.review_count,
      bestRating: 5,
      worstRating: 1,
    };
  }
  if (data.phone) jsonLd.telephone = data.phone;
  if (data.website) jsonLd.url = data.website;

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

export default function JsonLd({ type, data }: JsonLdProps) {
  switch (type) {
    case "website":
      return <WebsiteJsonLd />;
    case "organization":
      return <OrganizationJsonLd />;
    case "breeder":
      return data ? <BreederJsonLd data={data} /> : null;
    default:
      return null;
  }
}
