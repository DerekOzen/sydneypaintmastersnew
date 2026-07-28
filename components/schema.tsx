import { site } from "@/lib/site";

/** Renders a JSON-LD <script> block. Safe for static export. */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      // JSON.stringify output is safe here (our own data, no user input)
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

/** Sitewide LocalBusiness / Organization structured data. */
export function LocalBusinessSchema() {
  const data = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: site.name,
    description:
      "Registered NDIS provider delivering compassionate, person-centred support across Melbourne & Sydney.",
    url: site.siteUrl,
    telephone: site.phone,
    email: site.email,
    priceRange: site.priceRange || "$$",
    areaServed: ["Melbourne", "Sydney"],
    address: {
      "@type": "PostalAddress",
      addressCountry: "AU",
      addressRegion: "NSW / VIC",
    },
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        opens: "08:00",
        closes: "18:00",
      },
    ],
    ...(site.logoUrl ? { logo: site.logoUrl } : {}),
  };
  return <JsonLd data={data} />;
}

/** WebSite structured data (fallback default). */
export function WebSiteSchema() {
  return <JsonLd data={{ "@context": "https://schema.org", "@type": "WebSite", name: site.name, url: site.siteUrl }} />;
}

/**
 * Renders structured data managed from the Nifty dashboard (content _schemas =
 * the source of truth). If a page has none yet, falls back to sensible defaults
 * so SEO never regresses.
 */
export function ContentSchemas({ schemas }: { schemas?: Array<{ type?: string; data?: Record<string, unknown> }> }) {
  const blocks = Array.isArray(schemas) ? schemas.filter((b) => b && b.data && Object.keys(b.data).length) : [];
  if (blocks.length) {
    return (
      <>
        {blocks.map((b, i) => {
          const data = { "@context": "https://schema.org", ...(b.data as Record<string, unknown>) };
          return <JsonLd key={i} data={data} />;
        })}
      </>
    );
  }
  return (
    <>
      <LocalBusinessSchema />
      <WebSiteSchema />
    </>
  );
}

/** FAQPage structured data from a list of Q&A. */
export function FaqSchema({ faqs }: { faqs: { q: string; a: string }[] }) {
  const data = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
  return <JsonLd data={data} />;
}

/** Service structured data for a service page. */
export function ServiceSchema({ name, description }: { name: string; description: string }) {
  const data = {
    "@context": "https://schema.org",
    "@type": "Service",
    name,
    description,
    provider: { "@type": "Organization", name: site.name, url: site.siteUrl },
    areaServed: ["Melbourne", "Sydney"],
    serviceType: "NDIS support",
  };
  return <JsonLd data={data} />;
}
