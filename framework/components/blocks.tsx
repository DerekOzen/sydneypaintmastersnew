// Renders live-editor blocks on the site. Self-contained (no external deps, no
// site-specific imports) so it's a portable framework file — the same renderer
// works on every Nifty site. Styling uses inline styles to stay consistent
// regardless of a site's Tailwind setup.
import Link from "next/link";

type Block = { id?: string; type: string; props?: Record<string, any> };

const TEAL = "#14a79a";
const NAVY = "#16294d";
const INK = "#334155";
const MUTE = "#64748b";

function mdToHtml(src: string): string {
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const inline = (s: string) =>
    esc(s)
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.+?)\*/g, "<em>$1</em>")
      .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>');
  const lines = (src || "").split("\n");
  let html = "", inList = false;
  for (const raw of lines) {
    const line = raw.trim();
    if (/^[-*] /.test(line)) { if (!inList) { html += "<ul>"; inList = true; } html += `<li>${inline(line.slice(2))}</li>`; continue; }
    if (inList) { html += "</ul>"; inList = false; }
    if (/^### /.test(line)) html += `<h3>${inline(line.slice(4))}</h3>`;
    else if (/^## /.test(line)) html += `<h2>${inline(line.slice(3))}</h2>`;
    else if (/^# /.test(line)) html += `<h2>${inline(line.slice(2))}</h2>`;
    else if (line) html += `<p>${inline(line)}</p>`;
  }
  if (inList) html += "</ul>";
  return html;
}

function Badge({ label }: { label?: string }) {
  return (
    <span style={{ display: "inline-flex", height: 44, width: 44, alignItems: "center", justifyContent: "center", borderRadius: 12, background: "#e6f6f4", color: NAVY, fontWeight: 800 }}>
      {(label || "•").charAt(0).toUpperCase()}
    </span>
  );
}

function Button({ text, href }: { text?: string; href?: string }) {
  if (!text) return null;
  return (
    <Link href={href || "#"} style={{ display: "inline-block", background: TEAL, color: "#fff", borderRadius: 10, padding: "12px 24px", fontWeight: 700, textDecoration: "none" }}>
      {text}
    </Link>
  );
}

function One({ block }: { block: Block }) {
  const p = block.props || {};
  switch (block.type) {
    case "hero":
      return (
        <section style={{ padding: "72px 20px", textAlign: "center", color: "#fff", background: p.image ? `linear-gradient(rgba(15,23,42,.6),rgba(15,23,42,.6)), url(${p.image}) center/cover` : NAVY }}>
          <div style={{ maxWidth: 800, margin: "0 auto" }}>
            <h1 style={{ fontSize: 40, fontWeight: 800, margin: 0, lineHeight: 1.15 }}>{p.heading}</h1>
            {p.subtext && <p style={{ marginTop: 16, fontSize: 18, opacity: .9 }}>{p.subtext}</p>}
            {p.buttonText && <div style={{ marginTop: 28 }}><Button text={p.buttonText} href={p.buttonHref} /></div>}
          </div>
        </section>
      );
    case "richtext":
      return (
        <section style={{ maxWidth: 760, margin: "0 auto", padding: "36px 20px" }}>
          <div className="rte" dangerouslySetInnerHTML={{ __html: mdToHtml(p.content || "") }} />
        </section>
      );
    case "image":
      return (
        <section style={{ maxWidth: 900, margin: "0 auto", padding: "24px 20px", textAlign: "center" }}>
          {p.src ? <img src={p.src} alt={p.alt || ""} style={{ maxWidth: "100%", borderRadius: 14 }} /> : null}
          {p.caption && <div style={{ color: MUTE, fontSize: 14, marginTop: 8 }}>{p.caption}</div>}
        </section>
      );
    case "cta":
      return (
        <section style={{ padding: "28px 20px" }}>
          <div style={{ maxWidth: 900, margin: "0 auto", background: "#e6f6f4", borderRadius: 18, padding: 36, textAlign: "center" }}>
            <h2 style={{ fontSize: 26, fontWeight: 800, color: NAVY, margin: 0 }}>{p.heading}</h2>
            {p.text && <p style={{ marginTop: 8, color: INK }}>{p.text}</p>}
            {p.buttonText && <div style={{ marginTop: 20 }}><Button text={p.buttonText} href={p.buttonHref} /></div>}
          </div>
        </section>
      );
    case "columns":
      return (
        <section style={{ maxWidth: 1080, margin: "0 auto", padding: "36px 20px" }}>
          <div style={{ display: "grid", gridTemplateColumns: `repeat(auto-fit,minmax(220px,1fr))`, gap: 20 }}>
            {(p.items || []).map((c: any, i: number) => (
              <div key={i} style={{ border: "1px solid #e2e8f0", borderRadius: 14, padding: 22 }}>
                <Badge label={c.heading} />
                <h3 style={{ fontWeight: 700, color: NAVY, margin: "12px 0 6px", fontSize: 18 }}>{c.heading}</h3>
                <p style={{ color: MUTE, margin: 0 }}>{c.text}</p>
              </div>
            ))}
          </div>
        </section>
      );
    case "services":
      return (
        <section style={{ maxWidth: 1080, margin: "0 auto", padding: "36px 20px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(230px,1fr))", gap: 18 }}>
            {(p.items || []).map((s: any, i: number) => (
              <div key={i} style={{ border: "1px solid #e2e8f0", borderRadius: 14, padding: 22 }}>
                <Badge label={s.title} />
                <h3 style={{ fontWeight: 700, color: NAVY, margin: "12px 0 6px", fontSize: 18 }}>{s.title}</h3>
                <p style={{ color: MUTE, margin: 0 }}>{s.body}</p>
              </div>
            ))}
          </div>
        </section>
      );
    case "faq":
      return (
        <section style={{ maxWidth: 800, margin: "0 auto", padding: "36px 20px" }}>
          {(p.items || []).map((f: any, i: number) => (
            <div key={i} style={{ borderBottom: "1px solid #e2e8f0", padding: "16px 0" }}>
              <h3 style={{ fontWeight: 700, color: NAVY, margin: 0, fontSize: 17 }}>{f.q}</h3>
              <p style={{ color: MUTE, margin: "6px 0 0" }}>{f.a}</p>
            </div>
          ))}
        </section>
      );
    case "testimonial":
      return (
        <section style={{ maxWidth: 760, margin: "0 auto", padding: "36px 20px" }}>
          <div style={{ borderLeft: `4px solid ${TEAL}`, paddingLeft: 22 }}>
            <p style={{ fontStyle: "italic", fontSize: 20, color: INK, margin: 0 }}>“{p.quote}”</p>
            <p style={{ marginTop: 12, fontWeight: 700, color: NAVY }}>{p.author}{p.role ? <span style={{ fontWeight: 400, color: MUTE }}> · {p.role}</span> : null}</p>
          </div>
        </section>
      );
    default:
      return null;
  }
}

export function Blocks({ blocks }: { blocks?: Block[] }) {
  const list = Array.isArray(blocks) ? blocks : [];
  if (!list.length) return null;
  return <>{list.map((b, i) => <One key={b.id || i} block={b} />)}</>;
}
