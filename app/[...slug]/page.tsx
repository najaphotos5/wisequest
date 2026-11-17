import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NextSteps } from "@/components/NextSteps";
import { PageHeader, Prose } from "@/components/PageShell";
import { getPage, listSlugs } from "@/lib/content";
import { renderMdx } from "@/lib/mdx";

type Props = { params: Promise<{ slug: string[] }> };

export const dynamicParams = false;

/** Routes implemented in app/ rather than content/pages (for breadcrumbs). */
const APP_ROUTES = ["learn", "local", "qa", "contact", "resources/free-quran"];

export function generateStaticParams() {
  return listSlugs("pages").map((s) => ({ slug: s.split("/") }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const page = await getPage("pages", (await params).slug.join("/"));
  if (!page) return {};
  return { title: page.meta.title, description: page.meta.description, alternates: { canonical: `/${page.slug}` } };
}

export default async function ContentPage({ params }: Props) {
  const { slug } = await params;
  const page = await getPage("pages", slug.join("/"));
  if (!page) notFound();
  const content = await renderMdx(page.body);

  if (page.meta.bare) return content;

  const known = new Set([...APP_ROUTES, ...listSlugs("pages")]);
  const crumbs = slug
    .slice(0, -1)
    .map((_, i) => ({ path: slug.slice(0, i + 1).join("/"), label: slug[i].replace(/-/g, " ").replace(/^\w/, (c) => c.toUpperCase()) }))
    .filter((c) => known.has(c.path))
    .map((c) => ({ href: `/${c.path}`, label: c.label }));

  return (
    <article lang={page.meta.lang}>
      <PageHeader path={`/${page.slug}`} meta={page.meta} crumbs={crumbs.length ? [{ label: "Home", href: "/" }, ...crumbs] : []} />
      <Prose>
        {content}
        {page.meta.sources && page.meta.sources.length > 0 && (
          <section aria-labelledby="sources">
            <h2 id="sources">Sources</h2>
            <ul>{page.meta.sources.map((s) => <li key={s}>{s}</li>)}</ul>
          </section>
        )}
        {page.meta.updated && (
          <p className="text-sm text-muted">
            Last updated <time dateTime={page.meta.updated}>{new Date(page.meta.updated).toLocaleDateString("en-US", { dateStyle: "long" })}</time>
          </p>
        )}
      </Prose>
      <NextSteps />
    </article>
  );
}
