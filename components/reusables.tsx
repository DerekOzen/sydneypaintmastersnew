// Reusable Sections renderer (live framework copy).
//
// A reusable section is authored once in the dashboard and inserted into pages BY
// REFERENCE. The page carries a block { type: "reusable", props: { refId } }; at
// build time the engine (mockup-page.tsx) reads content/reusables.json, finds the
// section by id, and renders it through this resolver — so editing the section in
// the dashboard updates every page that references it on the next rebuild.
//
// This file is the PURE renderer, mirrored VERBATIM from the dashboard's
// lib/reusables.ts (the pricing template + html-scoping). Keep the two in sync: if
// the output changes on one side, the live site and the dashboard preview drift.

export type ReusableKind = "pricing" | "html";
export type ReusablePlan = {
  name?: string; image?: string; fromLabel?: string; price?: string; priceSuffix?: string;
  badge?: string; highlight?: boolean; pill?: string; features?: string[];
  buttonText?: string; buttonLink?: string;
};
export type ReusablePricing = {
  eyebrow?: string; title?: string; titleAccent?: string; subtitle?: string; footnote?: string;
  bg?: string; accent?: string; plans?: ReusablePlan[];
};
export type Reusable = {
  id: string; name: string; kind: ReusableKind;
  data?: ReusablePricing; html?: string; css?: string;
};

function rzEsc(s: any): string {
  return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function rzHex(v: any, d: string): string {
  return /^#[0-9a-fA-F]{6}$/.test(String(v || "").trim()) ? String(v).trim() : d;
}
function rzUrl(u: any): string {
  return String(u || "").replace(/["'\\<>]/g, "");
}
export function rzClass(id: string): string {
  return "nifty-rz-" + String(id || "x").replace(/[^A-Za-z0-9_-]/g, "-");
}

function renderPricing(id: string, data: ReusablePricing): { html: string; css: string } {
  const root = rzClass(id);
  const bg = rzHex(data.bg, "#0a1020");
  const accent = rzHex(data.accent, "#FFC80A");
  const plans = Array.isArray(data.plans) ? data.plans : [];

  const cards = plans.map((p) => {
    const hot = !!p.highlight;
    const badge = (p.badge || "").trim();
    const img = (p.image || "").trim();
    const feats = (Array.isArray(p.features) ? p.features : []).filter((f) => String(f || "").trim() !== "");
    const btnText = (p.buttonText || "").trim();
    const btnLink = (p.buttonLink || "").trim() || "#";
    const pill = (p.pill || "").trim();
    return (
      '<div class="rz-card' + (hot ? " rz-hot" : "") + '">' +
        (badge ? '<div class="rz-badge">' + rzEsc(badge) + "</div>" : "") +
        (img ? '<div class="rz-imgwrap"><img src="' + rzUrl(img) + '" alt="' + rzEsc(p.name || "") + '" class="rz-img"></div>' : "") +
        '<div class="rz-name">' + rzEsc(p.name || "") + "</div>" +
        (p.fromLabel ? '<div class="rz-from">' + rzEsc(p.fromLabel) + "</div>" : "") +
        '<div class="rz-price">' + rzEsc(p.price || "") + (p.priceSuffix ? '<span class="rz-suffix">' + rzEsc(p.priceSuffix) + "</span>" : "") + "</div>" +
        (pill ? '<div class="rz-pill"><span class="rz-pill-tick">✓</span>' + rzEsc(pill) + "</div>" : "") +
        (feats.length ? '<ul class="rz-feats">' + feats.map((f) => "<li>" + rzEsc(f) + "</li>").join("") + "</ul>" : "") +
        (btnText ? '<a class="rz-btn' + (hot ? " rz-btn-hot" : "") + '" href="' + rzUrl(btnLink) + '">' + rzEsc(btnText) + "</a>" : "") +
      "</div>"
    );
  }).join("");

  const html =
    '<section class="nifty-rz ' + root + ' nifty-rz-pricing">' +
      '<div class="rz-inner">' +
        (data.eyebrow ? '<div class="rz-eyebrow">' + rzEsc(data.eyebrow) + "</div>" : "") +
        ((data.title || data.titleAccent) ? '<h2 class="rz-title">' + rzEsc(data.title || "") + (data.titleAccent ? ' <span class="rz-accent">' + rzEsc(data.titleAccent) + "</span>" : "") + "</h2>" : "") +
        (data.subtitle ? '<p class="rz-sub">' + rzEsc(data.subtitle) + "</p>" : "") +
        '<div class="rz-grid">' + cards + "</div>" +
        (data.footnote ? '<p class="rz-foot">' + rzEsc(data.footnote) + "</p>" : "") +
      "</div>" +
    "</section>";

  const s = "." + root;
  const css = [
    s + "{background:" + bg + ";color:#e5e7eb;padding:72px 20px;font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,sans-serif}",
    s + " *{box-sizing:border-box}",
    s + " .rz-inner{max-width:1180px;margin:0 auto}",
    s + " .rz-eyebrow{text-align:center;color:" + accent + ";font-weight:800;letter-spacing:.18em;font-size:12px;text-transform:uppercase}",
    s + " .rz-title{text-align:center;color:#fff;font-weight:800;font-size:clamp(30px,5vw,46px);line-height:1.08;margin:14px 0 0}",
    s + " .rz-title .rz-accent{color:#5b9cff}",
    s + " .rz-sub{text-align:center;color:#9aa4b6;max-width:640px;margin:18px auto 0;font-size:16px;line-height:1.55}",
    s + " .rz-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:22px;margin:46px auto 0;align-items:stretch}",
    s + " .rz-card{position:relative;background:#0e1727;border:1px solid rgba(255,255,255,.09);border-radius:22px;padding:34px 26px 30px;display:flex;flex-direction:column;text-align:center}",
    s + " .rz-card.rz-hot{border-color:rgba(255,200,10,.55);box-shadow:0 0 0 1px rgba(255,200,10,.4),0 40px 70px -24px rgba(255,200,10,.28)}",
    s + " .rz-badge{position:absolute;top:-13px;left:50%;transform:translateX(-50%);background:" + accent + ";color:#141414;font-weight:800;font-size:11px;letter-spacing:.02em;padding:5px 14px;border-radius:999px;white-space:nowrap}",
    s + " .rz-imgwrap{height:112px;display:flex;align-items:center;justify-content:center;margin-bottom:6px}",
    s + " .rz-img{max-height:112px;width:auto;max-width:70%;object-fit:contain}",
    s + " .rz-name{color:#fff;font-weight:700;font-size:21px}",
    s + " .rz-from{color:#8b93a3;font-size:13px;margin-top:8px}",
    s + " .rz-price{color:#fff;font-weight:800;font-size:40px;line-height:1;margin-top:4px}",
    s + " .rz-price .rz-suffix{color:#8b93a3;font-weight:600;font-size:14px;margin-left:4px}",
    s + " .rz-pill{display:inline-flex;align-items:center;gap:7px;margin:16px auto 0;padding:7px 14px;border:1px solid rgba(255,200,10,.4);border-radius:999px;color:" + accent + ";font-weight:700;font-size:12.5px}",
    s + " .rz-pill-tick{display:inline-flex;width:15px;height:15px;align-items:center;justify-content:center;border-radius:999px;background:" + accent + ";color:#141414;font-size:10px;font-weight:900}",
    s + " .rz-feats{list-style:none;margin:22px 0 0;padding:0;text-align:left;flex:1}",
    s + " .rz-feats li{position:relative;padding:0 0 0 28px;margin:0 0 13px;color:#c7cedb;font-size:14.5px;line-height:1.4}",
    s + " .rz-feats li::before{content:'✓';position:absolute;left:0;top:0;color:" + accent + ";font-weight:900}",
    s + " .rz-btn{display:block;margin-top:24px;padding:14px 18px;border-radius:999px;font-weight:700;font-size:15px;text-decoration:none;text-align:center;background:#1c2740;color:#fff;transition:filter .15s,transform .15s}",
    s + " .rz-btn:hover{filter:brightness(1.12)}",
    s + " .rz-btn-hot{background:" + accent + ";color:#141414}",
    s + " .rz-foot{text-align:center;color:#8b93a3;font-size:13.5px;margin:34px auto 0}",
    "@media(max-width:900px){" + s + " .rz-grid{grid-template-columns:1fr;max-width:440px}}",
  ].join("\n");

  return { html, css };
}

function scopeHtmlCss(id: string, css: string): string {
  if (!css || !css.trim()) return "";
  const root = "." + rzClass(id);
  return css.replace(/(^|})\s*([^{}@][^{}]*)\{/g, (_m, close, sel) => {
    const scoped = sel.split(",").map((one: string) => {
      const t = one.trim();
      if (!t) return t;
      return root + " " + t;
    }).join(", ");
    return (close || "") + scoped + "{";
  });
}

export function renderReusable(r: Reusable | undefined | null): { html: string; css: string } {
  if (!r) return { html: "", css: "" };
  if (r.kind === "pricing") return renderPricing(r.id, r.data || {});
  const root = rzClass(r.id);
  const inner = String(r.html || "");
  return { html: '<div class="nifty-rz ' + root + ' nifty-rz-html">' + inner + "</div>", css: scopeHtmlCss(r.id, r.css || "") };
}
