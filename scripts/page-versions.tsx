/**
 * Runs after `next build` (npm postbuild). For dev mode's "older versions" switcher
 * (components/DevMode.tsx): renders every earlier version of each article page
 * (content/pages/**.mdx and content/qa/*.mdx) from git history, using today's components.
 *
 *   out/dev-data/versions/index.json        { "/path/": [{ sha, version, date, subject, title }] }  newest first, current version excluded
 *   out/dev-data/versions/<sha>/<key>.html   the page body at that version (key = path with "/" → "_")
 *
 * Only versions that actually changed what the page shows are kept (identical renders are skipped).
 * Pages built from app/ (homepage, Learn, Local…) aren't covered: their old code can't be rendered on its own.
 */
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import * as runtime from "react/jsx-runtime";
import { renderToStaticMarkup } from "react-dom/server";
import remarkGfm from "remark-gfm";
import { mdxComponents } from "../components/mdx";

const ROOT = process.cwd();
const DEST = path.join(ROOT, "out", "dev-data", "versions");
const MAX_PER_PAGE = 25;

const git = (...args: string[]) => execFileSync("git", args, { cwd: ROOT, encoding: "utf8", maxBuffer: 64 << 20, stdio: ["ignore", "pipe", "ignore"] });

function walk(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(path.join(dir, e.name)) : e.name.endsWith(".mdx") ? [path.join(dir, e.name)] : [],
  );
}

function urlFor(file: string) {
  const rel = path.relative(ROOT, file).replace(/\\/g, "/");
  if (rel.startsWith("content/qa/")) return `/qa/${rel.slice("content/qa/".length, -4)}/`;
  return `/${rel.slice("content/pages/".length, -4)}/`;
}

// @mdx-js/mdx is ESM-only; load it with a real dynamic import (this script runs as CommonJS).
type Evaluate = typeof import("@mdx-js/mdx").evaluate;
let evaluate: Evaluate;
const esmImport = new Function("s", "return import(s)") as (s: string) => Promise<{ evaluate: Evaluate }>;

async function render(source: string) {
  evaluate ??= (await esmImport("@mdx-js/mdx")).evaluate;
  const { data, content } = matter(source);
  const { default: Content } = await evaluate(content, { ...runtime, remarkPlugins: [remarkGfm] } as Parameters<Evaluate>[1]);
  const points = Array.isArray(data.summary) ? (data.summary as unknown[]).map(String) : [];
  const html = renderToStaticMarkup(
    <>
      {points.length > 0 && (
        <aside className="wq-dev-oldver-points">
          <strong>Key points</strong>
          <ul>{points.map((p) => <li key={p}>{p}</li>)}</ul>
        </aside>
      )}
      <Content components={mdxComponents} />
    </>,
  );
  return { html, title: typeof data.title === "string" ? data.title : "" };
}

const hash = (s: string) => createHash("sha1").update(s).digest("hex");

async function main() {
  try {
    git("rev-parse", "HEAD");
  } catch {
    console.log("page-versions: not a git checkout, skipped");
    return;
  }
  fs.rmSync(DEST, { recursive: true, force: true });
  fs.mkdirSync(DEST, { recursive: true });

  const index: Record<string, { sha: string; version: string; date: string; subject: string; title: string }[]> = {};
  let files = 0;
  for (const file of [...walk(path.join(ROOT, "content/pages")), ...walk(path.join(ROOT, "content/qa"))]) {
    const url = urlFor(file);
    const rel = path.relative(ROOT, file).replace(/\\/g, "/");
    // Commits that touched this file (following renames): "sha|date|subject|path-at-that-commit"
    const log = git("log", "--follow", "--format=@@%h|%cs|%s", "--name-only", "--", rel)
      .split("@@")
      .filter(Boolean)
      .map((block) => {
        const [head, ...names] = block.trim().split("\n");
        const [sha, date, ...subj] = head.split("|");
        return { sha, date, subject: subj.join("|"), at: names.filter(Boolean).pop() ?? rel };
      });
    if (log.length < 2) continue;

    let previous: string;
    try {
      previous = hash((await render(fs.readFileSync(file, "utf8"))).html); // what the page shows now
    } catch {
      continue;
    }
    const versions: (typeof index)[string] = [];
    for (const c of log) {
      if (versions.length >= MAX_PER_PAGE) break;
      let src: string;
      try {
        src = git("show", `${c.sha}:${c.at}`);
      } catch {
        continue; // file deleted in this commit
      }
      let out: { html: string; title: string };
      try {
        out = await render(src);
      } catch {
        continue; // old syntax no longer renders
      }
      const h = hash(out.html);
      if (h === previous) continue; // looks the same as the newer version
      previous = h;
      const version = c.subject.match(/^v(\d+\.\d+\.\d+)/)?.[1] ?? (() => {
        try {
          return git("show", `${c.sha}:VERSION`).trim();
        } catch {
          return "";
        }
      })();
      // The snapshot shows the page as it was BEFORE the next newer change, i.e. as of commit c.
      const key = url.replace(/\//g, "_");
      fs.mkdirSync(path.join(DEST, c.sha), { recursive: true });
      fs.writeFileSync(path.join(DEST, c.sha, `${key}.html`), out.html);
      versions.push({ sha: c.sha, version, date: c.date, subject: c.subject.replace(/^v[\d.]+:\s*/, ""), title: out.title });
      files++;
    }
    if (versions.length) index[url] = versions;
  }
  fs.writeFileSync(path.join(DEST, "index.json"), JSON.stringify(index));
  console.log(`page-versions: ${files} older versions for ${Object.keys(index).length} pages`);
}

main().catch((e) => {
  console.error("page-versions failed (dev mode only, build continues):", e);
});
