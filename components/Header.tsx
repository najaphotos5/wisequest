"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type CSSProperties } from "react";
import { nav } from "@/lib/site";
import { sectionColor } from "@/lib/visuals";
import { Logo } from "./Logo";

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [pathname]);

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href.split("#")[0]));

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white/95 shadow-sm backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Logo />

        <nav aria-label="Main" className="hidden lg:block">
          <ul className="flex items-center text-sm font-medium">
            {nav.map((item) => (
              <li key={item.href} className="group relative">
                <Link
                  href={item.href}
                  aria-current={isActive(item.href) ? "page" : undefined}
                  style={{ "--c": sectionColor(item.label) } as CSSProperties}
                  className="block whitespace-nowrap border-b-[3px] border-transparent px-2.5 py-5 font-display text-[15px] font-medium hover:border-[var(--c)] hover:text-[var(--c)] aria-[current=page]:border-[var(--c)] aria-[current=page]:text-[var(--c)]"
                >
                  {item.label}
                </Link>
                {item.children && (
                  <div className="invisible absolute left-0 top-full opacity-0 transition group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
                    <ul className="w-64 rounded-b-xl border border-t-0 border-line bg-white p-2 shadow-xl">
                      {item.children.map((c) => (
                        <li key={c.href}>
                          <Link href={c.href} className="block rounded-xl px-3 py-2 hover:bg-surface-2">
                            <span className="block">{c.label}</span>
                            {c.description && <span className="block text-xs font-normal text-muted">{c.description}</span>}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          <Link href="/contact" className="btn-ghost hidden whitespace-nowrap sm:inline-flex lg:hidden xl:inline-flex">
            Talk to us
          </Link>
          <Link href="/become-muslim" className="btn-primary hidden whitespace-nowrap sm:inline-flex">
            Become Muslim
          </Link>
          <button
            type="button"
            className="btn-ghost px-3 lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            onClick={() => setOpen((o) => !o)}
          >
            <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              {open ? <path d="M6 6l12 12M18 6 6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>
      </div>

      {open && (
        <nav id="mobile-nav" aria-label="Main" className="max-h-[calc(100dvh-4rem)] overflow-y-auto border-t border-line bg-bg px-4 pb-6 lg:hidden">
          <ul className="divide-y divide-line">
            {nav.map((item) => (
              <li key={item.href} className="py-3">
                <Link href={item.href} className="font-display text-lg font-semibold" style={{ color: sectionColor(item.label) }}>
                  {item.label}
                </Link>
                {item.children && (
                  <ul className="mt-2 grid grid-cols-2 gap-1 text-sm text-muted">
                    {item.children.map((c) => (
                      <li key={c.href}>
                        <Link href={c.href} className="block py-1">
                          {c.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Link href="/contact" className="btn-ghost">Talk to us</Link>
            <Link href="/become-muslim" className="btn-primary">Become Muslim</Link>
          </div>
        </nav>
      )}
    </header>
  );
}
