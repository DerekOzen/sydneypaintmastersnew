// Site home ("/"). Fully dashboard-driven: it renders whichever page is flagged
// "Set as Homepage" in the Nifty dashboard. The old hard-coded homepage has been
// removed — the homepage is now managed like any other page.
import fs from "fs";
import path from "path";
import SiteHeader from "@/components/site-header";
import SiteFooter from "@/components/site-footer";
import { JsonLd } from "@/components/schema";
import { Blocks } from "@/components/blocks";
import { MockupPage } from "@/components/mockup-page";
import { site } from "@/lib/site";
import partsData from "@/content/parts.json";

// Build-time content loader (see app/[...slug]/page.tsx). content/pages.json is a
// lightweight index; heavy page content lives in content/pages/<id>.json. Falls
// back to inline blocks for the old format. Self-contained on purpose.
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

type Pg = {
  path: string; status?: string; layout?: string; title: string; isHome?: boolean;
  seoTitle?: string; seoDescription?: string; noindex?: boolean; css?: string; fonts?: string[];
  headerPartId?: string | null; footerPartId?: string | null;
  blocks?: Array<{ id?: string; type: string; props?: Record<string, any> }>;
  _schemas?: Array<{ type?: string; data?: Record<string, unknown> }>;
};

// Shared header/footer parts must carry their own CSS/fonts so they render identically
// everywhere. Back-fill a part's CSS from a page that uses it if the part has none
// stored (mirrors the dashboard's part editor). See app/[...slug]/page.tsx.
function _enrichParts(rawParts: any[], pages: Pg[]): any[] {
  return (Array.isArray(rawParts) ? rawParts : []).map((p: any) => {
    if (p?.css && String(p.css).trim() !== "") return p;
    const user = pages.find((pg) => (pg.headerPartId === p.id || pg.footerPartId === p.id) && pg.css && pg.css.trim() !== "");
    return user ? { ...p, css: user.css, fonts: p.fonts || user.fonts || [] } : p;
  });
}
const PARTS = _enrichParts(partsData as any[], pagesData as Pg[]);

// Prefer the page explicitly flagged "Set as Homepage"; but if that flag was ever
// lost, fall back to any published page still sitting at "/" so the site never
// goes blank ("No homepage set yet") while a home page clearly exists.
const HOME_PAGE = (pagesData as Pg[]).find((p) => p.status === "published" && p.isHome)
  || (pagesData as Pg[]).find((p) => p.status === "published" && (p.path === "/" || p.path === ""));

// Canonical for the homepage = the site's configured address (the real domain once a
// custom domain is connected), so engines treat the real domain as authoritative.
const HOME_CANONICAL = (() => { const b = (site.siteUrl || "").replace(/\/+$/, ""); return b ? b + "/" : undefined; })();

const HOME_T = HOME_PAGE ? (HOME_PAGE.seoTitle || HOME_PAGE.title) : ((site as any).name || "Home");
const HOME_D = HOME_PAGE ? (HOME_PAGE.seoDescription || "") : "";
export const metadata = {
  title: HOME_T,
  description: HOME_D,
  ...(HOME_PAGE && HOME_PAGE.noindex ? { robots: { index: false, follow: true } } : {}),
  ...(HOME_CANONICAL ? { alternates: { canonical: HOME_CANONICAL } } : {}),
  openGraph: { title: HOME_T, description: HOME_D, type: "website", ...(HOME_CANONICAL ? { url: HOME_CANONICAL } : {}) },
  twitter: { card: "summary_large_image", title: HOME_T, description: HOME_D },
};

function isMockup(p: Pg): boolean {
  return p.layout === "mockup" ||
    (Array.isArray(p.blocks) && p.blocks.some((b) => b && b.props && typeof (b.props as any).html === "string" && (b.props as any).html.trim() !== ""));
}

export default function Home() {
  if (HOME_PAGE) {
    if (isMockup(HOME_PAGE)) return <MockupPage page={HOME_PAGE} parts={PARTS as any} />;
    if (Array.isArray(HOME_PAGE.blocks) && HOME_PAGE.blocks.length) {
      return (
        <>
          {(HOME_PAGE._schemas || []).map((b, i) => (b && b.data && Object.keys(b.data).length ? <JsonLd key={i} data={{ "@context": "https://schema.org", ...b.data }} /> : null))}
          <SiteHeader />
          <main><Blocks blocks={HOME_PAGE.blocks} /></main>
          <SiteFooter />
        </>
      );
    }
  }
  // No homepage set yet — neutral placeholder (set one in the dashboard).
  return (
    <main style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px", textAlign: "center", fontFamily: "system-ui, sans-serif" }}>
      <div>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: "#16294d" }}>No homepage set yet</h1>
        <p style={{ marginTop: 8, color: "#64748b" }}>Choose a page in the dashboard and click “Set as Homepage”.</p>
      </div>
    </main>
  );
}
