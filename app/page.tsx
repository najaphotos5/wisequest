import Link from "next/link";
import { ImageCard, PhotoHero, SectionTitle, Tag } from "@/components/visual";
import { YouTube } from "@/components/YouTube";
import sessions from "@/data/sessions.json";
import { getQaEntries } from "@/lib/qa";
import { imageFor, sectionColor } from "@/lib/visuals";
import { asset } from "@/lib/asset";

const essentials = [
  { title: "What is Islam?", body: "Not a new religion, but the one message every prophet brought: worship the One God.", href: "/start", section: "Start Here" },
  { title: "Who is God?", body: "The One Creator, Most Merciful, without partners or equals, in His own words.", href: "/start/god", section: "Start Here" },
  { title: "What is the Quran?", body: "God's final revelation, preserved word for word for over 1,400 years.", href: "/learn/quran", section: "Learn" },
];

const journey = [
  { label: "Ask About Islam", title: "No question is too big or too small", href: "/qa", image: "/img/qa.jpg", section: "Q&A" },
  { label: "Become Muslim", title: "One sincere sentence. Here's how.", href: "/become-muslim", image: "/img/become-muslim.jpg", section: "Take a step" },
  { label: "New Muslims", title: "Your first steps, a mentor & a toolkit", href: "/new-muslims", image: "/img/new-muslims.jpg", section: "New Muslims" },
  { label: "Visit Us", title: "Quran 101 & mosques near Sacramento", href: "/local", image: "/img/local.jpg", section: "Local" },
];

const pillars = [
  ["Shahada", "Declaration of faith"],
  ["Salah", "Five daily prayers"],
  ["Zakat", "Annual charity"],
  ["Sawm", "Fasting in Ramadan"],
  ["Hajj", "Pilgrimage to Mecca"],
];

const learn = [
  { title: "Prophet Muhammad ﷺ", body: "His life, mercy, and what historians say about him.", href: "/learn/muhammad" },
  { title: "Jesus in Islam", body: "A mighty messenger of God, born of the Virgin Mary.", href: "/learn/jesus" },
  { title: "Purpose of Life", body: "Who are we, and why are we here?", href: "/purpose-of-life" },
  { title: "Women in Islam", body: "Equal reward, equal accountability, honored roles.", href: "/learn/women" },
  { title: "Teachings of the Prophet ﷺ", body: "Mercy, love, charity, character, and care for creation.", href: "/learn/muhammad/teachings" },
  { title: "Why can't we see God?", body: "Why God remains unseen in this life.", href: "/learn/why-cant-we-see-god" },
];

const stories = [
  { id: "5Gr54pYc3Ak", title: "How I came to Islam: Dr. Laurence Brown" },
  { id: "Hjz_YIvlCw8", title: "Why I left the far right: Joram van Klaveren" },
  { id: "tcZAc9umdko", title: "Why millions are embracing Islam" },
];

export default async function Home() {
  const qa = await getQaEntries();
  const featured = qa.find((e) => e.href === "/qa/why-is-there-suffering");
  const moreQa = qa.filter((e) => e.href.startsWith("/qa/") && e !== featured).slice(0, 3);
  const weekly = sessions.find((s) => s.status === "weekly");

  return (
    <>
      <PhotoHero
        image="/img/hero-1.jpg"
        slides={["/img/hero-2.jpg", "/img/hero-3.jpg"]}
        title="The universal message of all prophets"
        tall
        description="From Adam and Abraham to Moses, Jesus, and Muhammad ﷺ, every prophet called to the same truth. Explore it for yourself, at your own pace."
      >
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/start" className="btn-primary px-7 py-3 text-base">Start learning</Link>
          <Link href="/contact" className="btn-light px-7 py-3 text-base">I have a question</Link>
        </div>
        <figure className="mt-12 max-w-2xl border-l-4 border-accent pl-5 text-white/90">
          <blockquote className="font-serif text-lg italic">
            “We believe in Allah and what has been revealed to us; and what was revealed to Abraham, Ishmael, Isaac, Jacob,
            and his descendants; and what was given to Moses, Jesus, and other prophets from their Lord.”
          </blockquote>
          <figcaption className="mt-2 font-display text-sm font-semibold text-accent">Quran 2:136</figcaption>
        </figure>
      </PhotoHero>

      {/* Essentials */}
      <section aria-labelledby="essentials" className="mx-auto max-w-6xl px-4 py-20">
        <SectionTitle id="essentials">Start with the essentials</SectionTitle>
        <div className="mt-10 grid gap-8 md:grid-cols-3">
          {essentials.map((c) => <ImageCard key={c.href} {...c} image={imageFor(c.href)} />)}
        </div>
      </section>

      {/* Journey cards */}
      <section aria-labelledby="journey" className="bg-surface-2 py-20">
        <SectionTitle id="journey">Your journey</SectionTitle>
        <div className="mx-auto mt-10 grid max-w-6xl gap-6 px-4 sm:grid-cols-2 lg:grid-cols-4">
          {journey.map((j) => {
            const color = sectionColor(j.section);
            return (
              <Link key={j.href} href={j.href} className="group flex flex-col overflow-hidden rounded-xl bg-white shadow-[0_4px_24px_rgba(0,0,0,0.08)] transition hover:-translate-y-1">
                <p className="px-4 py-4 text-center font-display text-2xl font-semibold" style={{ color }}>{j.label}</p>
                <div className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={asset(j.image)} alt="" loading="lazy" className="aspect-[16/9] w-full object-cover sm:aspect-[4/3]" />
                  <svg viewBox="0 0 100 10" preserveAspectRatio="none" className="absolute -top-px left-0 h-4 w-full" aria-hidden="true"><path d="M0 0h100L50 10Z" fill="#fff" /></svg>
                </div>
                <div className="relative flex flex-1 items-center justify-center px-5 pb-8 pt-10 text-center" style={{ background: color }}>
                  <svg viewBox="0 0 100 10" preserveAspectRatio="none" className="absolute -top-4 left-0 h-4 w-full" aria-hidden="true"><path d="M0 10 50 0l50 10Z" fill={color} /></svg>
                  <p className="font-display text-xl font-semibold leading-snug text-white">{j.title}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Featured question */}
      {featured && (
        <section aria-label="Featured question">
          <PhotoHero image={imageFor(featured.href)} section="Q&A" title={featured.title} description={featured.description}>
            <Link href={featured.href} className="btn-light mt-8 self-start px-7 py-3 text-base">Read the answer</Link>
          </PhotoHero>
        </section>
      )}

      {/* More Q&A */}
      <section aria-labelledby="questions" className="mx-auto max-w-6xl px-4 py-20">
        <SectionTitle id="questions">Questions people ask</SectionTitle>
        <div className="mt-10 grid gap-8 md:grid-cols-3">
          {moreQa.map((q) => <ImageCard key={q.href} href={q.href} image={imageFor(q.href)} section="Q&A" title={q.title} body={q.description} />)}
        </div>
        <p className="mt-10 text-center">
          <Link href="/qa" className="btn-ghost px-7 py-3 text-base">See all questions</Link>
        </p>
      </section>

      {/* Five pillars */}
      <section aria-labelledby="pillars" className="relative isolate overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={asset("/img/prayer.jpg")} alt="" loading="lazy" className="absolute inset-0 -z-10 h-full w-full object-cover" />
        <div className="absolute inset-0 -z-10 bg-[#0b5f4b]/85" />
        <div className="mx-auto max-w-6xl px-4 py-20 text-white">
          <SectionTitle id="pillars" light>The Five Pillars of Islam</SectionTitle>
          <ol className="mt-10 grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {pillars.map(([name, desc], i) => (
              <li key={name} className="rounded-xl border border-white/20 bg-white/10 p-6 text-center backdrop-blur-sm">
                <span className="mx-auto grid h-10 w-10 place-items-center rounded-full bg-accent font-display font-bold">{i + 1}</span>
                <p className="mt-3 font-display text-2xl font-semibold">{name}</p>
                <p className="mt-1 text-sm text-white/85">{desc}</p>
              </li>
            ))}
          </ol>
          <p className="mt-10 text-center">
            <Link href="/start#five-pillars" className="btn-light px-7 py-3 text-base">Learn about each pillar</Link>
          </p>
        </div>
      </section>

      {/* Learn grid */}
      <section aria-labelledby="learn" className="mx-auto max-w-6xl px-4 py-20">
        <SectionTitle id="learn">Discover Islam</SectionTitle>
        <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {learn.map((l) => <ImageCard key={l.href} {...l} image={imageFor(l.href)} section="Learn" />)}
        </div>
      </section>

      {/* Stories */}
      <section aria-labelledby="stories" className="bg-[#14181c] py-20 text-white">
        <SectionTitle id="stories" light>From doubt to faith</SectionTitle>
        <p className="mx-auto mt-4 max-w-2xl px-4 text-center text-white/75">
          Pastors, priests, and sincere men and women from every background share why they embraced Islam.
        </p>
        <div className="mx-auto mt-6 grid max-w-6xl gap-6 px-4 md:grid-cols-3 [&_figcaption]:text-white/70">
          {stories.map((s) => <YouTube key={s.id} {...s} />)}
        </div>
        <p className="mt-6 text-center">
          <Link href="/stories" className="btn px-7 py-3 text-base text-white" style={{ background: sectionColor("Stories") }}>Watch more stories</Link>
        </p>
      </section>

      {/* Local + Quran */}
      <section className="grid md:grid-cols-2">
        {[
          { image: "/img/local.jpg", section: "Local", eyebrow: `Quran 101 · ${weekly?.city}`, title: "Read the Quran with us", body: `${weekly?.when} · ${weekly?.address}`, href: "/local", cta: "Join a session" },
          { image: "/img/quran.jpg", section: "Resources", eyebrow: "Free, no obligation", title: "Get your free Quran", body: "An English translation, mailed to your door.", href: "/resources/free-quran", cta: "Request a copy" },
        ].map((p) => (
          <Link key={p.href} href={p.href} className="group relative isolate flex min-h-[420px] flex-col justify-end overflow-hidden p-10 text-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={asset(p.image)} alt="" loading="lazy" className="absolute inset-0 -z-10 h-full w-full object-cover transition duration-700 group-hover:scale-105" />
            <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
            <Tag section={p.section} className="self-start" />
            <p className="mt-3 text-sm font-semibold uppercase tracking-wider text-white/80">{p.eyebrow}</p>
            <h2 className="mt-1 font-display text-4xl font-bold">{p.title}</h2>
            <p className="mt-2 text-white/85">{p.body}</p>
            <span className="btn-light mt-6 self-start">{p.cta} →</span>
          </Link>
        ))}
      </section>

      {/* Final CTA */}
      <section className="mx-auto max-w-4xl px-4 py-20 text-center">
        <h2 className="font-display text-4xl font-bold sm:text-5xl">Ready to take the next step?</h2>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-muted">
          Becoming Muslim is simple, and you never have to do it alone. Whenever you&apos;re ready, or if you just want to
          talk, we&apos;re here.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/become-muslim" className="btn-primary px-7 py-3 text-base">How to become Muslim</Link>
          <Link href="/contact" className="btn-ghost px-7 py-3 text-base">Talk to someone</Link>
        </div>
      </section>
    </>
  );
}
