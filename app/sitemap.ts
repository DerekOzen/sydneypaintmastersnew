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
type Pg = { path: string; status?: string; isHome?: boolean; noindex?: boolean };
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
  const paths = new Set<string>(["/"]);
  for (const p of published) {
    if (p.isHome) continue;
    const clean = "/" + p.path.replace(/^\/+|\/+$/g, "");
    if (clean !== "/") paths.add(clean);
  }
  return Array.from(paths).map((r) => {
    // Trailing slash on every URL (home = base + "/") to match the canonical form.
    const slug = r.replace(/^\/+|\/+$/g, "");
    return {
      url: slug ? `${base}/${slug}/` : `${base}/`,
      lastModified: new Date("2026-07-01"),
      changeFrequency: "monthly" as const,
      priority: r === "/" ? 1 : 0.8,
    };
  });
}
