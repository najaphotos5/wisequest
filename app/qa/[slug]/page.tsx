import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { NextSteps } from "@/components/NextSteps";
import { ArticleBody } from "@/components/ArticleBody";
import { PageHeader } from "@/components/PageShell";
import { getPage, listSlugs } from "@/lib/content";

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return listSlugs("qa").map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const page = await getPage("qa", (await params).slug);
  return page ? { title: page.meta.title, description: page.meta.description } : {};
}

export default async function QaPage({ params }: Props) {
  const page = await getPage("qa", (await params).slug);
  if (!page) notFound();
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [{ "@type": "Question", name: page.meta.title, acceptedAnswer: { "@type": "Answer", text: page.meta.description } }],
  };

  return (
    <article>
      <PageHeader path={`/qa/${page.slug}`} meta={{ ...page.meta, section: "Q&A" }} crumbs={[{ label: "Home", href: "/" }, { label: "Q&A", href: "/qa" }]} />
      <ArticleBody
        page={page}
        section="Q&A"
        footer={
          <p className="not-prose mt-12">
            <Link href="/qa" className="font-semibold text-brand">← All questions</Link>
          </p>
        }
      />
      <NextSteps />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
    </article>
  );
}
