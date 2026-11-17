import type { Metadata } from "next";
import { PageHeader } from "@/components/PageShell";
import { ImageCard } from "@/components/visual";
import { listPages } from "@/lib/content";
import { imageFor } from "@/lib/visuals";

export const metadata: Metadata = {
  title: "Learn About Islam",
  description: "Articles and videos on the Quran, Prophet Muhammad ﷺ, Jesus in Islam, women in Islam, and history.",
};

export default async function LearnIndex() {
  const pages = (await listPages("pages")).filter((p) => p.slug.startsWith("learn/") || p.slug === "purpose-of-life" || p.slug.startsWith("start"));
  const order = ["start", "start/god", "purpose-of-life", "learn/quran", "learn/muhammad", "learn/muhammad/teachings", "learn/jesus", "learn/women", "learn/why-cant-we-see-god", "learn/history", "learn/palestine", "learn/ai-insights"];
  pages.sort((a, b) => order.indexOf(a.slug) - order.indexOf(b.slug));
  return (
    <>
      <PageHeader path={"/learn"} meta={{ section: "Learn", title: "Learn about Islam", description: "Explore at your own pace. Every article ends with ways to ask questions or go deeper." }} />
      <ul className="mx-auto grid max-w-6xl gap-8 px-4 py-16 sm:grid-cols-2 lg:grid-cols-3">
        {pages.map((p) => (
          <li key={p.slug}>
            <ImageCard href={`/${p.slug}`} image={imageFor(`/${p.slug}`)} section={p.meta.section ?? "Learn"} title={p.meta.title} body={p.meta.description} />
          </li>
        ))}
      </ul>
    </>
  );
}
