// Renders an imported-mockup page with 100% fidelity. Self-contained framework
// file (portable to every Nifty site). The design lives entirely in the page's
// captured CSS; we inject it verbatim, restore the browser defaults that the
// site's Tailwind reset would otherwise change (so the mockup looks exactly as
// authored), then output the section HTML as-is. No site header/footer chrome —
// the mockup carries its own. Header/footer may be shared "parts" wrapped here.
import { JsonLd } from "@/components/schema";

type Block = { id?: string; type: string; props?: Record<string, any> };
type Part = { id: string; kind: string; name: string; html: string };
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

  const fontImports = (page.fonts || [])
    .filter((h) => /^https?:\/\//i.test(h))
    .map((h) => `@import url("${h}");`)
    .join("\n");

  // @import must come first, then the un-reset, then the mockup's own CSS.
  const styleText = `${fontImports}\n${UNRESET}\n${page.css || ""}`;

  return (
    <>
      {(page._schemas || []).map((b, i) =>
        b && b.data && Object.keys(b.data).length ? (
          <JsonLd key={i} data={{ "@context": "https://schema.org", ...b.data }} />
        ) : null
      )}
      <style dangerouslySetInnerHTML={{ __html: styleText }} />
      <div className="nifty-mockup" dangerouslySetInnerHTML={{ __html: bodyHtml }} />
    </>
  );
}
