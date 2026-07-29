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

  const bodyHtml = [
    headerPart?.html || "",
    ...bodyBlocks.map((b) => (b.props?.html as string) || ""),
    footerPart?.html || "",
  ].filter(Boolean).join("\n");

  // Fonts: merge the page's own web/icon fonts with those the linked header/footer
  // parts need (e.g. the icon font behind the header's phone/email icons), de-duped —
  // so a header imported from another page still gets its fonts on THIS page.
  const allFonts = Array.from(new Set([
    ...(page.fonts || []),
    ...(headerPart?.fonts || []),
    ...(footerPart?.fonts || []),
  ].filter((h) => /^https?:\/\//i.test(h))));
  const fontImports = allFonts.map((h) => `@import url("${h}");`).join("\n");

  // The linked parts' captured CSS. Placed BEFORE the page's own CSS so that header/
  // footer styling is always present, while the host page's own rules still win on any
  // shared selector (source order). De-duped: skip a part's CSS if it's identical to the
  // page's CSS (same origin — already included) or to the other part's CSS.
  const norm = (s?: string) => (s || "").trim();
  const partCssBlocks: string[] = [];
  for (const p of [headerPart, footerPart]) {
    const c = norm(p?.css);
    if (c && c !== norm(page.css) && !partCssBlocks.includes(c)) partCssBlocks.push(c);
  }
  const partCss = partCssBlocks.join("\n");

  // @import must come first, then the un-reset, then the linked parts' CSS, then the
  // mockup's own CSS (which wins on any conflict via source order).
  const styleText = `${fontImports}\n${UNRESET}\n${partCss}\n${page.css || ""}`;

  return (
    <>
      {(page._schemas || []).map((b, i) =>
        b && b.data && Object.keys(b.data).length ? (
          <JsonLd key={i} data={{ "@context": "https://schema.org", ...b.data }} />
        ) : null
      )}
      <style dangerouslySetInnerHTML={{ __html: styleText }} />
      <div className="nifty-mockup" dangerouslySetInnerHTML={{ __html: bodyHtml }} />
      <script dangerouslySetInnerHTML={{ __html: NIFTY_FORM_SCRIPT }} />
    </>
  );
}
