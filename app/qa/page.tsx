import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/PageShell";
import { QaSearch } from "@/components/QaSearch";
import { getQaEntries } from "@/lib/qa";

export const metadata: Metadata = {
  title: "Questions & Answers",
  description: "Honest answers to big questions about God, suffering, forgiveness, the purpose of life, and Islam.",
};

export default async function QaIndex() {
  const entries = await getQaEntries();
  return (
    <>
      <PageHeader path={"/qa"} meta={{ section: "Q&A", title: "Questions & answers", description: "Big questions deserve thoughtful answers. Search below, or ask us directly." }} />
      <div className="mx-auto max-w-6xl px-4 py-12">
        <QaSearch entries={entries} />
        <div className="mt-16 rounded-2xl bg-brand-soft p-8 text-center">
          <p className="font-serif text-2xl font-semibold">Didn&apos;t find your question?</p>
          <p className="mt-2 text-muted">Ask a friendly, knowledgeable volunteer. We reply personally.</p>
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            <Link href="/contact?reason=questions" className="btn-primary">Ask a question</Link>
            <a href="https://islammessage.org/en/questions" className="btn-ghost" target="_blank" rel="noopener noreferrer">Browse more Q&A ↗</a>
          </div>
        </div>
      </div>
    </>
  );
}
