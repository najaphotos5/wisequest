import { readFileSync } from "node:fs";
import Link from "next/link";
import { footerNav, site } from "@/lib/site";
import { Logo } from "./Logo";

const version = readFileSync("VERSION", "utf8").trim();

export function Footer() {
  const { email, phone } = site.contact;
  return (
    <footer className="bg-[#14181c] text-white/90">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 md:grid-cols-[1.5fr_repeat(3,1fr)]">
        <div className="space-y-4">
          <div className="[&_span]:text-white"><Logo /></div>
          <p className="max-w-xs text-sm text-white/60">
            An independent site run by local volunteers in {site.region}, sharing the timeless message of all prophets
            with love, care, and respect.
          </p>
          {(email || phone) && (
            <ul className="space-y-1 text-sm">
              {phone && <li><a href={`tel:${phone}`} className="hover:text-white">{phone}</a></li>}
              {email && <li><a href={`mailto:${email}`} className="hover:text-white">{email}</a></li>}
            </ul>
          )}
        </div>
        {footerNav.map((group) => (
          <div key={group.label}>
            <h2 className="font-display text-base font-semibold text-white">{group.label}</h2>
            <ul className="mt-3 space-y-2 text-sm text-white/60">
              {group.children?.map((c) => (
                <li key={c.href}>
                  <Link href={c.href} className="hover:text-white">{c.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-white/10">
        <p className="mx-auto max-w-6xl px-4 py-5 text-xs text-white/50">
          © {new Date().getFullYear()} {site.name}. Not officially affiliated with WhyIslam. Photos: public domain / CC0 via{" "}
          <Link href="/about#photo-credits" className="underline">rawpixel &amp; Openverse</Link> and Pexels.{" "}
          {/* Clicking the version 5 times quickly turns on dev mode (components/DevMode.tsx). */}
          <span data-dev-trigger className="cursor-default select-none">{version}</span>
        </p>
      </div>
    </footer>
  );
}
