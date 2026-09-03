import type { Metadata } from "next";
import fs from "fs";
import path from "path";
import "./globals.css";
import { site } from "@/lib/site";

// Custom scripts (GA4, GTM, pixels, chat…) managed from the dashboard and stored
// at content/scripts.json. Read at build; missing/invalid file = no scripts.
function readScripts(): { header: string; body: string; footer: string } {
  try {
    const raw = fs.readFileSync(path.join(process.cwd(), "content/scripts.json"), "utf8");
    const d = JSON.parse(raw);
    return { header: d.header || "", body: d.body || "", footer: d.footer || "" };
  } catch {
    return { header: "", body: "", footer: "" };
  }
}

// Site-wide "back to top" button, read from content/theme.json (set in the dashboard's
// Global Styles). Injected once here so it appears on EVERY page with no per-page HTML —
// existing sites get it on their next rebuild. Themeable (position/shape/icon/colours).
function readBackToTop(): any {
  try { const d = JSON.parse(fs.readFileSync(path.join(process.cwd(), "content/theme.json"), "utf8")); return (d && d.backToTop && typeof d.backToTop === "object") ? d.backToTop : null; }
  catch { return null; }
}
function backToTopHtml(bt: any): string {
  if (!bt || !bt.enabled) return "";
  const side = bt.position === "bl" ? "left" : "right";
  const radius = bt.shape === "square" ? "8px" : bt.shape === "rounded" ? "16px" : "50%";
  const size = Math.max(38, Math.min(72, Math.round(Number(bt.size) || 48)));
  const hex = (v: string, d: string) => (/^#[0-9a-fA-F]{6}$/.test(v || "") ? v : d);
  const bg = hex(bt.bg, "#111827"), fg = hex(bt.fg, "#ffffff");
  const icons: Record<string, string> = {
    chevron: '<path d="M6 15l6-6 6 6"/>',
    chevrons: '<path d="M7 12l5-5 5 5"/><path d="M7 18l5-5 5 5"/>',
    arrow: '<path d="M12 20V5"/><path d="M6 11l6-6 6 6"/>',
    caret: '<path d="M12 8l7 9H5z" fill="currentColor" stroke="none"/>',
  };
  const svg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (icons[bt.icon] || icons.chevron) + '</svg>';
  const css = '.nifty-totop{position:fixed;z-index:2147482000;bottom:22px;' + side + ':22px;width:' + size + 'px;height:' + size + 'px;display:flex;align-items:center;justify-content:center;padding:0;border:0;cursor:pointer;background:' + bg + ';color:' + fg + ';border-radius:' + radius + ';box-shadow:0 6px 20px rgba(0,0,0,.22);opacity:0;visibility:hidden;transform:translateY(10px);transition:opacity .25s ease,transform .25s ease,visibility .25s;-webkit-tap-highlight-color:transparent}.nifty-totop svg{width:52%;height:52%;display:block}.nifty-totop:hover{filter:brightness(1.08)}.nifty-totop:focus-visible{outline:2px solid ' + fg + ';outline-offset:2px}.nifty-totop.nifty-totop-on{opacity:1;visibility:visible;transform:none}@media print{.nifty-totop{display:none!important}}';
  const js = "(function(){var b=document.querySelector('.nifty-totop');if(!b)return;function s(){var y=window.pageYOffset||document.documentElement.scrollTop||0;if(y>300)b.classList.add('nifty-totop-on');else b.classList.remove('nifty-totop-on');}window.addEventListener('scroll',s,{passive:true});window.addEventListener('resize',s);s();b.addEventListener('click',function(){try{window.scrollTo({top:0,behavior:'smooth'});}catch(e){window.scrollTo(0,0);}});})();";
  return '<style>' + css + '</style><button type="button" class="nifty-totop" aria-label="Back to top" title="Back to top">' + svg + '</button><script>' + js + '</script>';
}

// Site-wide DEFAULT metadata — a FALLBACK only. Every page sets its own title,
// description and Open Graph via generateMetadata, which override these. Derived from the
// site's own settings so a page can never leak another site's content (e.g. the template's).
const _SITE_NAME = (site as any).name || "Website";
const _SITE_DESC = (site as any).description || (site as any).tagline || "";
export const metadata: Metadata = {
  metadataBase: new URL(site.siteUrl || "https://nifty-site.pages.dev"),
  title: _SITE_NAME,
  description: _SITE_DESC,
  openGraph: { title: _SITE_NAME, description: _SITE_DESC, type: "website", locale: "en_AU" },
  twitter: { card: "summary_large_image", title: _SITE_NAME, description: _SITE_DESC },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const s = readScripts();
  const btHtml = backToTopHtml(readBackToTop());
  // Custom scripts inject at the top of <body> (header + body) and the end
  // (footer). We keep <head> as normal JSX so Next's SEO metadata (title, meta
  // description, charset, viewport, Open Graph) is never disturbed. display:contents
  // keeps the wrappers invisible; in a static build these scripts run on page load.
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Poppins:wght@500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans antialiased">
        {s.header ? <div style={{ display: "contents" }} dangerouslySetInnerHTML={{ __html: s.header }} /> : null}
        {s.body ? <div style={{ display: "contents" }} dangerouslySetInnerHTML={{ __html: s.body }} /> : null}
        {children}
        {s.footer ? <div style={{ display: "contents" }} dangerouslySetInnerHTML={{ __html: s.footer }} /> : null}
        {btHtml ? <div style={{ display: "contents" }} dangerouslySetInnerHTML={{ __html: btHtml }} /> : null}
      </body>
    </html>
  );
}
