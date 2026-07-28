import { Icon, Play, ArrowRight } from "./icons";

/** Branded photo placeholder — swap for real photography. */
export function Photo({ label, className = "", tone = "teal" }: { label?: string; className?: string; tone?: "teal" | "navy" | "warm" }) {
  const bg =
    tone === "navy" ? "from-navy to-navy-900"
    : tone === "warm" ? "from-teal-400 to-ocean-600"
    : "from-teal-500 to-teal-800";
  return (
    <div className={`relative flex items-center justify-center overflow-hidden bg-gradient-to-br ${bg} ${className}`}>
      <div className="absolute inset-0 opacity-10 [background-image:radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:16px_16px]" />
      {label && <span className="relative px-3 text-center text-xs font-medium uppercase tracking-wide text-white/90">{label}</span>}
    </div>
  );
}

export function NdisBadge({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex flex-col items-center justify-center rounded-lg bg-[#642f92] px-3 py-1.5 leading-none text-white ${className}`}>
      <span className="font-display text-sm font-extrabold lowercase tracking-tight">ndis</span>
      <span className="mt-0.5 text-[7px] font-semibold uppercase tracking-wider">Registered Provider</span>
    </span>
  );
}

export function SectionHead({ eyebrow, title, sub, center = true, light = false }: { eyebrow?: string; title: string; sub?: string; center?: boolean; light?: boolean }) {
  return (
    <div className={`${center ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}`}>
      {eyebrow && <div className={`eyebrow ${light ? "text-teal-200" : ""}`}>{eyebrow}</div>}
      <h2 className={`h2 mt-2 ${light ? "text-white" : ""}`}>{title}</h2>
      {sub && <p className={`mt-3 ${light ? "text-slate-200" : "text-slate-600"}`}>{sub}</p>}
    </div>
  );
}

export function StepProcess({ steps }: { steps: { n: number; title: string; body: string }[] }) {
  return (
    <div className="relative grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
      <div className="absolute left-0 right-0 top-5 hidden h-px bg-teal-200 lg:block" />
      {steps.map((s) => (
        <div key={s.n} className="relative text-center">
          <span className="relative z-10 mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-teal font-bold text-white ring-4 ring-[#f3f8f7]">{s.n}</span>
          <h3 className="mt-4 font-display text-base font-bold text-navy">{s.title}</h3>
          <p className="mt-2 text-sm text-slate-600">{s.body}</p>
        </div>
      ))}
    </div>
  );
}

export function VideoCards({ items }: { items: { title: string; body: string; len: string }[] }) {
  return (
    <div className="grid gap-6 md:grid-cols-3">
      {items.map((v) => (
        <figure key={v.title} className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
          <div className="relative">
            <Photo className="aspect-video" tone="navy" />
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90 text-teal shadow-lg"><Play width={20} height={20} /></span>
            </span>
            <span className="absolute bottom-2 right-2 rounded bg-black/70 px-1.5 py-0.5 text-[11px] font-medium text-white">{v.len}</span>
          </div>
          <figcaption className="p-4">
            <div className="font-display font-bold text-navy">{v.title}</div>
            <p className="mt-1 text-sm text-slate-600">{v.body}</p>
          </figcaption>
        </figure>
      ))}
    </div>
  );
}

export function FeatureStrip({ items }: { items: { title: string; body?: string; icon: string }[] }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((f) => (
        <div key={f.title} className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal"><Icon name={f.icon} width={22} height={22} /></span>
          <div>
            <div className="font-display font-semibold text-navy">{f.title}</div>
            {f.body && <div className="text-sm text-slate-500">{f.body}</div>}
          </div>
        </div>
      ))}
    </div>
  );
}

export function ServiceCard({ title, body, icon }: { title: string; body: string; icon: string }) {
  return (
    <div className="group flex gap-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-teal-200 hover:shadow-md">
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal"><Icon name={icon} width={24} height={24} /></span>
      <div>
        <h3 className="font-display font-bold text-navy">{title}</h3>
        <p className="mt-1 text-sm leading-relaxed text-slate-600">{body}</p>
      </div>
    </div>
  );
}

export function ProviderStrip({ badges }: { badges: { title: string; icon: string }[] }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {badges.map((b) => (
        <div key={b.title} className="flex flex-col items-center gap-2 text-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-teal-50 text-teal"><Icon name={b.icon} width={22} height={22} /></span>
          <span className="text-sm font-semibold text-navy">{b.title}</span>
        </div>
      ))}
    </div>
  );
}

export { ArrowRight };
