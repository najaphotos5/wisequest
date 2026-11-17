import { ImageCard, SectionTitle } from "./visual";

const steps = [
  { title: "Have a question?", body: "Ask a friendly, knowledgeable Muslim. No pressure, no judgment.", href: "/contact", image: "/img/talk.jpg", section: "Contact" },
  { title: "Read the Quran", body: "Get a free English translation by mail, or read it online today.", href: "/resources/free-quran", image: "/img/free-quran.jpg", section: "Resources" },
  { title: "Meet us in person", body: "Join a relaxed weekly Quran 101 session with refreshments.", href: "/local", image: "/img/local.jpg", section: "Local" },
];

export function NextSteps() {
  return (
    <section aria-labelledby="next-steps" className="bg-surface-2 py-16">
      <SectionTitle id="next-steps">Your next step</SectionTitle>
      <div className="mx-auto mt-10 grid max-w-6xl gap-6 px-4 md:grid-cols-3">
        {steps.map((s) => <ImageCard key={s.href} {...s} />)}
      </div>
    </section>
  );
}
