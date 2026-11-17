import { readFile } from "node:fs/promises";
import path from "node:path";
import fs from "node:fs";
import matter from "gray-matter";

export type PageMeta = {
  title: string;
  description: string;
  section?: string;
  updated?: string;
  sources?: string[];
  /** Hide the standard page header (title/description) — the MDX renders its own. */
  bare?: boolean;
  /** Content language, when not English (e.g. "es"). */
  lang?: string;
};

export type Page = { slug: string; meta: PageMeta; body: string };

const DIRS = { pages: path.join(process.cwd(), "content/pages"), qa: path.join(process.cwd(), "content/qa") };

function walk(dir: string, base = ""): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(path.join(dir, e.name), `${base}${e.name}/`) : e.name.endsWith(".mdx") ? [`${base}${e.name.slice(0, -4)}`] : [],
  );
}

export function listSlugs(kind: keyof typeof DIRS) {
  return walk(DIRS[kind]);
}

export async function getPage(kind: keyof typeof DIRS, slug: string): Promise<Page | null> {
  try {
    const raw = await readFile(path.join(DIRS[kind], `${slug}.mdx`), "utf8");
    const { data, content } = matter(raw);
    return { slug, meta: data as PageMeta, body: content };
  } catch {
    return null;
  }
}

export async function listPages(kind: keyof typeof DIRS) {
  const pages = await Promise.all(listSlugs(kind).map((s) => getPage(kind, s)));
  return pages.filter((p): p is Page => p !== null);
}
