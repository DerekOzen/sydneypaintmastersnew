"use client";

import { useState } from "react";
import { Check, ArrowRight } from "./icons";
import { services } from "@/lib/site";

// Sends form submissions to the Nifty Websites Dashboard leads inbox.
// The dashboard now lives under /admin, so the lead endpoint moved too.
const LEAD_ENDPOINT = "https://nifty-websites-dashboard.web-528.workers.dev/admin/api/lead";
const SITE_ID = "nifty-site";

export default function EnquiryForm({
  defaultSuburb = "",
  title = "Quick Enquiry",
  subtitle,
}: {
  defaultSuburb?: string;
  title?: string;
  subtitle?: string;
}) {
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    const fd = new FormData(e.currentTarget);
    const data: Record<string, string> = { site: SITE_ID };
    fd.forEach((v, k) => (data[k] = String(v)));
    try {
      await fetch(LEAD_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    } catch {
      /* best-effort — still thank the visitor */
    }
    setBusy(false);
    setSent(true);
  }

  if (sent) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl bg-teal-50 p-8 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-teal text-white"><Check /></span>
        <h3 className="mt-4 font-display text-lg font-bold text-navy">Thank you — enquiry received!</h3>
        <p className="mt-1 text-sm text-slate-600">Our friendly team will be in touch within 1 business day.</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
      <h3 className="font-display text-xl font-bold text-navy">{title}</h3>
      {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <input name="name" required placeholder="Full Name *" className="fld sm:col-span-2" />
        <input name="email" required type="email" placeholder="Email *" className="fld" />
        <input name="phone" required placeholder="Phone *" className="fld" />
        <input name="suburb" defaultValue={defaultSuburb} placeholder="Suburb / Location" className="fld" />
        <select name="service" className="fld text-slate-500" defaultValue="">
          <option value="" disabled>Select service</option>
          {services.map((s) => <option key={s.title}>{s.title}</option>)}
        </select>
      </div>
      <textarea name="message" rows={3} placeholder="Tell us a little about your needs…" className="fld mt-3 w-full" />
      <button type="submit" disabled={busy} className="btn btn-teal mt-4 w-full">
        {busy ? "Sending…" : <>Send Enquiry <ArrowRight width={16} height={16} /></>}
      </button>
      <p className="mt-3 text-center text-xs text-slate-400">Your information is safe and secure. We respect your privacy.</p>

      <style jsx>{`
        .fld { width: 100%; border-radius: 0.6rem; border: 1px solid #e2e8f0; padding: 0.6rem 0.8rem; font-size: 0.875rem; outline: none; background: #fff; }
        .fld:focus { border-color: #14a79a; box-shadow: 0 0 0 3px rgba(20,167,154,0.15); }
      `}</style>
    </form>
  );
}
