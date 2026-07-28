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

export const metadata: Metadata = {
  metadataBase: new URL(site.siteUrl || "https://nifty-site.pages.dev"),
  title: "Your Business | NDIS Registered Provider — Melbourne & Sydney",
  description:
    "Your Business is a registered NDIS provider delivering compassionate, person-centred support across Melbourne & Sydney. Personal care, community participation, household tasks and more. Call 1300 617 775.",
  keywords: [
    "NDIS provider",
    "NDIS support Melbourne",
    "NDIS support Sydney",
    "disability support",
    "personal care",
    "community participation",
  ],
  openGraph: {
    title: "Your Business — Registered NDIS Provider",
    description:
      "Compassionate, person-centred NDIS support across Melbourne & Sydney.",
    type: "website",
    locale: "en_AU",
  },
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
