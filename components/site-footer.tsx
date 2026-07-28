import Link from "next/link";
import Logo from "./logo";
import { site } from "@/lib/site";
import { Phone, Mail, MapPin } from "./icons";

const cols = [
  { title: "Quick Links", links: [["Home", "/"], ["About Us", "/about"], ["Our Services", "/our-services"], ["NDIS Support", "/#services"], ["For Participants", "/#onboarding"], ["Contact Us", "/contact"]] },
  { title: "Our Services", links: [["Personal Care", "/our-services/personal-activities"], ["Community Participation", "/our-services/personal-activities"], ["Household Tasks", "/our-services/personal-activities"], ["Transport & Shopping", "/our-services/personal-activities"], ["Respite Support", "/our-services/personal-activities"]] },
  { title: "Areas We Support", links: [["Melbourne", "/"], ["Sydney", "/"], ["Inner West Sydney", "/locations/cabarita"], ["Parramatta", "/"], ["Greater Sydney", "/"]] },
];

export default function SiteFooter() {
  return (
    <footer className="border-t border-slate-100 bg-[#f6faf9]">
      <div className="container-x grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <Logo />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-slate-600">{site.tagline}</p>
          <div className="mt-5 flex gap-2">
            {["f", "in", "ig", "@"].map((s) => (
              <span key={s} className="flex h-9 w-9 items-center justify-center rounded-full bg-teal text-xs font-bold text-white">{s}</span>
            ))}
          </div>
        </div>
        {cols.map((c) => (
          <div key={c.title}>
            <h4 className="font-display text-sm font-bold text-navy">{c.title}</h4>
            <ul className="mt-4 space-y-2 text-sm">
              {c.links.map(([label, href]) => (
                <li key={label + href}><Link href={href} className="text-slate-600 hover:text-teal">{label}</Link></li>
              ))}
            </ul>
          </div>
        ))}
        <div>
          <h4 className="font-display text-sm font-bold text-navy">Contact Us</h4>
          <ul className="mt-4 space-y-3 text-sm text-slate-600">
            <li><a href={site.phoneHref} className="flex items-center gap-2 hover:text-teal"><Phone width={16} height={16} className="text-teal" /> {site.phone}</a></li>
            <li><a href={`mailto:${site.email}`} className="flex items-center gap-2 hover:text-teal"><Mail width={16} height={16} className="text-teal" /> {site.email}</a></li>
            <li className="flex items-start gap-2"><MapPin width={16} height={16} className="mt-0.5 shrink-0 text-teal" /> {site.areas}, Australia</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-slate-200">
        <div className="container-x flex flex-col items-center justify-between gap-2 py-5 text-xs text-slate-500 sm:flex-row">
          <span>© 2026 Your Business. All rights reserved.</span>
          <div className="flex gap-4">
            <Link href="#" className="hover:text-teal">Privacy Policy</Link>
            <Link href="#" className="hover:text-teal">Terms of Use</Link>
            <Link href="#" className="hover:text-teal">Sitemap</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
