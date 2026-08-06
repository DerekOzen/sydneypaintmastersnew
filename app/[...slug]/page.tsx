import { notFound } from "next/navigation";
import fs from "fs";
import path from "path";
import SiteHeader from "@/components/site-header";
import SiteFooter from "@/components/site-footer";
import { JsonLd } from "@/components/schema";
import { Blocks } from "@/components/blocks";
import { MockupPage } from "@/components/mockup-page";
import { site } from "@/lib/site";
import partsData from "@/content/parts.json";

// Absolute canonical URL for a path, based on the site's configured address (which the
// dashboard sets to the real domain once a custom domain is connected). Canonical tags
// tell search + answer + generative engines that the real domain is authoritative — so
// even if the .pages.dev is reached, signals consolidate onto the real domain.
function canonicalFor(p: string): string | undefined {
  const base = (site.siteUrl || "").replace(/\/+$/, "");
  if (!base) return undefined;
  // Trailing slash on every canonical URL (home = base + "/") — self-referencing, and the
  // single indexable form (the non-slash version 301/308-redirects to it). Matches
  // trailingSlash: true in next.config.mjs and the sitemap.
  const slug = p.replace(/^\/+|\/+$/g, "");
  return slug ? `${base}/${slug}/` : `${base}/`;
}

// Build-time content loader. content/pages.json is a lightweight INDEX; each
// page's heavy content lives in content/pages/<id>.json (the "split" format that
// keeps the dashboard fast). Backward compatible: an index entry that still has
// inline blocks/css (old format) is used as-is. Self-contained on purpose.
function _readJson(rel: string): any {
  try { return JSON.parse(fs.readFileSync(path.join(process.cwd(), rel), "utf8")); } catch { return null; }
}
function _hasInline(p: any): boolean {
  return (Array.isArray(p?.blocks) && p.blocks.length > 0)
    || (typeof p?.css === "string" && p.css.trim() !== "")
    || (typeof p?.body === "string" && p.body.trim() !== "");
}
function _allPages(): any[] {
  const idx = _readJson("content/pages.json");
  return (Array.isArray(idx) ? idx : []).map((e: any) => {
    if (_hasInline(e)) return e;
    const b = _readJson(`content/pages/${e.id}.json`) || {};
    return { ...e, blocks: b.blocks || [], css: b.css || "", fonts: b.fonts || [], body: b.body || "", _schemas: b._schemas || [] };
  });
}
const pagesData = _allPages();

// Content-driven pages & posts, managed from the Nifty dashboard (source of
// truth). Every published entry becomes a statically-generated route.
// Self-contained: no external dependencies, so a site build can't break on it.
type Pg = {
  id: string; path: string; type: string; title: string;
  seoTitle?: string; seoDescription?: string; noindex?: boolean; body?: string;
  layout?: string; css?: string; fonts?: string[]; isHome?: boolean;
  headerPartId?: string | null; footerPartId?: string | null;
  blocks?: Array<{ id?: string; type: string; props?: Record<string, any> }>;
  _schemas?: Array<{ type?: string; data?: Record<string, unknown> }>; status?: string;
};
type Part = { id: string; kind: string; name: string; html: string; css?: string; fonts?: string[] };

// A shared header/footer part must carry the CSS/fonts that style it, so it renders
// identically on EVERY page that links it — not just the page it was imported from.
// If a part has no CSS stored on it (older parts, saved before CSS was captured with
// them), back-fill from a page that uses the part and does have CSS. This mirrors what
// the dashboard's part editor does, and is what keeps the header consistent site-wide.
function _enrichParts(rawParts: any[], pages: Pg[]): Part[] {
  return (Array.isArray(rawParts) ? rawParts : []).map((p: any) => {
    if (p?.css && String(p.css).trim() !== "") return p as Part;
    const user = pages.find((pg) => (pg.headerPartId === p.id || pg.footerPartId === p.id) && pg.css && pg.css.trim() !== "");
    return user ? { ...p, css: user.css, fonts: p.fonts || user.fonts || [] } : (p as Part);
  });
}
const PARTS = _enrichParts(partsData as any[], pagesData as Pg[]);

// The site home ("/") is owned by app/page.tsx (which renders the page flagged
// "Set as Homepage"). Everything else routes through here. We exclude the home
// page and any "/" path so a page is never served at two URLs.
const PUBLISHED = (pagesData as Pg[]).filter(
  (p) => p.status === "published" && p.path && p.path.replace(/\/+$/g, "") !== "" && !p.isHome
);

// Minimal, dependency-free Markdown → HTML (headings, bold, italic, links, lists).
function mdToHtml(src: string): string {
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const inline = (s: string) =>
    esc(s)
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.+?)\*/g, "<em>$1</em>")
      .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>');
  const lines = (src || "").split("\n");
  let html = "", inList = false;
  for (const raw of lines) {
    const line = raw.trim();
    if (/^[-*] /.test(line)) { if (!inList) { html += "<ul>"; inList = true; } html += `<li>${inline(line.slice(2))}</li>`; continue; }
    if (inList) { html += "</ul>"; inList = false; }
    if (/^### /.test(line)) html += `<h3>${inline(line.slice(4))}</h3>`;
    else if (/^## /.test(line)) html += `<h2>${inline(line.slice(3))}</h2>`;
    else if (/^# /.test(line)) html += `<h2>${inline(line.slice(2))}</h2>`;
    else if (line) html += `<p>${inline(line)}</p>`;
  }
  if (inList) html += "</ul>";
  return html;
}

function toSegments(path: string): string[] {
  return path.replace(/^\/+|\/+$/g, "").split("/").filter(Boolean);
}
function findByParams(slug: string[]): Pg | undefined {
  const path = "/" + (slug || []).join("/");
  return PUBLISHED.find((p) => p.path.replace(/\/+$/g, "") === path.replace(/\/+$/g, ""));
}

export const dynamicParams = false;

// output:export errors if a dynamic route yields zero params, so when there are
// no published pages yet we emit a single placeholder route that just 404s.
export function generateStaticParams() {
  const params = PUBLISHED.map((p) => ({ slug: toSegments(p.path) }));
  return params.length ? params : [{ slug: ["_placeholder"] }];
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  const page = findByParams(slug);
  if (!page) return {};
  const canonical = canonicalFor(page.path);
  const t = page.seoTitle || page.title;
  const d = page.seoDescription || "";
  // Open Graph + Twitter mirror THIS page's own title/description (not the site-wide
  // default), so social / link-preview cards match the page. Set per page.
  return {
    title: t,
    description: d,
    // When the page is set to "no-index" in the dashboard, tell search engines not
    // to index it (links are still followed). It's also dropped from the sitemap.
    ...(page.noindex ? { robots: { index: false, follow: true } } : {}),
    ...(canonical ? { alternates: { canonical } } : {}),
    openGraph: { title: t, description: d, type: "website", ...(canonical ? { url: canonical } : {}) },
    twitter: { card: "summary_large_image", title: t, description: d },
  };
}

export default async function DynamicPage({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  const page = findByParams(slug);
  if (!page) notFound();

  // Imported mockup pages carry their own design + chrome — render them whole.
  // Detect by the layout flag OR by the tell-tale of imported content (section
  // blocks that carry raw HTML), so a page always renders its design even if the
  // layout flag is ever missing.
  const isMockup =
    page.layout === "mockup" ||
    (Array.isArray(page.blocks) && page.blocks.some((b) => b && b.props && typeof b.props.html === "string" && b.props.html.trim() !== ""));
  if (isMockup) {
    return <MockupPage page={page} parts={PARTS} />;
  }

  const hasBlocks = Array.isArray(page.blocks) && page.blocks.length > 0;
  const html = hasBlocks ? "" : mdToHtml(page.body || "");

  return (
    <>
      {(page._schemas || []).map((b, i) =>
        b && b.data && Object.keys(b.data).length ? (
          <JsonLd key={i} data={{ "@context": "https://schema.org", ...b.data }} />
        ) : null
      )}
      <SiteHeader />
      {hasBlocks ? (
        <main>
          <Blocks blocks={page.blocks} />
        </main>
      ) : (
        <main className="mx-auto max-w-3xl px-5 py-16">
          <h1 className="font-display text-3xl font-extrabold text-navy sm:text-4xl">{page.title}</h1>
          <div className="rte mt-6" dangerouslySetInnerHTML={{ __html: html }} />
        </main>
      )}
      <SiteFooter />
    </>
  );
}
