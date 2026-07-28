"use client";

import { useState } from "react";
import Link from "next/link";
import Logo from "./logo";
import { site, nav } from "@/lib/site";
import { Phone, ChevronDown, Menu, X } from "./icons";

export default function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [svc, setSvc] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/95 backdrop-blur">
      <div className="container-x flex h-[72px] items-center justify-between gap-4">
        <Link href="/" aria-label="Your Business home">
          <Logo />
        </Link>

        <nav className="hidden items-center gap-6 xl:flex">
          {nav.map((item) =>
            item.children ? (
              <div
                key={item.label}
                className="relative"
                onMouseEnter={() => setSvc(true)}
                onMouseLeave={() => setSvc(false)}
              >
                <Link href={item.href} className="flex items-center gap-1 text-sm font-medium text-navy hover:text-teal">
                  {item.label} <ChevronDown width={14} height={14} />
                </Link>
                {svc && (
                  <div className="absolute left-1/2 top-full z-50 w-64 -translate-x-1/2 pt-3">
                    <div className="grid gap-0.5 rounded-2xl border border-slate-100 bg-white p-2 shadow-xl">
                      {item.children.map((c) => (
                        <Link key={c.label} href={c.href} className="rounded-lg px-3 py-2 text-sm text-navy hover:bg-teal-50 hover:text-teal">
                          {c.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link key={item.label} href={item.href} className="text-sm font-medium text-navy hover:text-teal">
                {item.label}
              </Link>
            )
          )}
        </nav>

        <div className="hidden items-center gap-4 xl:flex">
          <a href={site.phoneHref} className="flex items-center gap-1.5 text-sm font-semibold text-teal">
            <Phone width={16} height={16} /> {site.phone}
          </a>
          <Link href="/contact" className="btn btn-teal px-5 py-2.5">Get in Touch</Link>
        </div>

        <button className="xl:hidden text-navy" aria-label="Menu" onClick={() => setOpen((v) => !v)}>
          {open ? <X /> : <Menu />}
        </button>
      </div>

      {open && (
        <div className="border-t border-slate-100 bg-white xl:hidden">
          <div className="container-x flex flex-col gap-1 py-3">
            {nav.map((item) => (
              <Link key={item.label} href={item.href} className="rounded-lg px-2 py-2 text-sm font-medium text-navy hover:bg-teal-50" onClick={() => setOpen(false)}>
                {item.label}
              </Link>
            ))}
            <div className="mt-2 flex items-center gap-3">
              <a href={site.phoneHref} className="btn btn-outline-teal flex-1 py-2.5">
                <Phone width={16} height={16} /> Call
              </a>
              <Link href="/contact" className="btn btn-teal flex-1 py-2.5" onClick={() => setOpen(false)}>
                Get in Touch
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
