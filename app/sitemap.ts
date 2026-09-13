import type { MetadataRoute } from "next";
import fs from "fs";
import path from "path";
import { site } from "@/lib/site";

export const dynamic = "force-static";

function readFileSafe(rel: string): string {
  try { return fs.readFileSync(path.join(process.cwd(), rel), "utf8"); }
  catch { return ""; }
}

// ── Source of truth #1: a custom sitemap saved from the dashboard ────────────
// If content/sitemap.xml exists, the dashboard is the source of truth: we parse
// its <url> entries and serve exactly those. Editing the sitemap in the dashboard
// therefore controls the live sitemap.xml (mirrors how robots.txt works).
function parseCustom(xml: string): MetadataRoute.Sitemap | null {
  if (!xml || !/<urlset/i.test(xml)) return null;
  const out: MetadataRoute.Sitemap = [];
  const blocks = xml.match(/<url>[\s\S]*?<\/url>/gi) || [];
  for (const b of blocks) {
    const loc = (b.match(/<loc>([\s\S]*?)<\/loc>/i) || [])[1];
    if (!loc || !loc.trim()) continue;
    const lastmod = (b.match(/<lastmod>([\s\S]*?)<\/lastmod>/i) || [])[1];
    const changefreq = (b.match(/<changefreq>([\s\S]*?)<\/changefreq>/i) || [])[1];
    const priority = (b.match(/<priority>([\s\S]*?)<\/priority>/i) || [])[1];
    const e: MetadataRoute.Sitemap[number] = { url: loc.trim() };
    if (lastmod && lastmod.trim()) e.lastModified = lastmod.trim();
    if (changefreq && changefreq.trim()) e.changeFrequency = changefreq.trim() as any;
    if (priority && priority.trim()) e.priority = parseFloat(priority);
    out.push(e);
  }
  return out.length ? out : null;
}

// ── Source of truth #2: auto-generate from the dashboard-managed pages ───────
// The sitemap only needs page metadata (path/status/isHome), which lives in the
// content/pages.json index — no need to read the per-page body files.
type Pg = { path: string; status?: string; isHome?: boolean; noindex?: boolean; updatedAt?: string; createdAt?: string };

// Each URL's lastModified is that page's own last-edited time (updatedAt), so the sitemap
// reflects when each page actually changed — not one shared date for the whole site.
function lastmodOf(p?: Pg): Date {
  const raw = p && (p.updatedAt || p.createdAt);
  if (raw) { const d = new Date(raw); if (!isNaN(d.getTime())) return d; }
  return new Date("2026-07-01");
}
const pagesData: any[] = (() => {
  try { const d = JSON.parse(readFileSafe("content/pages.json")); return Array.isArray(d) ? d : []; }
  catch { return []; }
})();

export default function sitemap(): MetadataRoute.Sitemap {
  // A saved custom sitemap wins — that's the dashboard being the source of truth.
  const custom = parseCustom(readFileSafe("content/sitemap.xml"));
  if (custom) return custom;

  // Otherwise generate from the pages that actually exist (never deleted ones).
  const base = (site.siteUrl || "https://nifty-site.pages.dev").replace(/\/$/, "");
  const published = (pagesData as Pg[]).filter((p) => p.status === "published" && p.path && !p.noindex);
  const home = published.find((p) => p.isHome);
  // Keep each path paired with its page so its own updatedAt drives lastModified.
  const items: { slug: string; page?: Pg }[] = [{ slug: "", page: home }];
  const seen = new Set<string>(["/"]);
  for (const p of published) {
    if (p.isHome) continue;
    const clean = "/" + p.path.replace(/^\/+|\/+$/g, "");
    if (clean === "/" || seen.has(clean)) continue;
    seen.add(clean);
    items.push({ slug: clean.replace(/^\/+|\/+$/g, ""), page: p });
  }
  return items.map((it) => ({
    // Trailing slash on every URL (home = base + "/") to match the canonical form.
    url: it.slug ? `${base}/${it.slug}/` : `${base}/`,
    // Only url + lastModified are emitted. changeFrequency and priority are omitted
    // because Google ignores both — a leaner sitemap with just the URL and its real date.
    lastModified: lastmodOf(it.page),
  }));
}
