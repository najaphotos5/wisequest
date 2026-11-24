import type { ReactNode } from "react";
import { wantsChapters, wordCount, type Page } from "@/lib/content";
import { renderMdx } from "@/lib/mdx";
import { sectionColor } from "@/lib/visuals";
import { ChapterReader } from "./ChapterReader";
import { Prose } from "./PageShell";

/** Renders a page body (wrapped in [data-wq-body], which dev mode swaps for older versions): long pages in chapter mode with key points, others as plain prose. */
export async function ArticleBody({ page, section, footer }: { page: Page; section?: string; footer?: ReactNode }) {
  const chaptered = wantsChapters(page);
  const { content, chapters } = await renderMdx(page.body, { chapters: chaptered });

  if (!chaptered || chapters.length < 2) {
    return (
      <div data-wq-body>
        <Prose>
          {content}
          {footer}
        </Prose>
      </div>
    );
  }

  return (
    <div data-wq-body>
      <ChapterReader
        chapters={chapters}
        summary={page.meta.summary}
        minutes={Math.max(1, Math.round(wordCount(page.body) / 200))}
        color={sectionColor(section ?? page.meta.section)}
      >
        {content}
      </ChapterReader>
      {footer && <div className="prose prose-lg mx-auto max-w-3xl px-4 pb-12">{footer}</div>}
    </div>
  );
}
