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
      </body>
    </html>
  );
}
