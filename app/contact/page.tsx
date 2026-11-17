import Link from "next/link";
import type { Metadata } from "next";
import { Suspense } from "react";
import { ContactForm } from "@/components/forms/ContactForm";
import { PageHeader } from "@/components/PageShell";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Talk to Us",
  description: "Questions about Islam? Want to become Muslim or visit a mosque? Reach a friendly local volunteer.",
};

export default function ContactPage() {
  const { email, phone, whatsapp, hours } = site.contact;
  return (
    <>
      <PageHeader path={"/contact"} meta={{ section: "Contact", title: "Talk to us", description: "Whatever brings you here, a question, curiosity, or a decision, we'd love to hear from you. No pressure, and everything stays confidential." }} />
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 lg:grid-cols-[2fr_1fr]">
        <section aria-labelledby="form-heading">
          <h2 id="form-heading" className="sr-only">Send us a message</h2>
          <Suspense>
            <ContactForm />
          </Suspense>
        </section>
        <aside className="space-y-6">
          <div className="rounded-2xl border border-line bg-surface p-6">
            <h2 className="font-serif text-xl font-semibold">Prefer to talk now?</h2>
            <ul className="mt-3 space-y-2">
              {phone && <li><a className="font-semibold text-brand" href={`tel:${phone}`}>Call or text {phone}</a></li>}
              {whatsapp && <li><a className="font-semibold text-brand" href={`https://wa.me/${whatsapp}`}>Message us on WhatsApp</a></li>}
              {email && <li><a className="font-semibold text-brand" href={`mailto:${email}`}>{email}</a></li>}
              <li><a className="font-semibold text-brand" href="https://edialogue.org/" target="_blank" rel="noopener noreferrer">Live chat 24/7 with eDialogue ↗</a></li>
            </ul>
            <p className="mt-3 text-sm text-muted">{hours}</p>
          </div>
          <div className="rounded-2xl border border-line bg-surface p-6">
            <h2 className="font-serif text-xl font-semibold">Free Quran</h2>
            <p className="mt-2 text-muted">Get a free English translation of the Quran by mail.</p>
            <Link href="/resources/free-quran" className="mt-3 inline-block font-semibold text-brand">Request a copy →</Link>
          </div>
          <div className="rounded-2xl border border-line bg-surface p-6">
            <h2 className="font-serif text-xl font-semibold">Support our work</h2>
            <p className="mt-2 text-muted">Help us share free Qurans and host Quran 101 sessions.</p>
            <a href={site.donateUrl} className="mt-3 inline-block font-semibold text-brand" target="_blank" rel="noopener noreferrer">Donate via ICNA Sacramento ↗</a>
          </div>
        </aside>
      </div>
    </>
  );
}
