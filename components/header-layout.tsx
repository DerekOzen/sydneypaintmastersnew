// Structured header ("zone builder", Phase 2) → HTML + CSS. Self-contained COPY of the
// dashboard's lib/header-render.ts — keep the two in sync. Renders a header from three
// zones (left/center/right) of elements instead of captured mockup HTML.

export type HeaderElementType = "logo" | "menu" | "phone" | "button" | "social" | "text";
export type HeaderElement = { id: string; type: HeaderElementType; props: Record<string, any>; hideMobile?: boolean };
export type HeaderLayout = {
  enabled: boolean;
  left: HeaderElement[]; center: HeaderElement[]; right: HeaderElement[];
  bg?: string; color?: string; accent?: string; height?: number; maxWidth?: number;
};

function esc(s: any): string {
  return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function telHref(n: any): string { return "tel:" + String(n || "").replace(/[^0-9+]/g, ""); }

function renderEl(el: HeaderElement): string {
  const p = el.props || {};
  switch (el.type) {
    case "logo": {
      const inner = p.src
        ? `<img src="${esc(p.src)}" alt="${esc(p.alt || "")}" style="height:${parseInt(p.height, 10) || 40}px;width:auto;display:block">`
        : `<span class="nifty-h-logotext">${esc(p.alt || p.text || "Logo")}</span>`;
      return `<a href="${esc(p.href || "/")}" class="nifty-h-logo">${inner}</a>`;
    }
    case "menu": {
      const links: any[] = Array.isArray(p.links) ? p.links : [];
      return `<nav class="nifty-h-menu">${links.map((l) => `<a href="${esc(l.href || "#")}">${esc(l.label || "")}</a>`).join("")}</nav>`;
    }
    case "phone": {
      const label = p.label || p.number || "";
      return `<a href="${esc(telHref(p.number))}" class="nifty-h-phone">${p.icon === false ? "" : '<span class="nifty-h-ico">☎</span>'}${esc(label)}</a>`;
    }
    case "button":
      return `<a href="${esc(p.href || "#")}" class="nifty-h-btn">${esc(p.label || "Button")}</a>`;
    case "social": {
      const items: any[] = Array.isArray(p.items) ? p.items : [];
      return `<span class="nifty-h-social">${items.map((i) => `<a href="${esc(i.href || "#")}" aria-label="${esc(i.network || "")}">${esc((i.network || "?").slice(0, 2))}</a>`).join("")}</span>`;
    }
    case "text":
      return `<div class="nifty-h-text">${p.html != null ? String(p.html) : esc(p.text || "")}</div>`;
    default:
      return "";
  }
}
function zoneHtml(els: HeaderElement[]): string {
  return (els || []).filter(Boolean).map((e) => `<div class="nifty-h-item${e.hideMobile ? " nifty-hide-mobile" : ""}">${renderEl(e)}</div>`).join("");
}

export function renderHeaderLayout(layout: HeaderLayout): string {
  const mw = layout.maxWidth ? `max-width:${layout.maxWidth}px;margin:0 auto;` : "";
  return (
    `<div class="nifty-hbar"><div class="nifty-hrow" style="${mw}">` +
    `<div class="nifty-hcell nifty-left">${zoneHtml(layout.left)}</div>` +
    `<div class="nifty-hcell nifty-center">${zoneHtml(layout.center)}</div>` +
    `<div class="nifty-hcell nifty-right">${zoneHtml(layout.right)}</div>` +
    `</div></div>`
  );
}

export function headerLayoutCss(layout: HeaderLayout): string {
  const bg = layout.bg || "#ffffff";
  const color = layout.color || "#0f172a";
  const accent = layout.accent || "#0f766e";
  const h = parseInt(String(layout.height), 10) || 72;
  return `
.nifty-hbar{background:${bg};color:${color};width:100%;box-sizing:border-box}
.nifty-hrow{display:flex;align-items:center;justify-content:space-between;gap:20px;min-height:${h}px;padding:0 24px;box-sizing:border-box}
.nifty-hcell{display:flex;align-items:center;gap:20px;min-width:0}
.nifty-hcell.nifty-center{flex:1 1 auto;justify-content:center}
.nifty-hcell.nifty-right{justify-content:flex-end}
.nifty-h-logo{display:inline-flex;align-items:center;text-decoration:none;color:inherit}
.nifty-h-logotext{font-weight:800;font-size:20px}
.nifty-h-menu{display:flex;gap:20px;align-items:center;flex-wrap:wrap}
.nifty-h-menu a{color:inherit;text-decoration:none;font-weight:600;font-size:15px;white-space:nowrap}
.nifty-h-menu a:hover{opacity:.7}
.nifty-h-phone{color:inherit;text-decoration:none;font-weight:700;display:inline-flex;align-items:center;gap:6px;white-space:nowrap}
.nifty-h-phone .nifty-h-ico{opacity:.8}
.nifty-h-btn{background:${accent};color:#fff;padding:11px 20px;border-radius:9px;text-decoration:none;font-weight:700;white-space:nowrap;line-height:1}
.nifty-h-btn:hover{filter:brightness(.94)}
.nifty-h-social{display:flex;gap:12px}
.nifty-h-social a{color:inherit;text-decoration:none;font-weight:700}
@media(max-width:820px){
  .nifty-hrow{gap:12px;padding:0 16px}
  .nifty-hide-mobile{display:none !important}
}
`;
}
