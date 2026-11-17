import Link from "next/link";
import type { Metadata } from "next";
import { PageHeader } from "@/components/PageShell";
import mosques from "@/data/mosques.json";

export const metadata: Metadata = {
  title: "Mosques in the Greater Sacramento Area",
  description: "Addresses, phone numbers, and websites for mosques in Sacramento, Roseville, Folsom, Elk Grove, and Natomas.",
};

export default function MosquesPage() {
  return (
    <>
      <PageHeader path={"/local/mosques"} meta={{ section: "Local", title: "Area mosques", description: "Everyone is welcome to visit a mosque. Here are some in the Greater Sacramento area, and most are happy to give a tour." }} />
      <div className="mx-auto max-w-6xl px-4 py-12">
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {mosques.map((m) => (
            <li key={m.name} className="flex flex-col rounded-2xl border border-line bg-surface p-6">
              <p className="text-sm font-semibold uppercase tracking-wider text-accent">{m.city}</p>
              <h2 className="mt-1 font-serif text-xl font-semibold">{m.name}</h2>
              <p className="mt-2 text-muted">{m.address}</p>
              {"note" in m && m.note && <p className="mt-2 text-sm font-semibold text-brand">{m.note}</p>}
              <div className="mt-auto flex flex-wrap gap-x-4 gap-y-1 pt-4 text-sm font-semibold text-brand">
                <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(m.address)}`} target="_blank" rel="noopener noreferrer">Directions ↗</a>
                <a href={`tel:${m.phone.replace(/[^\d]/g, "").slice(0, 10)}`}>{m.phone}</a>
                <a href={m.website} target="_blank" rel="noopener noreferrer">Website ↗</a>
              </div>
            </li>
          ))}
        </ul>
        <div className="mt-10 rounded-2xl bg-brand-soft p-6">
          <p className="font-semibold">First visit? A few tips</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-muted">
            <li>Dress modestly. Shoes come off before entering the prayer area.</li>
            <li>Friday midday prayer (Jumu&apos;ah) is the busiest and a great time to see the community.</li>
            <li>Want someone to meet you there? <Link href="/contact?reason=visit" className="font-semibold text-brand underline">Let us know</Link>.</li>
          </ul>
        </div>
        <p className="mt-6 text-sm text-muted">
          Elsewhere? <a className="font-semibold text-brand" href="https://www.islamicfinder.org/places/" target="_blank" rel="noopener noreferrer">Find a mosque near you ↗</a>
        </p>
      </div>
    </>
  );
}
