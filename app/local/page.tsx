import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/PageShell";
import sessions from "@/data/sessions.json";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Quran 101: Explore the Quran Near You",
  description: "Free weekly Quran 101 gatherings in Roseville and Sacramento. Friendly discussion, a free Quran, and refreshments. All faiths welcome.",
};

const expect = [
  ["A warm welcome", "People of every faith and none. Come as you are; no preparation needed."],
  ["Read together", "We read a short passage of the Quran in English and discuss what it means."],
  ["Ask anything", "Honest questions are welcome. There are no wrong ones."],
  ["Free Quran & snacks", "Take home a free English translation. Light refreshments provided."],
];

export default function LocalPage() {
  const eventsJsonLd = sessions
    .filter((s) => s.status === "weekly")
    .map((s) => ({
      "@context": "https://schema.org",
      "@type": "Event",
      name: `Quran 101 — ${s.city}`,
      description: "A free weekly gathering to read and discuss the Quran with Muslims.",
      eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
      isAccessibleForFree: true,
      location: { "@type": "Place", name: s.city, address: s.address },
      eventSchedule: { "@type": "Schedule", byDay: "https://schema.org/Wednesday", startTime: "19:00", endTime: "20:00", repeatFrequency: "P1W" },
    }));

  return (
    <>
      <PageHeader path={"/local"} meta={{ section: "Local", title: "Quran 101", description: "Let the power of the Holy Quran illuminate your soul, enrich your mind, and nourish your heart. A free weekly gathering for people of all faiths." }} />
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-10 lg:grid-cols-[3fr_2fr]">
          <div className="prose prose-lg">
            <p>
              The Quran is the fundamental book of Islam and God’s final guidance to humanity, a living scripture that shapes the
              daily decisions of billions.
            </p>
            <p>
              Our weekly gatherings let friends from different faith backgrounds experience this great book firsthand, meet Muslims,
              and share their thoughts in a courteous, respectful environment. We aim to build bridges of mutual respect and
              understanding.
            </p>
            <p>
              <strong>Walk-ins are welcome</strong>, but signing up helps us save you a seat and a free copy of the Quran.
            </p>
            <p className="not-prose flex flex-wrap gap-3">
              <a href={site.quran101SignupUrl} className="btn-primary px-7 py-3 text-base" target="_blank" rel="noopener noreferrer">Sign up for a session ↗</a>
              <Link href="/local/quran-101/handouts" className="btn-ghost px-7 py-3 text-base">Past session handouts</Link>
            </p>
          </div>
          <section aria-labelledby="locations" className="space-y-4">
            <h2 id="locations" className="font-serif text-2xl font-semibold">Locations</h2>
            {sessions.map((s) => (
              <div key={s.city} className="rounded-2xl border border-line bg-surface p-6">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-serif text-xl font-semibold">{s.city}</h3>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${s.status === "weekly" ? "bg-brand-soft text-brand" : "bg-surface-2 text-muted"}`}>
                    {s.status === "weekly" ? "Every week" : "Coming soon"}
                  </span>
                </div>
                <p className="mt-2 font-semibold">{s.when}</p>
                {s.address && (
                  <p className="mt-1 text-muted">
                    {s.address}
                    {s.mapUrl && <> · <a href={s.mapUrl} className="font-semibold text-brand" target="_blank" rel="noopener noreferrer">Map ↗</a></>}
                  </p>
                )}
                {s.note && <p className="mt-2 text-sm text-muted">{s.note}</p>}
              </div>
            ))}
          </section>
        </div>

        <section aria-labelledby="expect" className="mt-16">
          <h2 id="expect" className="font-serif text-3xl font-semibold">What to expect</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {expect.map(([t, b]) => (
              <div key={t} className="rounded-2xl bg-surface-2 p-6">
                <p className="font-semibold">{t}</p>
                <p className="mt-2 text-sm text-muted">{b}</p>
              </div>
            ))}
          </div>
          <p className="mt-6 text-muted">
            Looking for a mosque? See <Link href="/local/mosques" className="font-semibold text-brand">area mosques</Link>.
          </p>
        </section>
      </div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(eventsJsonLd) }} />
    </>
  );
}
