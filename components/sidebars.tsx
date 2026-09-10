// Sidebar Menus renderer (live framework copy). Mirrored VERBATIM from the dashboard's
// lib/sidebars-render.ts. Keep in sync — if output changes on one side the live site
// and the dashboard preview drift.
// links, CTAs, icons) authored ONCE and rendered into a page's sidebar slot BY
// REFERENCE. Templates bind to a page type (Services / Industries / Locations), so
// every page of that type shows the same sidebar; edit the template once and every
// page updates on the next rebuild.
//
// Mirrored VERBATIM in fw/components/sidebars.tsx — keep in sync.

export type SidebarItemType = "heading" | "text" | "links" | "cta" | "contact" | "html";

export type SidebarLink = { label?: string; href?: string; icon?: string };

export type SidebarItem = {
  id?: string;
  type: SidebarItemType;
  text?: string;                 // heading / text / contact display
  sub?: string;                  // small line under a heading/contact
  links?: SidebarLink[];         // links
  ctaLabel?: string; ctaHref?: string; // cta
  html?: string;                 // custom
};

export type Sidebar = {
  id: string;
  name: string;
  forType?: "service" | "industry" | "location" | "page" | "";  // default binding
  accent?: string;               // hex
  items?: SidebarItem[];
  createdAt?: string; createdBy?: string; updatedAt?: string; updatedBy?: string;
};

function sbEsc(s: any): string {
  return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function sbHex(v: any, d: string): string {
  return /^#[0-9a-fA-F]{6}$/.test(String(v || "").trim()) ? String(v).trim() : d;
}
function sbUrl(u: any): string {
  return String(u || "").replace(/["'\\<>]/g, "");
}
export function sbClass(id: string): string {
  return "nifty-sb-" + String(id || "x").replace(/[^A-Za-z0-9_-]/g, "-");
}

function renderItem(it: SidebarItem): string {
  switch (it.type) {
    case "heading":
      return '<div class="sb-h">' + sbEsc(it.text || "") + (it.sub ? '<span class="sb-h-sub">' + sbEsc(it.sub) + "</span>" : "") + "</div>";
    case "text":
      return '<p class="sb-t">' + sbEsc(it.text || "") + "</p>";
    case "links": {
      const rows = (it.links || []).filter((l) => (l.label || "").trim()).map((l) =>
        '<li><a href="' + sbUrl(l.href || "#") + '">' + (l.icon ? '<span class="sb-ic">' + sbEsc(l.icon) + "</span>" : "") + sbEsc(l.label) + "</a></li>"
      ).join("");
      return rows ? '<ul class="sb-links">' + rows + "</ul>" : "";
    }
    case "cta":
      return it.ctaLabel ? '<a class="sb-cta" href="' + sbUrl(it.ctaHref || "#") + '">' + sbEsc(it.ctaLabel) + "</a>" : "";
    case "contact":
      return '<div class="sb-contact">' + sbEsc(it.text || "") + (it.sub ? '<span class="sb-contact-sub">' + sbEsc(it.sub) + "</span>" : "") + "</div>";
    case "html":
      return String(it.html || "");
    default:
      return "";
  }
}

export function renderSidebar(sb: Sidebar | undefined | null): { html: string; css: string } {
  if (!sb) return { html: "", css: "" };
  const root = sbClass(sb.id);
  const accent = sbHex(sb.accent, "#FFC80A");
  const body = (sb.items || []).map(renderItem).filter(Boolean).join("");
  const html = '<aside class="nifty-sb ' + root + '"><div class="sb-card">' + body + "</div></aside>";
  const s = "." + root;
  const css = [
    s + "{font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,sans-serif}",
    s + " *{box-sizing:border-box}",
    s + " .sb-card{position:sticky;top:24px;background:#0e1727;border:1px solid rgba(255,255,255,.09);border-radius:18px;padding:24px;color:#c7cedb}",
    s + " .sb-h{color:#fff;font-weight:800;font-size:18px;line-height:1.25}",
    s + " .sb-h .sb-h-sub{display:block;color:#8b93a3;font-weight:500;font-size:13px;margin-top:4px}",
    s + " .sb-t{margin:12px 0 0;font-size:14px;line-height:1.55}",
    s + " .sb-links{list-style:none;margin:14px 0 0;padding:0}",
    s + " .sb-links li{margin:0 0 8px}",
    s + " .sb-links a{display:flex;align-items:center;gap:9px;color:#c7cedb;text-decoration:none;font-size:14.5px;padding:8px 10px;border-radius:10px;transition:background .15s,color .15s}",
    s + " .sb-links a:hover{background:rgba(255,255,255,.05);color:#fff}",
    s + " .sb-ic{display:inline-flex;width:18px;justify-content:center;color:" + accent + "}",
    s + " .sb-cta{display:block;margin-top:16px;padding:13px 16px;border-radius:999px;background:" + accent + ";color:#141414;font-weight:700;font-size:14.5px;text-align:center;text-decoration:none;transition:filter .15s}",
    s + " .sb-cta:hover{filter:brightness(1.08)}",
    s + " .sb-contact{margin-top:16px;padding:14px;border:1px solid rgba(255,200,10,.4);border-radius:12px;color:" + accent + ";font-weight:800;font-size:18px}",
    s + " .sb-contact .sb-contact-sub{display:block;color:#8b93a3;font-weight:500;font-size:12.5px;margin-top:2px}",
    s + " .sb-card > * + .sb-h{margin-top:20px;padding-top:20px;border-top:1px solid rgba(255,255,255,.08)}",
  ].join("\n");
  return { html, css };
}
