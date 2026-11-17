import { compileMDX } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import { mdxComponents } from "@/components/mdx";
import rehypeChapters, { type Chapter } from "./rehype-chapters";

/** Renders MDX. With `chapters`, content is split per `##` heading and the chapter list is returned. */
export async function renderMdx(source: string, { chapters = false } = {}) {
  const collected: Chapter[] = [];
  const { content } = await compileMDX({
    source,
    components: mdxComponents,
    options: {
      mdxOptions: {
        remarkPlugins: [remarkGfm],
        rehypePlugins: chapters ? [[rehypeChapters, { collect: collected }]] : [],
      },
    },
  });
  return { content, chapters: collected };
}
