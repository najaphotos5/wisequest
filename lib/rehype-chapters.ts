/**
 * Rehype plugin: wraps the top-level content of a page into one
 * <section data-chapter> per `##` heading (content before the first heading
 * becomes "Introduction"), and reports the chapters it created.
 */
export type Chapter = { id: string; title: string };

type Node = {
  type: string;
  tagName?: string;
  name?: string | null;
  value?: string;
  properties?: Record<string, unknown>;
  children?: Node[];
};

const isH2 = (n: Node) => (n.type === "element" && n.tagName === "h2") || (n.type === "mdxJsxFlowElement" && n.name === "h2");

function text(n: Node): string {
  if (n.type === "text") return n.value ?? "";
  return (n.children ?? []).map(text).join("");
}

const PROSE = new Set(["p", "ul", "ol", "blockquote", "table"]);

function hasProse(n: Node): boolean {
  if (n.type === "element" && PROSE.has(n.tagName ?? "") && text(n).trim()) return true;
  return (n.children ?? []).some(hasProse);
}

export function slugify(s: string) {
  return (
    s
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "chapter"
  );
}

export default function rehypeChapters(options: { collect: Chapter[] }) {
  return (tree: Node) => {
    const groups: { title: string; nodes: Node[] }[] = [];
    for (const child of tree.children ?? []) {
      if (isH2(child)) groups.push({ title: text(child).replace(/\s+/g, " ").trim(), nodes: [child] });
      else if (groups.length) groups[groups.length - 1].nodes.push(child);
      else if (child.type !== "text" || child.value?.trim()) groups.push({ title: "Introduction", nodes: [child] });
      else continue;
    }

    // An intro with no prose (e.g. only videos) joins the first real chapter.
    if (groups.length > 1 && groups[0].title === "Introduction" && !groups[0].nodes.some(hasProse)) {
      const [intro, first] = groups.splice(0, 2);
      groups.unshift({ title: first.title, nodes: [...intro.nodes, ...first.nodes] });
    }

    const used = new Set<string>();
    tree.children = groups.map((g) => {
      let id = slugify(g.title);
      for (let i = 2; used.has(id); i++) id = `${slugify(g.title)}-${i}`;
      used.add(id);
      options.collect.push({ id, title: g.title });
      return {
        type: "element",
        tagName: "section",
        properties: { id, dataChapter: "", className: ["scroll-mt-24"] },
        children: g.nodes,
      };
    });
  };
}
