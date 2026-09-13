import fs from "fs";
import path from "path";
import { site } from "@/lib/site";

// ─────────────────────────────────────────────────────────────────────────────
// Custom Schema Generator (CSG) — dashboard-managed, per-page JSON-LD.
// The dashboard writes content/custom-schema.json (an approved graph per page,
// optionally with "suppress" = this page renders ONLY this graph). At build time we
// inject that graph, marked data-csg-record-id, and when suppress is on the page's
// normal schema is skipped and any JSON-LD baked into the page HTML is stripped.
// ─────────────────────────────────────────────────────────────────────────────
export type CsgRecord = { recordId: string; path: string; jsonld: string; suppress?: boolean; status?: string };
type CsgStore = { settings?: { inject?: "head" | "footer" }; records?: CsgRecord[] };

function _csgRead(): CsgStore {
  try { const d = JSON.parse(fs.readFileSync(path.join(process.cwd(), "content/custom-schema.json"), "utf8")); return (d && typeof d === "object") ? d : {}; }
  catch { return {}; }
}
const _csgStore: CsgStore = _csgRead();

// Normalise a path/URL to a comparable key: strip origin, force one leading slash,
// no trailing slash, lowercased. "/" stays "/".
export function csgNormPath(p: string): string {
  let s = (p || "").trim();
  s = s.replace(/^https?:\/\/[^/]+/i, "");      // drop origin if a full URL slipped in
  s = "/" + s.replace(/^\/+|\/+$/g, "");
  return s.toLowerCase();
}

/** The active custom-schema record for a page path, or null. */
export function customSchemaFor(pagePath: string): CsgRecord | null {
  const key = csgNormPath(pagePath);
  const rec = (_csgStore.records || []).find((r) => r && (r.status === undefined || r.status === "active") && csgNormPath(r.path) === key);
  return rec || null;
}

/** Where the custom graph should sit (head/footer). Cosmetic for JSON-LD; default head. */
export function csgInjectLocation(): "head" | "footer" { return _csgStore.settings?.inject === "footer" ? "footer" : "head"; }

/** Renders a page's approved custom JSON-LD graph verbatim, tagged so it's identifiable. */
export function CustomSchemaScript({ record }: { record: CsgRecord }) {
  const raw = (record.jsonld || "").trim();
  if (!raw) return null;
  return (
    <script
      type="application/ld+json"
      data-csg-record-id={record.recordId}
      dangerouslySetInnerHTML={{ __html: raw }}
    />
  );
}

/** Remove every <script type="application/ld+json"> block from an HTML string.
 *  Used when a page is suppressed so no baked-in/theme JSON-LD survives. */
export function stripJsonLd(html: string): string {
  if (!html) return html;
  return html.replace(/<script\b[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi, "");
}

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
