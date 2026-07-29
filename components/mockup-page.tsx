// Renders an imported-mockup page with 100% fidelity. Self-contained framework
// file (portable to every Nifty site). The design lives entirely in the page's
// captured CSS; we inject it verbatim, restore the browser defaults that the
// site's Tailwind reset would otherwise change (so the mockup looks exactly as
// authored), then output the section HTML as-is. No site header/footer chrome —
// the mockup carries its own. Header/footer may be shared "parts" wrapped here.
import { JsonLd } from "@/components/schema";

type Block = { id?: string; type: string; props?: Record<string, any> };
// A shared header/footer part carries the design CSS + fonts captured when it was
// imported. These MUST be injected on every page that links the part — otherwise the
// part's HTML renders unstyled on any page whose own CSS doesn't already include the
// header/footer rules (e.g. a location page imported from a different mockup). Injecting
// the part's own CSS is what keeps the header/footer identical across every linked page.
type Part = { id: string; kind: string; name: string; html: string; css?: string; fonts?: string[] };
type MockupPg = {
  title: string;
  css?: string;
  fonts?: string[];
  blocks?: Block[];
  headerPartId?: string | null;
  footerPartId?: string | null;
  _schemas?: Array<{ type?: string; data?: Record<string, unknown> }>;
};

// Equal-specificity un-reset: rolls back Tailwind Preflight to UA defaults for the
// elements a mockup commonly leaves unstyled. Placed BEFORE the mockup CSS, so any
// rule the mockup DOES declare still wins by source order — fidelity is preserved.
const UNRESET = `
ul,ol{list-style:revert;margin:revert;padding:revert}
li{list-style:revert}
img,svg,video{max-width:revert;height:revert;display:revert;vertical-align:revert}
button,input,select,textarea{font:revert;color:revert;background:revert;border:revert;margin:revert;padding:revert;text-align:revert;line-height:revert}
table{border-collapse:revert;text-indent:revert}
blockquote,figure,fieldset{margin:revert;padding:revert}
h1,h2,h3,h4,h5,h6{font-size:revert;font-weight:revert;margin:revert;line-height:revert}
p{margin:revert}
a{color:revert;text-decoration:revert}
hr{border:revert;height:revert;color:revert}
`;

// Stored on headerPartId/footerPartId to mean "show none" (vs. null = use the
// page's own inline header/footer from the mockup).
const PART_NONE = "__none__";

// Client script shipped on every mockup page. It makes the site's enquiry form(s)
// actually submit to the Nifty leads inbox, then either redirect to the Thank-you
// page (returned by the dashboard) or show an inline thank-you. Any <form> that has
// an email field is treated as an enquiry form; add `data-nifty-ignore` to opt a
// form out. The dashboard identifies which site the lead belongs to from the page's
// domain, so no site ID needs to be embedded. Common field-name variants are mapped
// to name/email/phone/suburb/service/message, and any extra fields are passed too.
const NIFTY_FORM_SCRIPT = `
(function(){
  var EP = "https://nifty-websites-dashboard.web-528.workers.dev/admin/api/lead";
  function norm(k){ return String(k||"").toLowerCase().replace(/[^a-z0-9]/g,""); }
  var MAP = {
    name:["name","fullname","yourname","contactname","firstname"],
    email:["email","emailaddress","youremail","mail","contactemail"],
    phone:["phone","tel","telephone","mobile","yourphone","phonenumber","contactnumber"],
    suburb:["suburb","location","city","town","postcode","area"],
    service:["service","subject","enquirytype","interestedin","reason"],
    message:["message","comments","comment","enquiry","yourmessage","details","notes"]
  };
  function pick(f, keys){ for (var i=0;i<keys.length;i++){ if (f[keys[i]]) return f[keys[i]]; } return ""; }
  function isEnquiry(f){
    if (!f || (f.hasAttribute && f.hasAttribute("data-nifty-ignore"))) return false;
    return !!(f.querySelector && f.querySelector('input[type="email"], input[name="email" i], [name*="mail" i]'));
  }
  document.addEventListener("submit", function(e){
    var form = e.target;
    if (!form || form.tagName !== "FORM" || !isEnquiry(form)) return;
    e.preventDefault();
    var btn = form.querySelector('button[type="submit"], input[type="submit"], button');
    var orig = btn ? (btn.tagName === "INPUT" ? btn.value : btn.innerHTML) : "";
    if (btn){ btn.disabled = true; if (btn.tagName === "INPUT") btn.value = "Sending..."; else btn.innerHTML = "Sending..."; }
    var raw = {}, nm = {};
    new FormData(form).forEach(function(v,k){ raw[k]=String(v); nm[norm(k)]=String(v); });
    var data = { name:pick(nm,MAP.name), email:pick(nm,MAP.email), phone:pick(nm,MAP.phone), suburb:pick(nm,MAP.suburb), service:pick(nm,MAP.service), message:pick(nm,MAP.message) };
    for (var k in raw){ if (!(k in data)) data[k]=raw[k]; }
    var t = form.querySelector('[name="cf-turnstile-response"]'); if (t && t.value) data["cf-turnstile-response"]=t.value;
    fetch(EP, { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify(data) })
      .then(function(r){ return r.json().catch(function(){ return { ok:true }; }); })
      .then(function(res){
        if (res && res.redirect){ window.location.href = res.redirect; return; }
        var d = document.createElement("div");
        d.setAttribute("style","padding:28px;text-align:center;font-family:inherit");
        d.innerHTML = '<div style="font-size:42px;line-height:1">&#10004;</div><h3 style="margin:10px 0 6px;font-size:20px">Thank you &mdash; enquiry received!</h3><p style="color:#64748b;margin:0">We will be in touch shortly.</p>';
        if (form.parentNode) form.parentNode.replaceChild(d, form);
      })
      .catch(function(){
        if (btn){ btn.disabled=false; if (btn.tagName==="INPUT") btn.value=orig; else btn.innerHTML=orig; }
        var er = form.querySelector(".nifty-form-error");
        if (!er){ er = document.createElement("p"); er.className="nifty-form-error"; er.setAttribute("style","color:#dc2626;margin-top:10px;font-size:14px"); form.appendChild(er); }
        er.textContent = "Sorry, something went wrong. Please try again or call us directly.";
      });
  }, true);
})();
`;

// ---------------------------------------------------------------------------
// CSS scoping. A reusable header/footer part carries the FULL stylesheet of the
// page it was imported from. Injected raw onto another page, that stylesheet both
// leaks into the host page's body AND collides with the host's own stylesheet —
// so the header renders "funny". The fix: confine a part's captured CSS to a wrapper
// that only contains that part, so it styles the part exactly as originally designed
// and can neither leak out nor be overridden by the host page's generic rules.
// (Self-contained, dependency-free — tokeniser-based so it's safe on real stylesheets:
// keyframes/font-face are left intact, and commas inside [attr]/:is() aren't mis-split.)
function _stripComments(css: string): string {
  let out = "", i = 0, inStr = "";
  while (i < css.length) {
    const c = css[i];
    if (inStr) { out += c; if (c === "\\") { out += css[i + 1] || ""; i += 2; continue; } if (c === inStr) inStr = ""; i++; continue; }
    if (c === '"' || c === "'") { inStr = c; out += c; i++; continue; }
    if (c === "/" && css[i + 1] === "*") { i += 2; while (i < css.length && !(css[i] === "*" && css[i + 1] === "/")) i++; i += 2; continue; }
    out += c; i++;
  }
  return out;
}
function _readBraces(css: string, start: number): { block: string; next: number } {
  let depth = 0, i = start, out = "", inStr = "";
  for (; i < css.length; i++) {
    const c = css[i];
    if (inStr) { out += c; if (c === "\\") { i++; if (i < css.length) out += css[i]; continue; } if (c === inStr) inStr = ""; continue; }
    if (c === '"' || c === "'") { inStr = c; out += c; continue; }
    if (c === "{") { depth++; if (depth === 1) continue; out += c; continue; }
    if (c === "}") { depth--; if (depth === 0) { i++; break; } out += c; continue; }
    out += c;
  }
  return { block: out, next: i };
}
type CssNode = { type: string; prelude?: string; selector?: string; body?: string };
function _parseBlocks(css: string): CssNode[] {
  const nodes: CssNode[] = []; let i = 0; const n = css.length; let buf = ""; let inStr = "";
  while (i < n) {
    const c = css[i];
    if (inStr) { buf += c; if (c === "\\") { buf += css[i + 1] || ""; i += 2; continue; } if (c === inStr) inStr = ""; i++; continue; }
    if (c === '"' || c === "'") { inStr = c; buf += c; i++; continue; }
    if (c === "@" && buf.trim() === "") {
      let prelude = "";
      while (i < n) {
        const d = css[i];
        if (d === "{" || d === ";") break;
        if (d === '"' || d === "'") { const q = d; prelude += d; i++; while (i < n) { prelude += css[i]; if (css[i] === "\\") { prelude += css[i + 1] || ""; i += 2; continue; } if (css[i] === q) { i++; break; } i++; } continue; }
        prelude += d; i++;
      }
      if (i < n && css[i] === ";") { i++; nodes.push({ type: "at-statement", prelude: prelude.trim() }); buf = ""; continue; }
      if (i < n && css[i] === "{") { const r = _readBraces(css, i); i = r.next; nodes.push({ type: "at-block", prelude: prelude.trim(), body: r.block }); buf = ""; continue; }
      nodes.push({ type: "at-statement", prelude: prelude.trim() }); buf = ""; break;
    }
    if (c === "{") { const r = _readBraces(css, i); i = r.next; nodes.push({ type: "style", selector: buf.trim(), body: r.block }); buf = ""; continue; }
    if (c === "}") { i++; continue; }
    buf += c; i++;
  }
  return nodes;
}
function _splitTopCommas(s: string): string[] {
  const parts: string[] = []; let dp = 0, db = 0, inStr = "", buf = "";
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (inStr) { buf += c; if (c === "\\") { buf += s[i + 1] || ""; i++; continue; } if (c === inStr) inStr = ""; continue; }
    if (c === '"' || c === "'") { inStr = c; buf += c; continue; }
    if (c === "(") dp++; else if (c === ")") dp--; else if (c === "[") db++; else if (c === "]") db--;
    if (c === "," && dp === 0 && db === 0) { parts.push(buf); buf = ""; continue; }
    buf += c;
  }
  if (buf.trim() !== "") parts.push(buf);
  return parts;
}
function _scopeOne(sel: string, scope: string): string {
  sel = sel.trim();
  if (!sel) return sel;
  const rootRe = /^(html|body|:root)\b/;
  if (rootRe.test(sel)) { const rest = sel.replace(rootRe, ""); return (scope + rest).trim(); }
  return scope + " " + sel;
}
function _renderScoped(node: CssNode, scope: string): string {
  if (node.type === "at-statement") return (node.prelude || "") + ";";
  if (node.type === "style") {
    const sels = _splitTopCommas(node.selector || "").map((s) => _scopeOne(s, scope)).join(", ");
    return sels + " {" + (node.body || "") + "}";
  }
  if (node.type === "at-block") {
    const p = node.prelude || "";
    const name = ((p.match(/^@([a-zA-Z-]+)/) || [])[1] || "").toLowerCase();
    const passthrough = /^(keyframes|-webkit-keyframes|-moz-keyframes|font-face|page|property|counter-style|font-feature-values|viewport|charset|namespace)$/.test(name);
    if (passthrough) return p + " {" + (node.body || "") + "}";
    const inner = _parseBlocks(node.body || "").map((r) => _renderScoped(r, scope)).join("\n");
    return p + " {" + inner + "}";
  }
  return "";
}
function scopeCss(css: string, scope: string): string {
  if (!css || !scope) return css || "";
  try { return _parseBlocks(_stripComments(css)).map((r) => _renderScoped(r, scope)).join("\n"); }
  catch { return css; }
}
function scopeClass(id: string): string {
  return "nifty-part-" + String(id || "x").replace(/[^A-Za-z0-9_-]/g, "-");
}

export function MockupPage({ page, parts = [] }: { page: MockupPg; parts?: Part[] }) {
  const byId = (id?: string | null) => (id && id !== PART_NONE ? parts.find((p) => p.id === id) : undefined);
  const headerPart = byId(page.headerPartId);
  const footerPart = byId(page.footerPartId);

  // If a shared part (or "None") is chosen for header/footer, don't also render
  // the mockup's own inline header/footer — otherwise you'd get two stacked.
  const hideInlineHeader = !!page.headerPartId;
  const hideInlineFooter = !!page.footerPartId;
  const bodyBlocks = (page.blocks || []).filter((b) => {
    const role = (b.props?.role as string) || "";
    if (role === "header" && hideInlineHeader) return false;
    if (role === "footer" && hideInlineFooter) return false;
    return true;
  });

  // Just the page's own body sections (a linked header/footer is rendered separately,
  // each inside its own scoped wrapper below).
  const bodyHtml = bodyBlocks.map((b) => (b.props?.html as string) || "").filter(Boolean).join("\n");

  // Scope classes for the linked parts. Each part's captured CSS is confined to its own
  // wrapper, and its HTML is rendered inside that wrapper — so it looks exactly as
  // originally designed and cannot leak into (or be broken by) the host page's CSS.
  const headerScope = headerPart ? scopeClass(headerPart.id) : "";
  const footerScope = footerPart ? scopeClass(footerPart.id) : "";

  // Fonts: merge the page's own web/icon fonts with those the linked header/footer
  // parts need (e.g. the icon font behind the header's phone/email icons), de-duped —
  // so a header imported from another page still gets its fonts on THIS page.
  const allFonts = Array.from(new Set([
    ...(page.fonts || []),
    ...(headerPart?.fonts || []),
    ...(footerPart?.fonts || []),
  ].filter((h) => /^https?:\/\//i.test(h))));
  const fontImports = allFonts.map((h) => `@import url("${h}");`).join("\n");

  // Each linked part's captured CSS, scoped to that part's wrapper only. Skip a part's
  // CSS when it's identical to the page's own CSS (same origin — already present).
  const norm = (s?: string) => (s || "").trim();
  const pageNorm = norm(page.css);
  const partCssPieces: string[] = [];
  if (headerPart && norm(headerPart.css) && norm(headerPart.css) !== pageNorm) {
    partCssPieces.push(scopeCss(headerPart.css as string, "." + headerScope));
  }
  if (footerPart && norm(footerPart.css) && norm(footerPart.css) !== pageNorm) {
    partCssPieces.push(scopeCss(footerPart.css as string, "." + footerScope));
  }
  const partCss = partCssPieces.join("\n");

  // @import first, then the un-reset, then the scoped part CSS, then the page's own CSS.
  const styleText = `${fontImports}\n${UNRESET}\n${partCss}\n${page.css || ""}`;

  return (
    <>
      {(page._schemas || []).map((b, i) =>
        b && b.data && Object.keys(b.data).length ? (
          <JsonLd key={i} data={{ "@context": "https://schema.org", ...b.data }} />
        ) : null
      )}
      <style dangerouslySetInnerHTML={{ __html: styleText }} />
      {headerPart ? (
        <div className={`nifty-part ${headerScope}`} dangerouslySetInnerHTML={{ __html: headerPart.html || "" }} />
      ) : null}
      <div className="nifty-mockup" dangerouslySetInnerHTML={{ __html: bodyHtml }} />
      {footerPart ? (
        <div className={`nifty-part ${footerScope}`} dangerouslySetInnerHTML={{ __html: footerPart.html || "" }} />
      ) : null}
      <script dangerouslySetInnerHTML={{ __html: NIFTY_FORM_SCRIPT }} />
    </>
  );
}
