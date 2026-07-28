import fs from "fs";
import path from "path";
import { site } from "@/lib/site";

// robots.txt is managed from the dashboard (content/robots.txt in this repo).
// Read at build; missing file falls back to a sensible default.
export const dynamic = "force-static";

export function GET() {
  const base = (site.siteUrl || "https://nifty-site.pages.dev").replace(/\/+$/, "");
  let body: string;
  try {
    body = fs.readFileSync(path.join(process.cwd(), "content/robots.txt"), "utf8");
  } catch {
    body = `User-agent: *\nAllow: /\n\nSitemap: ${base}/sitemap.xml\n`;
  }
  return new Response(body, { headers: { "content-type": "text/plain; charset=utf-8" } });
}
