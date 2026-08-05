import fs from "fs";
import path from "path";
import { site } from "@/lib/site";

// llms.txt (llmstxt.org) is a Markdown map of the site for AI assistants / answer engines,
// managed from the dashboard (content/llms.txt in this repo). Read at build; missing file
// falls back to a minimal default. Not a Google ranking factor — see the dashboard note.
export const dynamic = "force-static";

export function GET() {
  const base = (site.siteUrl || "https://nifty-site.pages.dev").replace(/\/+$/, "");
  let body: string;
  try {
    body = fs.readFileSync(path.join(process.cwd(), "content/llms.txt"), "utf8");
  } catch {
    const nm = (site as any).name || (site as any).businessName || "Website";
    body = `# ${nm}\n\n> ${base}\n`;
  }
  return new Response(body, { headers: { "content-type": "text/plain; charset=utf-8" } });
}
