import type { MetadataRoute } from "next";
import fs from "fs";
import path from "path";
import { site } from "@/lib/site";

export const dynamic = "force-static";

// The sitemap only needs page metadata (path/status/isHome), which lives in the
// content/pages.json index — no need to read the per-page body files.
const pagesData: any[] = (() => {
  try { const d = JSON.parse(fs.readFileSync(path.join(process.cwd(), "content/pages.json"), "utf8")); return Array.isArray(d) ? d : []; }
  catch { return []; }
})();

// The sitemap is generated from the dashboard-managed pages (content/pages.json),
// so it always reflects the pages that actually exist — never deleted ones.
type Pg = { path: string; status?: string; isHome?: boolean };

export default function sitemap(): MetadataRoute.Sitemap {
  const base = (site.siteUrl || "https://nifty-site.pages.dev").replace(/\/$/, "");
  const published = (pagesData as Pg[]).filter((p) => p.status === "published" && p.path);

  // Home ("/") first, then every published page at its own path (skip the home
  // page's own path so it isn't listed twice).
  const paths = new Set<string>(["/"]);
  for (const p of published) {
    if (p.isHome) continue;
    const clean = "/" + p.path.replace(/^\/+|\/+$/g, "");
    if (clean !== "/") paths.add(clean);
  }

  return Array.from(paths).map((r) => ({
    url: `${base}${r === "/" ? "" : r}`,
    lastModified: new Date("2026-07-01"),
    changeFrequency: "monthly",
    priority: r === "/" ? 1 : 0.8,
  }));
}
