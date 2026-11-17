import type { Metadata } from "next";
import { QuranRequestForm } from "@/components/forms/QuranRequestForm";
import { Download } from "@/components/mdx";
import { PageHeader } from "@/components/PageShell";

export const metadata: Metadata = {
  title: "Get a Free Quran",
  description: "Request a free English translation of the Quran by mail, or read and download it online today.",
};

export default function FreeQuranPage() {
  return (
    <>
      <PageHeader path={"/resources/free-quran"} meta={{ section: "Resources", title: "Get a free Quran", description: "We'll mail you a free English translation of the meanings of the Quran. No cost, no obligation." }} />
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 lg:grid-cols-[2fr_1fr]">
        <section aria-labelledby="by-mail">
          <h2 id="by-mail" className="mb-6 font-serif text-2xl font-semibold">Request a copy by mail</h2>
          <QuranRequestForm />
        </section>
        <aside>
          <h2 className="font-serif text-xl font-semibold">Can’t wait? Read it now</h2>
          <Download href="/wp/2024-01-translation_of_the_quran.pdf" title="The Holy Quran: English translation" note="Full translation (PDF)" />
          <a href="https://www.tvquran.com/en/scholar/332/profile/quran-with-translation-english" className="mt-3 block font-semibold text-brand" target="_blank" rel="noopener noreferrer">Listen with English translation ↗</a>
          <a href="https://gtaf.org/apps/quran" className="mt-2 block font-semibold text-brand" target="_blank" rel="noopener noreferrer">Quran app for Android & iPhone ↗</a>
        </aside>
      </div>
    </>
  );
}
