import fs from "fs";
import path from "path";
import { site } from "@/lib/site";

// ai.txt is managed from the dashboard (content/ai.txt in this repo) — a companion to
// robots.txt aimed at AI/LLM crawlers. Read at build; missing file falls back to a
// sensible default. (robots.txt remains the file AI bots primarily obey.)
export const dynamic = "force-static";

export function GET() {
  const base = (site.siteUrl || "https://nifty-site.pages.dev").replace(/\/+$/, "");
  let body: string;
  try {
    body = fs.readFileSync(path.join(process.cwd(), "content/ai.txt"), "utf8");
  } catch {
    body = `# ai.txt for ${base}/\n# See also /robots.txt (the file AI bots primarily obey).\n\nSitemap: ${base}/sitemap.xml\n\nUser-agent: *\nAllow: /\n`;
  }
  return new Response(body, { headers: { "content-type": "text/plain; charset=utf-8" } });
}
