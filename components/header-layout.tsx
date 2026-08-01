// Structured header builder → HTML + CSS. Self-contained COPY of the dashboard's
// lib/header-render.ts (render + css only) — keep the two in sync. Supports stacked rows.

export type HeaderElementType = "logo" | "menu" | "phone" | "button" | "social" | "text";
export type HeaderElement = { id: string; type: HeaderElementType; props: Record<string, any>; hideMobile?: boolean };
export type HeaderRow = {
  id: string;
  left: HeaderElement[]; center: HeaderElement[]; right: HeaderElement[];
  bg?: string; color?: string; height?: number; hideMobile?: boolean;
};
export type HeaderLayout = {
  enabled: boolean;
  rows?: HeaderRow[];
  accent?: string; maxWidth?: number;
  left?: HeaderElement[]; center?: HeaderElement[]; right?: HeaderElement[];
  bg?: string; color?: string; height?: number;
};

export function normalizeRows(layout: HeaderLayout): HeaderRow[] {
  if (layout && Array.isArray(layout.rows) && layout.rows.length) return layout.rows;
  return [{
    id: "row-1",
    left: layout?.left || [], center: layout?.center || [], right: layout?.right || [],
    bg: layout?.bg, color: layout?.color, height: layout?.height,
  }];
}

function esc(s: any): string {
  return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function telHref(n: any): string { return "tel:" + String(n || "").replace(/[^0-9+]/g, ""); }

// A reusable menu resolved by id → its items (with one level of children).
type MenuLite = { id: string; name?: string; items?: any[] };

function renderMenuNodes(items: any[]): string {
  return (items || []).map((it, i) => {
    const kids = Array.isArray(it.children) && it.children.length ? it.children : null;
    if (!kids) return `<li class="nifty-mitem"><a href="${esc(it.href || "#")}">${esc(it.label || "")}</a></li>`;
    // A parent with children opens its dropdown on TAP/CLICK (a hidden checkbox +
    // <label>, so it works on mobile and desktop with no JS) and also on hover on
    // desktop. If the parent has no real link of its own (href "#"/empty) the whole
    // label toggles; if it does link somewhere, the caret toggles and the text links.
    const sid = "nsub-" + esc(it.id || ("i" + i));
    const href = String(it.href || "").trim();
    const toggleOnly = href === "" || href === "#";
    const sub = `<ul class="nifty-submenu">${kids.map((c: any) => `<li><a href="${esc(c.href || "#")}">${esc(c.label || "")}</a></li>`).join("")}</ul>`;
    const parent = toggleOnly
      ? `<label for="${sid}" class="nifty-mparent">${esc(it.label || "")}<span class="nifty-caret">&#9662;</span></label>`
      : `<a href="${esc(href)}" class="nifty-mparent-link">${esc(it.label || "")}</a><label for="${sid}" class="nifty-caret-toggle" aria-label="Open submenu"><span class="nifty-caret">&#9662;</span></label>`;
    return `<li class="nifty-mitem nifty-has-sub"><input type="checkbox" class="nifty-sub-toggle" id="${sid}">${parent}${sub}</li>`;
  }).join("");
}

function renderEl(el: HeaderElement, menus?: MenuLite[]): string {
  const p = el.props || {};
  switch (el.type) {
    case "logo": {
      const inner = p.src
        ? `<img src="${esc(p.src)}" alt="${esc(p.alt || "")}" style="height:${parseInt(p.height, 10) || 40}px;width:auto;display:block">`
        : `<span class="nifty-h-logotext">${esc(p.alt || p.text || "Logo")}</span>`;
      return `<a href="${esc(p.href || "/")}" class="nifty-h-logo">${inner}</a>`;
    }
    case "menu": {
      let nav: string;
      if (p.menuId && Array.isArray(menus) && (menus.find((x) => x.id === p.menuId)?.items || []).length) {
        const items = menus.find((x) => x.id === p.menuId)!.items || [];
        nav = `<nav class="nifty-h-menu nifty-h-menu-tree"><ul class="nifty-menu">${renderMenuNodes(items)}</ul></nav>`;
      } else {
        const links: any[] = Array.isArray(p.links) ? p.links : [];
        nav = `<nav class="nifty-h-menu">${links.map((l) => `<a href="${esc(l.href || "#")}">${esc(l.label || "")}</a>`).join("")}</nav>`;
      }
      // Responsive: horizontal on desktop/laptop; hamburger dropdown on tablet/mobile
      // (pure-CSS checkbox toggle — works with no JS on the static site).
      const mid = "mnav-" + esc(el.id || "m");
      return `<span class="nifty-menu-wrap"><input type="checkbox" class="nifty-mnav-toggle" id="${mid}"><label for="${mid}" class="nifty-mnav-burger" aria-label="Menu">&#9776;</label>${nav}</span>`;
    }
    case "phone": {
      const label = p.label || p.number || "";
      return `<a href="${esc(telHref(p.number))}" class="nifty-h-phone">${p.icon === false ? "" : '<span class="nifty-h-ico">&#9742;</span>'}${esc(label)}</a>`;
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
function zoneHtml(els: HeaderElement[], menus?: MenuLite[]): string {
  return (els || []).filter(Boolean).map((e) => `<div class="nifty-h-item${e.hideMobile ? " nifty-hide-mobile" : ""}">${renderEl(e, menus)}</div>`).join("");
}

export function renderHeaderLayout(layout: HeaderLayout, menus?: MenuLite[]): string {
  const rows = normalizeRows(layout);
  const mw = layout.maxWidth ? `max-width:${layout.maxWidth}px;margin:0 auto;` : "";
  return rows.map((row, i) =>
    `<div class="nifty-hbar nifty-hbar-${i}${row.hideMobile ? " nifty-hide-mobile" : ""}"><div class="nifty-hrow" style="${mw}">` +
    `<div class="nifty-hcell nifty-left">${zoneHtml(row.left, menus)}</div>` +
    `<div class="nifty-hcell nifty-center">${zoneHtml(row.center, menus)}</div>` +
    `<div class="nifty-hcell nifty-right">${zoneHtml(row.right, menus)}</div>` +
    `</div></div>`
  ).join("");
}

export function headerLayoutCss(layout: HeaderLayout): string {
  const rows = normalizeRows(layout);
  const accent = layout.accent || "#0f766e";
  let css = `
.nifty-hbar{width:100%;box-sizing:border-box}
.nifty-hrow{display:flex;align-items:center;justify-content:space-between;gap:20px;padding:0 24px;box-sizing:border-box}
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
.nifty-h-menu-tree ul.nifty-menu{display:flex;gap:20px;align-items:center;list-style:none;margin:0;padding:0}
.nifty-menu>li{position:relative}
.nifty-menu a,.nifty-mparent,.nifty-mparent-link{color:inherit;text-decoration:none;font-weight:600;font-size:15px;white-space:nowrap;display:inline-flex;align-items:center;gap:5px}
.nifty-menu a:hover,.nifty-mparent:hover,.nifty-mparent-link:hover{opacity:.7}
.nifty-mparent,.nifty-caret-toggle{cursor:pointer;user-select:none}
.nifty-caret-toggle{display:inline-flex;align-items:center;padding:0 2px}
.nifty-sub-toggle{position:absolute;opacity:0;width:0;height:0;pointer-events:none}
.nifty-caret{font-size:10px;opacity:.7}
.nifty-submenu{position:absolute;top:100%;left:0;min-width:190px;background:#fff;color:#0f172a;border-radius:10px;box-shadow:0 10px 28px rgba(0,0,0,.14);padding:6px 0;list-style:none;margin:2px 0 0;opacity:0;visibility:hidden;transform:translateY(6px);transition:.15s;z-index:60}
.nifty-has-sub:hover>.nifty-submenu,.nifty-sub-toggle:checked~.nifty-submenu{opacity:1;visibility:visible;transform:translateY(0)}
.nifty-submenu li{display:block}
.nifty-submenu a{display:block;padding:9px 18px;white-space:nowrap;font-weight:500;font-size:14px}
.nifty-submenu a:hover{background:#f1f5f9;opacity:1}
.nifty-menu-wrap{display:inline-flex;align-items:center}
.nifty-mnav-toggle{position:absolute;opacity:0;width:0;height:0;pointer-events:none}
.nifty-mnav-burger{display:none;cursor:pointer;font-size:26px;line-height:1;user-select:none;padding:2px 6px;color:inherit}
@media(max-width:980px){
.nifty-hbar{position:relative}
.nifty-mnav-burger{display:inline-flex}
.nifty-menu-wrap>nav.nifty-h-menu{display:none;position:absolute;top:100%;left:0;right:0;z-index:70;flex-direction:column;align-items:stretch;gap:0;background:#fff;color:#0f172a;box-shadow:0 12px 28px rgba(0,0,0,.16);padding:8px 0;border-radius:0 0 12px 12px}
.nifty-mnav-toggle:checked~nav.nifty-h-menu{display:flex}
.nifty-menu-wrap nav.nifty-h-menu>a{display:block;padding:11px 20px}
.nifty-menu-wrap ul.nifty-menu{flex-direction:column;align-items:stretch;gap:0}
.nifty-menu-wrap .nifty-menu>li>a,.nifty-menu-wrap .nifty-mparent,.nifty-menu-wrap .nifty-mparent-link{padding:11px 20px}
.nifty-menu-wrap .nifty-mitem.nifty-has-sub{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between}
.nifty-menu-wrap .nifty-mparent{flex:1 1 auto;justify-content:space-between}
.nifty-menu-wrap .nifty-caret-toggle{padding:11px 20px}
.nifty-menu-wrap .nifty-submenu{position:static;display:none;opacity:1;visibility:visible;transform:none;box-shadow:none;background:transparent;color:inherit;padding:0 0 6px 34px;margin:0;min-width:0;width:100%}
.nifty-menu-wrap .nifty-sub-toggle:checked~.nifty-submenu{display:block}
.nifty-menu-wrap .nifty-submenu a{padding:7px 0}
}
`;
  rows.forEach((row, i) => {
    const bg = row.bg || "#ffffff"; const color = row.color || "#0f172a"; const h = parseInt(String(row.height), 10) || 64;
    css += `.nifty-hbar-${i}{background:${bg};color:${color}}\n.nifty-hbar-${i} .nifty-hrow{min-height:${h}px;font-size:${i === 0 && rows.length > 1 ? "13px" : "inherit"}}\n`;
  });
  css += `@media(max-width:820px){.nifty-hrow{gap:12px;padding:0 16px}.nifty-hide-mobile{display:none !important}}\n`;
  return css;
}
