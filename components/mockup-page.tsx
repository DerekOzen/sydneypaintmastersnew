// Renders an imported-mockup page with 100% fidelity. Self-contained framework
// file (portable to every Nifty site). The design lives entirely in the page's
// captured CSS; we inject it verbatim, restore the browser defaults that the
// site's Tailwind reset would otherwise change (so the mockup looks exactly as
// authored), then output the section HTML as-is. No site header/footer chrome —
// the mockup carries its own. Header/footer may be shared "parts" wrapped here.
import fs from "fs";
import path from "path";
import { JsonLd } from "@/components/schema";
import { renderHeaderLayout, headerLayoutCss, hasDeviceOverrides, deviceLayout, deviceVisibilityCss, type HeaderLayout } from "@/components/header-layout";

// Reusable menus (content/menus.json), read at build. A header/footer's Menu element
// references one of these by id; renderHeaderLayout resolves it to the real links.
const SITE_MENUS: any[] = (() => {
  try { const d = JSON.parse(fs.readFileSync(path.join(process.cwd(), "content/menus.json"), "utf8")); return Array.isArray(d) ? d : []; }
  catch { return []; }
})();

// Global theme (content/theme.json): named colours + fonts published as CSS variables
// so var(--nifty-c-<id>) / var(--nifty-font-*) resolve site-wide. Read once at build.
const SITE_THEME: any = (() => {
  try { const d = JSON.parse(fs.readFileSync(path.join(process.cwd(), "content/theme.json"), "utf8")); return (d && typeof d === "object" && !Array.isArray(d)) ? d : {}; }
  catch { return {}; }
})();
function _normHex(v: string): string { const s = String(v || "").trim(); let m = /^#?([0-9a-fA-F]{6})$/.exec(s); if (m) return "#" + m[1]; m = /^#?([0-9a-fA-F]{3})$/.exec(s); if (m) return "#" + m[1].split("").map((c) => c + c).join(""); return ""; }
function _fontStack(name: string): string { const n = String(name || "").trim(); if (!n) return ""; const q = /\s/.test(n) ? '"' + n.replace(/"/g, "") + '"' : n; return q + ",system-ui,-apple-system,Segoe UI,Roboto,sans-serif"; }
function themeCss(theme: any): string {
  const vars: string[] = [];
  for (const c of (theme.colors || [])) { const hex = _normHex(c.value); if (hex && c.id != null) vars.push("--nifty-c-" + c.id + ":" + hex); }
  const f = theme.fonts || {};
  if (f.heading) vars.push("--nifty-font-heading:" + _fontStack(f.heading));
  if (f.body) vars.push("--nifty-font-body:" + _fontStack(f.body));
  if (f.button) vars.push("--nifty-font-button:" + _fontStack(f.button));
  let css = vars.length ? ":root{" + vars.join(";") + "}" : "";
  if (f.body) css += "\nbody{font-family:var(--nifty-font-body)}";
  if (f.heading) css += "\nh1,h2,h3,h4,h5,h6{font-family:var(--nifty-font-heading)}";
  if (f.button) css += "\n.nifty-h-btn{font-family:var(--nifty-font-button)}";
  return css;
}
const THEME_CSS = themeCss(SITE_THEME);

// Per-section background (set in the Live Editor, stored on the block's props.bg):
// a colour and/or image behind the section, with sizing/position/repeat and a colour
// overlay tint over the image.
function _secOverlay(hex: string, op: number): string {
  const m = /^#?([0-9a-fA-F]{6})$/.exec(String(hex || "").trim());
  if (!m || !op) return "";
  const i = parseInt(m[1], 16);
  return "rgba(" + ((i >> 16) & 255) + "," + ((i >> 8) & 255) + "," + (i & 255) + "," + Math.max(0, Math.min(1, op)) + ")";
}
// The overlay painted over an image: flat tint, or a two-colour directional gradient
// tint (both stops at the chosen opacity). Mirrors the dashboard's sectionOverlayLayer.
function _secOverlayLayer(bg: any): string {
  const a = _secOverlay(bg.overlayColor, bg.overlayOpacity);
  if (!a) return "";
  if (bg.overlayType === "gradient") {
    const b = _secOverlay(bg.overlayColor2 || bg.overlayColor, bg.overlayOpacity) || a;
    return "linear-gradient(" + (bg.overlayDir || "to bottom") + "," + a + "," + b + ")";
  }
  return "linear-gradient(" + a + "," + a + ")";
}
function sectionBgCss(bg: any): string {
  if (!bg || typeof bg !== "object") return "";
  const t = bg.type || (bg.image ? "image" : (bg.gradFrom || bg.gradTo) ? "gradient" : "color");
  const d: string[] = [];
  if (t === "gradient") {
    d.push("background-image:linear-gradient(" + (bg.gradDir || "to bottom") + "," + (bg.gradFrom || "#0f766e") + "," + (bg.gradTo || "#0b3b36") + ")");
  } else if (t === "image" && bg.image) {
    if (bg.color) d.push("background-color:" + bg.color);
    // SINGLE quotes: this is embedded into an HTML style="…" attribute, so double quotes
    // inside url("…") would close the attribute and drop the image.
    const img = "url('" + String(bg.image).replace(/['"\\]/g, "") + "')";
    const ov = _secOverlayLayer(bg);
    d.push("background-image:" + (ov ? ov + "," + img : img));
    d.push("background-size:" + (bg.size || "cover") + ";background-position:" + (bg.position || "center") + ";background-repeat:" + (bg.repeat || "no-repeat"));
  } else if (bg.color) {
    d.push("background-color:" + bg.color);
  }
  return d.join(";");
}
// A YouTube URL → its embed id. Mirrors the dashboard's youTubeId().
function _youTubeId(u: string): string {
  const m = /(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|v\/|live\/))([A-Za-z0-9_-]{6,})/.exec(String(u || "").trim());
  return m ? m[1] : "";
}
// The looping, muted video layer that sits behind a section (a YouTube embed or an
// HTML5 <video> file) plus the optional colour overlay. Mirrors the dashboard's
// sectionVideoLayer so the live site matches the editor preview exactly.
function sectionVideoLayer(bg: any): string {
  const url = String((bg && bg.videoUrl) || "").trim();
  if (!url) return "";
  const yt = _youTubeId(url);
  let media = "";
  if (yt) {
    const q = ["autoplay=1", "mute=1", "loop=1", "playlist=" + yt, "controls=0", "showinfo=0", "modestbranding=1", "rel=0", "playsinline=1", "disablekb=1", "fs=0", "iv_load_policy=3"].join("&amp;");
    media = '<iframe src="https://www.youtube.com/embed/' + yt + "?" + q + '" allow="autoplay; encrypted-media" frameborder="0" style="position:absolute;top:50%;left:50%;width:100vw;height:56.25vw;min-width:177.78vh;min-height:100%;transform:translate(-50%,-50%);border:0;pointer-events:none"></iframe>';
  } else {
    const src = String(url).replace(/["\\]/g, "");
    media = '<video autoplay muted loop playsinline preload="auto" src="' + src + '" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;border:0"></video>';
  }
  const ov = _secOverlayLayer(bg);
  const overlay = ov ? '<div style="position:absolute;inset:0;z-index:1;background:' + ov + ';pointer-events:none"></div>' : "";
  return '<div class="nifty-secvid" style="position:absolute;inset:0;z-index:0;overflow:hidden;pointer-events:none">' + media + overlay + "</div>";
}

// --- Link normaliser -------------------------------------------------------
// Some mockups were authored with local/relative links (href="landscape-design.html"),
// which resolve to file:///…/Downloads/… when the mockup is opened from disk and were
// captured verbatim into the header/footer/body. Rewrite them to clean site paths at
// render time so every already-imported site is corrected on its next build. Kept in
// sync with the dashboard's lib/link-normalize.ts.
function normHref(raw: string): string {
  let h = (raw || "").trim();
  if (!h) return h;
  const low = h.toLowerCase();
  if (h.startsWith("#") || h.startsWith("//")) return h;
  if (/^(https?:|tel:|mailto:|sms:|javascript:|data:)/.test(low)) return h;
  let hash = "";
  const hi = h.indexOf("#");
  if (hi >= 0) { hash = h.slice(hi); h = h.slice(0, hi); }
  const qi = h.indexOf("?");
  if (qi >= 0) h = h.slice(0, qi);
  const isLocalFile = /^file:/i.test(h) || h.includes("\\") || /^[a-zA-Z]:[\\/]/.test(h);
  if (isLocalFile) { const parts = h.split(/[\\/]/); h = parts[parts.length - 1] || ""; }
  h = h.replace(/^(\.\.?\/)+/, "");
  h = h.replace(/\.html?$/i, "");
  const base = (h.split("/").pop() || "").toLowerCase();
  if (h === "" || h === "/" || base === "index" || base === "home") return "/" + hash;
  if (!h.startsWith("/")) h = "/" + h;
  return h + hash;
}
function normalizeSiteLinks(html: string): string {
  if (!html) return html;
  return html.replace(/(<a\b[^>]*?\shref\s*=\s*)("([^"]*)"|'([^']*)')/gi, (_m, pre, _q, dq, sq) => {
    const val = dq !== undefined ? dq : (sq || "");
    return pre + '"' + normHref(val) + '"';
  });
}

type Block = { id?: string; type: string; props?: Record<string, any> };
// A shared header/footer part carries the design CSS + fonts captured when it was
// imported. These MUST be injected on every page that links the part — otherwise the
// part's HTML renders unstyled on any page whose own CSS doesn't already include the
// header/footer rules (e.g. a location page imported from a different mockup). Injecting
// the part's own CSS is what keeps the header/footer identical across every linked page.
type HeaderSettings = { sticky?: boolean; autoHide?: boolean; scrollBreakpoint?: number; transparent?: boolean; shadow?: string; mobileMenu?: boolean; mobileBreakpoint?: number };
type Part = { id: string; kind: string; name: string; html: string; css?: string; fonts?: string[]; settings?: HeaderSettings; layout?: HeaderLayout };
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
    if (!f || !f.querySelector) return false;
    if (f.hasAttribute && f.hasAttribute("data-nifty-ignore")) return false;
    // Explicit opt-outs: a search form is never an enquiry.
    var role = (f.getAttribute && (f.getAttribute("role")||"").toLowerCase()) || "";
    if (role === "search") return false;
    // Recognise a contact/enquiry form broadly — an email field is NOT required (many
    // mockups collect only name/phone/message). A form counts as an enquiry if it has
    // an email field, a message textarea, or any recognised contact field by name.
    var hasEmail = f.querySelector('input[type="email"], input[name="email" i], [name*="mail" i]');
    var hasTextarea = f.querySelector('textarea');
    var hasContactField = f.querySelector('[name*="name" i],[name*="phone" i],[name*="tel" i],[name*="mobile" i],[name*="message" i],[name*="enquir" i],[name*="suburb" i],[name*="service" i],[name*="comment" i],[name*="subject" i]');
    // A lone search box (only a search input, no contact fields/textarea) is not an enquiry.
    var onlySearch = f.querySelector('input[type="search"]') && !hasContactField && !hasTextarea && !hasEmail;
    if (onlySearch) return false;
    return !!(hasEmail || hasTextarea || hasContactField);
  }
  document.addEventListener("submit", function(e){
    var form = e.target;
    if (!form || form.tagName !== "FORM" || !isEnquiry(form)) return;
    e.preventDefault();
    var btn = form.querySelector('button[type="submit"], input[type="submit"], button');
    var orig = btn ? (btn.tagName === "INPUT" ? btn.value : btn.innerHTML) : "";
    function setBtn(txt, dis){ if(!btn) return; btn.disabled = dis; if (btn.tagName === "INPUT") btn.value = txt; else btn.innerHTML = txt; }
    function restoreBtn(){ setBtn(orig, false); }
    function showError(msg){
      restoreBtn();
      var er = form.querySelector(".nifty-form-error");
      if (!er){ er = document.createElement("p"); er.className="nifty-form-error"; er.setAttribute("style","color:#dc2626;margin-top:10px;font-size:14px"); form.appendChild(er); }
      er.textContent = msg || "Sorry, something went wrong. Please try again or call us directly.";
    }
    function tsToken(){ var t = form.querySelector('[name="cf-turnstile-response"]'); return t && t.value ? t.value : ""; }
    var hasWidget = !!form.querySelector(".cf-turnstile");
    setBtn("Sending...", true);

    function doSend(){
      var raw = {}, nm = {};
      new FormData(form).forEach(function(v,k){ raw[k]=String(v); nm[norm(k)]=String(v); });
      var data = { name:pick(nm,MAP.name), email:pick(nm,MAP.email), phone:pick(nm,MAP.phone), suburb:pick(nm,MAP.suburb), service:pick(nm,MAP.service), message:pick(nm,MAP.message) };
      for (var k in raw){ if (!(k in data)) data[k]=raw[k]; }
      // Fallback for mockup forms whose fields have NO "name" attribute — FormData
      // skips those, which would make the lead arrive blank. Read every control
      // directly and infer its target from type / placeholder / label / autocomplete.
      function _label(el){ try{ if(el.id){ var l=document.querySelector('label[for="'+el.id+'"]'); if(l) return l.textContent||""; } var p=el.closest?el.closest("label"):null; if(p) return p.textContent||""; }catch(_e){} return ""; }
      var _ctrls = form.querySelectorAll("input, textarea, select"), _spare = [];
      for (var _i=0; _i<_ctrls.length; _i++){
        var _el=_ctrls[_i], _tag=_el.tagName.toLowerCase();
        var _ty=String(_el.getAttribute("type")||_el.type||"").toLowerCase();
        if (_ty==="hidden"||_ty==="submit"||_ty==="button"||_ty==="checkbox"||_ty==="radio"||_ty==="file"||_ty==="search") continue;
        var _val=String(_el.value||"").trim(); if(!_val) continue;
        var _h=norm((_el.getAttribute("placeholder")||"")+" "+(_el.getAttribute("aria-label")||"")+" "+(_el.getAttribute("name")||"")+" "+(_el.id||"")+" "+(_el.getAttribute("autocomplete")||"")+" "+_label(_el));
        var _key="";
        if (_ty==="email"||_h.indexOf("email")>=0||_h.indexOf("mail")>=0) _key="email";
        else if (_ty==="tel"||_h.indexOf("phone")>=0||_h.indexOf("mobile")>=0||_h.indexOf("tel")>=0) _key="phone";
        else if (_tag==="textarea"||_h.indexOf("message")>=0||_h.indexOf("enquir")>=0||_h.indexOf("comment")>=0||_h.indexOf("detail")>=0) _key="message";
        else if (_tag==="select"||_h.indexOf("service")>=0||_h.indexOf("subject")>=0||_h.indexOf("interested")>=0||_h.indexOf("reason")>=0) _key="service";
        else if (_h.indexOf("suburb")>=0||_h.indexOf("postcode")>=0||_h.indexOf("city")>=0||_h.indexOf("town")>=0||_h.indexOf("location")>=0||_h.indexOf("area")>=0) _key="suburb";
        else if (_h.indexOf("name")>=0) _key="name";
        if (_key){ if(!data[_key]) data[_key]=_val; }
        else { _spare.push(_val); }
      }
      // Any unlabelled text inputs left over: fill name then suburb by position.
      for (var _s=0; _s<_spare.length; _s++){ if(!data.name){ data.name=_spare[_s]; } else if(!data.suburb){ data.suburb=_spare[_s]; } }
      var tok = tsToken(); if (tok) data["cf-turnstile-response"]=tok;
      // Record which page the form was submitted from → shows in the dashboard's
      // Leads → Page column. The cross-origin POST reduces the Referer to just the
      // domain, so we send the full page URL explicitly here.
      try { data.page = String(window.location.href || "").split("#")[0]; } catch(_e){}
      fetch(EP, { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify(data) })
        .then(function(r){ return r.json().catch(function(){ return { ok:true }; }); })
        .then(function(res){
          if (res && res.redirect){ window.location.href = res.redirect; return; }
          // A failure (e.g. CAPTCHA didn't verify) — show the real message and let them
          // retry. Never show a "thank you" when it didn't actually go through.
          if (res && res.ok === false){
            if (hasWidget && window.turnstile){ try { window.turnstile.reset(form.querySelector(".cf-turnstile")); } catch(e){} }
            showError(res.error || "Sorry, we couldn't send that just now. Please try again.");
            return;
          }
          var d = document.createElement("div");
          d.setAttribute("style","padding:28px;text-align:center;font-family:inherit");
          d.innerHTML = '<div style="font-size:42px;line-height:1">&#10004;</div><h3 style="margin:10px 0 6px;font-size:20px">Thank you &mdash; enquiry received!</h3><p style="color:#64748b;margin:0">We will be in touch shortly.</p>';
          if (form.parentNode) form.parentNode.replaceChild(d, form);
        })
        .catch(function(){ showError(); });
    }

    // If a Turnstile widget is present but hasn't produced its token yet (Managed mode
    // solves automatically in a second or two), wait BRIEFLY for it so a valid token is
    // included — but then ALWAYS submit anyway. We never refuse client-side: the SERVER is
    // the gatekeeper. If CAPTCHA is off the empty token is ignored (lead + email go through);
    // if it's on, the server returns the fail message and the visitor can retry. This is
    // what stops a stuck/stale widget from silently blocking every enquiry.
    if (hasWidget && !tsToken()){
      var waited = 0;
      (function waitToken(){
        if (tsToken() || waited >= 3500){ doSend(); return; }
        waited += 250;
        setTimeout(waitToken, 250);
      })();
    } else {
      doSend();
    }
  }, true);

  // CAPTCHA: if this site has Cloudflare Turnstile enabled in the dashboard, drop the
  // widget into each enquiry form and load the Turnstile script. The widget writes a
  // hidden "cf-turnstile-response" token that the submit handler above already forwards,
  // and the lead endpoint verifies it. If Turnstile isn't enabled, this does nothing.
  (function(){
    var CAP = "https://nifty-websites-dashboard.web-528.workers.dev/admin/api/captcha";
    fetch(CAP).then(function(r){ return r.json(); }).then(function(cfg){
      if (!cfg || !cfg.enabled || !cfg.siteKey) return;
      var forms = document.querySelectorAll("form"), added = false;
      for (var i=0;i<forms.length;i++){
        var f = forms[i];
        if (!isEnquiry(f) || f.querySelector(".cf-turnstile")) continue;
        var w = document.createElement("div");
        w.className = "cf-turnstile"; w.setAttribute("data-sitekey", cfg.siteKey); w.style.margin = "12px 0";
        var b = f.querySelector('button[type="submit"], input[type="submit"], button');
        if (b && b.parentNode) b.parentNode.insertBefore(w, b); else f.appendChild(w);
        added = true;
      }
      if (added && !document.querySelector('script[data-nifty-turnstile]')){
        var s = document.createElement("script");
        s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
        s.async = true; s.defer = true; s.setAttribute("data-nifty-turnstile","1");
        document.head.appendChild(s);
      }
    }).catch(function(){});
  })();
})();
`;

// Header behaviour (Phase 1 header designer). Reads the header's saved settings from a
// data attribute and applies them at runtime: sticky, auto-hide on scroll, transparent-
// over-hero, shadow, and a collapse-to-hamburger mobile menu. Everything is gated on a
// setting being enabled, so a header with no settings is untouched.
const NIFTY_HEADER_CSS = `
.nifty-header.nifty-transparent, .nifty-header.nifty-transparent > * { background-color: transparent !important; box-shadow: none !important; }
`;
const NIFTY_HEADER_SCRIPT = `
(function(){
  var h = document.querySelector('.nifty-header[data-nifty-header]');
  if(!h) return;
  var cfg={}; try{ cfg=JSON.parse(h.getAttribute('data-nifty-header')||'{}'); }catch(e){ cfg={}; }
  var bp = parseInt(cfg.scrollBreakpoint,10); if(isNaN(bp)) bp=60;
  if(cfg.sticky){ h.style.position='sticky'; h.style.top='0'; h.style.zIndex='1000'; }
  h.style.transition='transform .3s ease, box-shadow .3s ease, background-color .3s ease';
  function shadowVal(){ return cfg.shadow==='wide' ? '0 8px 28px rgba(0,0,0,.16)' : (cfg.shadow==='thin' ? '0 1px 8px rgba(0,0,0,.12)' : ''); }
  var lastY = window.pageYOffset||0;
  function onScroll(){
    var y = window.pageYOffset||0, past = y>bp;
    if(cfg.transparent){ if(past){ h.classList.remove('nifty-transparent'); h.classList.add('nifty-solid'); } else { h.classList.add('nifty-transparent'); h.classList.remove('nifty-solid'); } }
    var sv=shadowVal(); if(sv){ h.style.boxShadow = cfg.sticky ? (past?sv:'') : sv; }
    if(cfg.autoHide && cfg.sticky){ if(y>bp && y>lastY+4){ h.style.transform='translateY(-100%)'; } else if(y<lastY-4 || y<=bp){ h.style.transform='translateY(0)'; } }
    lastY=y;
  }
  if(cfg.transparent) h.classList.add('nifty-transparent');
  onScroll();
  window.addEventListener('scroll', onScroll, {passive:true});
  if(cfg.mobileMenu){
    var mbp = parseInt(cfg.mobileBreakpoint,10); if(isNaN(mbp)) mbp=900;
    function findNav(){
      var nav=h.querySelector('nav'); if(nav && nav.querySelectorAll('a').length) return nav;
      var best=null,bestN=0,cand=h.querySelectorAll('ul,div');
      for(var i=0;i<cand.length;i++){ var n=0,as=cand[i].children; for(var j=0;j<as.length;j++){ if(as[j].tagName==='A') n++; else if(as[j].querySelector && as[j].querySelector('a')) n++; } if(n>bestN){ bestN=n; best=cand[i]; } }
      return bestN>=2 ? best : null;
    }
    var nav=findNav(), burger=null, panel=null;
    function links(){ var out=[]; if(!nav) return out; var as=nav.querySelectorAll('a'); for(var i=0;i<as.length;i++){ var t=(as[i].textContent||'').trim(); if(t) out.push({t:t,href:as[i].getAttribute('href')||'#'}); } return out; }
    function build(){
      if(burger) return;
      burger=document.createElement('button'); burger.type='button'; burger.setAttribute('aria-label','Menu'); burger.setAttribute('data-nifty-ui','1');
      burger.innerHTML='<span></span><span></span><span></span>';
      burger.style.cssText='display:none;flex-direction:column;justify-content:center;gap:5px;width:44px;height:44px;padding:10px;background:transparent;border:0;cursor:pointer;margin-left:auto';
      var bars=burger.querySelectorAll('span'); for(var i=0;i<bars.length;i++){ bars[i].style.cssText='display:block;height:2px;width:100%;background:currentColor;border-radius:2px'; }
      panel=document.createElement('div'); panel.setAttribute('data-nifty-ui','1');
      panel.style.cssText='display:none;position:absolute;left:0;right:0;top:100%;background:#fff;box-shadow:0 10px 24px rgba(0,0,0,.14);padding:6px 0;z-index:1001;max-height:75vh;overflow:auto';
      var ls=links();
      for(var j=0;j<ls.length;j++){ var a=document.createElement('a'); a.href=ls[j].href; a.textContent=ls[j].t; a.style.cssText='display:block;padding:13px 22px;color:#0f172a;text-decoration:none;font-family:inherit;font-size:16px;border-bottom:1px solid #f1f5f9'; panel.appendChild(a); }
      burger.addEventListener('click',function(){ panel.style.display = panel.style.display==='block'?'none':'block'; });
      if(getComputedStyle(h).position==='static') h.style.position='relative';
      h.appendChild(burger); h.appendChild(panel);
    }
    function apply(){ if(!nav) return; build(); if(window.innerWidth<=mbp){ nav.style.display='none'; burger.style.display='flex'; } else { nav.style.display=''; if(burger) burger.style.display='none'; if(panel) panel.style.display='none'; } }
    apply();
    window.addEventListener('resize', apply, {passive:true});
  }
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
    if (c === "\\") { out += c + (css[i + 1] || ""); i += 2; continue; }
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
    if (c === "\\") { out += c; i++; if (i < css.length) out += css[i]; continue; }
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
    if (c === "\\") { buf += c + (css[i + 1] || ""); i += 2; continue; }
    if (c === '"' || c === "'") { inStr = c; buf += c; i++; continue; }
    if (c === "@" && buf.trim() === "") {
      let prelude = "";
      while (i < n) {
        const d = css[i];
        if (d === "{" || d === ";") break;
        if (d === "\\") { prelude += d + (css[i + 1] || ""); i += 2; continue; }
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
    if (c === "\\") { buf += c + (s[i + 1] || ""); i++; continue; }
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

// ── Responsive (per-device) header/footer ───────────────────────────────────
// A structured layout may carry per-device overrides (Desktop is the base; Laptop/
// Tablet/Mobile either follow it or hold their own layout). When none are set we
// render exactly as before (single layout). When some are set we render one wrapper
// per device — each with a unique id scope so menu toggles don't collide — and show
// exactly one per breakpoint via CSS. The per-device CSS is scoped under its wrapper
// so device-specific colours/rows can't bleed across breakpoints.
const _DEV: { key: "desktop" | "laptop" | "tablet" | "mobile"; scope: string }[] = [
  { key: "desktop", scope: "d" }, { key: "laptop", scope: "l" }, { key: "tablet", scope: "t" }, { key: "mobile", scope: "m" },
];
function responsivePartHtml(layout: HeaderLayout): string {
  if (!hasDeviceOverrides(layout)) return renderHeaderLayout(layout, SITE_MENUS);
  return _DEV.map((d) => `<div class="nifty-hdev nifty-hdev-${d.key}">${renderHeaderLayout(deviceLayout(layout, d.key), SITE_MENUS, d.scope)}</div>`).join("");
}
function responsivePartCss(layout: HeaderLayout, scope: string): string {
  if (!hasDeviceOverrides(layout)) return scopeCss(headerLayoutCss(layout), scope);
  const per = _DEV.map((d) => scopeCss(headerLayoutCss(deviceLayout(layout, d.key)), `${scope} .nifty-hdev-${d.key}`)).join("\n");
  return per + "\n" + scopeCss(deviceVisibilityCss(), scope);
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
  // each inside its own scoped wrapper below). A section may carry a background
  // (props.bg) set in the Live Editor — wrap it in a styled div when it does.
  const secBgRules: string[] = [];
  const bodyHtml = normalizeSiteLinks(bodyBlocks.map((b) => {
    const html = (b.props?.html as string) || "";
    if (!html) return "";
    const bg = (b.props as any)?.bg;
    // Video background: a real <video>/YouTube layer behind the content (CSS can't do
    // video). Wrapper becomes the positioning context; content is lifted above the video.
    if (bg && bg.type === "video" && String(bg.videoUrl || "").trim()) {
      const layer = sectionVideoLayer(bg);
      const fill = bg.color ? `background-color:${bg.color};` : "";
      secBgRules.push(`.nifty-secvidw-${b.id}{position:relative;overflow:hidden}.nifty-secvidw-${b.id}>*:not(.nifty-secvid){position:relative;z-index:2}`);
      let cls = `nifty-secvidw-${b.id}`;
      if (bg.mode === "replace") { secBgRules.push(`.nifty-secbg-${b.id} *{background-image:none !important}.nifty-secbg-${b.id} > *{background-color:transparent !important}`); cls += ` nifty-secbg-${b.id}`; }
      return `<div class="${cls}"${fill ? ` style="${fill}"` : ""}>${layer}${html}</div>`;
    }
    const s = sectionBgCss(bg);
    if (!s) return html;
    const replace = bg && bg.mode === "replace";
    if (replace) secBgRules.push(`.nifty-secbg-${b.id} *{background-image:none !important}.nifty-secbg-${b.id} > *{background-color:transparent !important}`);
    return `<div${replace ? ` class="nifty-secbg-${b.id}"` : ""} style="${s}">${html}</div>`;
  }).filter(Boolean).join("\n"));
  const secBgCss = secBgRules.join("\n");

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

  // Header behaviour settings (Phase 1). Only "activate" the header wrapper + script when
  // at least one behaviour is switched on, so a plain header is left completely untouched.
  const hs = (headerPart?.settings || {}) as HeaderSettings;
  const headerActive = !!(hs.sticky || hs.autoHide || hs.transparent || hs.mobileMenu || (hs.shadow && hs.shadow !== "none"));
  const headerClass = `nifty-part ${headerScope}${headerActive ? " nifty-header" : ""}`;

  // Phase 2 structured header: when the linked header uses a zone layout, render THAT
  // instead of the captured mockup HTML, and inject its base CSS.
  const headerLayout = headerPart?.layout as HeaderLayout | undefined;
  const useLayout = !!(headerLayout && headerLayout.enabled);
  const headerInnerHtml = useLayout ? responsivePartHtml(headerLayout!) : normalizeSiteLinks(headerPart?.html || "");
  // Scope the structured layout's CSS to the part's own wrapper, so a header layout
  // and a footer layout (which share the same .nifty-hbar-N class names) can't bleed
  // into each other. Per-device variants are further scoped under their own wrapper.
  const layoutCss = useLayout ? responsivePartCss(headerLayout!, "." + headerScope) : "";

  // Structured FOOTER: the same zone builder, rendered into the footer.
  const footerLayout = footerPart?.layout as HeaderLayout | undefined;
  const useFooterLayout = !!(footerLayout && footerLayout.enabled);
  const footerInnerHtml = useFooterLayout ? responsivePartHtml(footerLayout!) : normalizeSiteLinks(footerPart?.html || "");
  const footerLayoutCss = useFooterLayout ? responsivePartCss(footerLayout!, "." + footerScope) : "";

  // @import first, then the un-reset, then the scoped part CSS, then the page's own CSS,
  // then (only if a header behaviour is on) the small header-behaviour CSS, then (for a
  // structured header/footer) its base CSS.
  const styleText = `${fontImports}\n${UNRESET}\n${THEME_CSS ? THEME_CSS + "\n" : ""}${partCss}\n${page.css || ""}${headerActive ? "\n" + NIFTY_HEADER_CSS : ""}${layoutCss ? "\n" + layoutCss : ""}${footerLayoutCss ? "\n" + footerLayoutCss : ""}${secBgCss ? "\n" + secBgCss : ""}`;

  return (
    <>
      {(page._schemas || []).map((b, i) =>
        b && b.data && Object.keys(b.data).length ? (
          <JsonLd key={i} data={{ "@context": "https://schema.org", ...b.data }} />
        ) : null
      )}
      <style dangerouslySetInnerHTML={{ __html: styleText }} />
      {headerPart ? (
        <div className={headerClass} {...(headerActive ? { "data-nifty-header": JSON.stringify(hs) } : {})} dangerouslySetInnerHTML={{ __html: headerInnerHtml }} />
      ) : null}
      <div className="nifty-mockup" dangerouslySetInnerHTML={{ __html: bodyHtml }} />
      {footerPart ? (
        <div className={`nifty-part ${footerScope}`} dangerouslySetInnerHTML={{ __html: footerInnerHtml }} />
      ) : null}
      <script dangerouslySetInnerHTML={{ __html: NIFTY_FORM_SCRIPT }} />
      {headerActive ? <script dangerouslySetInnerHTML={{ __html: NIFTY_HEADER_SCRIPT }} /> : null}
    </>
  );
}
