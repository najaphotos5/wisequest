/**
 * Compare a page on the current site with the ORIGINAL WordPress site (branch `original-site`).
 *
 *   npm run original -- /learn/jesus/          old URL(s) + a summary of what changed
 *   npm run original -- /learn/jesus/ --full   also the full paragraph-by-paragraph diff
 *   npm run original -- jesus                  an old slug works too
 *   npm run original -- --list                 every old page and where it lives now
 *
 * Read-only: reads the snapshot with `git show original-site:…` (fetches the branch if it isn't local).
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

type Entry = { slug: string; kind: string; title: string; oldUrl: string; oldPath: string; newPath: string | null; modified: string | null; files: { html: string; markdown: string | null; screenshot: string } };
const ROOT = process.cwd();
const git = (...a: string[]) => execFileSync("git", a, { cwd: ROOT, encoding: "utf8", maxBuffer: 64 << 20, stdio: ["ignore", "pipe", "pipe"] });

function show(file: string) {
  try {
    return git("show", `original-site:${file}`);
  } catch {
    try {
      git("fetch", "-q", "origin", "original-site:original-site");
      return git("show", `original-site:${file}`);
    } catch {
      console.error("The `original-site` branch is not available (git fetch origin original-site).");
      process.exit(1);
    }
  }
}

const norm = (p: string) => ("/" + p.replace(/^https?:\/\/[^/]+/, "").replace(/^\/+|\/+$/g, "")).replace(/^\/$/, "/");

/** Plain paragraphs from Markdown/MDX: no front matter, components, links or formatting. */
function paragraphs(src: string) {
  return src
    .replace(/^---[\s\S]*?\n---\n/, "")
    .replace(/<[A-Z][\s\S]*?\/>/g, "") // self-closing MDX components
    .replace(/<\/?[A-Za-z][^>]*>/g, "") // other tags (keep inner text)
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[*_`>#]+/g, "")
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\s+/g, " ").replace(/^[-\d.)\s]+/, "").trim())
    .filter((p) => p.length > 2);
}
const key = (p: string) => p.toLowerCase().replace(/[‘’'“”"]/g, "").replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ").trim();
const words = (ps: string[]) => ps.join(" ").split(/\s+/).filter(Boolean).length;
const headings = (src: string) => [...src.matchAll(/^#{1,4}\s+(.+)$/gm)].map((m) => m[1].replace(/[*_`]/g, "").trim());

function currentFile(newPath: string) {
  const p = newPath.replace(/^\/|\/$/g, "");
  for (const f of [`content/pages/${p}.mdx`, `content/pages/${p}/index.mdx`, `content/qa/${p.replace(/^qa\//, "")}.mdx`]) if (fs.existsSync(path.join(ROOT, f))) return f;
  return null;
}

function main() {
  const args = process.argv.slice(2);
  const index = JSON.parse(show("index.json")) as Entry[];
  if (args.includes("--list") || !args.length) {
    for (const e of index) console.log(`${e.oldPath.padEnd(60)} → ${e.newPath ?? "(not mapped)"}   ${e.title}`);
    return;
  }
  const target = args.find((a) => !a.startsWith("--"))!;
  const full = args.includes("--full");
  const t = norm(target);
  const matches = index.filter((e) => (e.newPath && norm(e.newPath) === t) || e.slug === target.replace(/\//g, "") || norm(e.oldPath) === t);
  if (!matches.length) {
    console.log(`No original page maps to ${t}. It is new since the rebuild (or try --list).`);
    return;
  }
  const cur = matches[0].newPath ? currentFile(matches[0].newPath) : null;
  const curSrc = cur ? fs.readFileSync(path.join(ROOT, cur), "utf8") : "";
  const now = paragraphs(curSrc);
  console.log(`Current page: https://wisequest.org${matches[0].newPath ?? t}${cur ? `  (${cur})` : "  (built from app code, so compare the screenshots)"}`);
  for (const e of matches) {
    const old = e.files.markdown ? show(e.files.markdown) : "";
    const before = paragraphs(old);
    console.log(`\nOriginal: ${e.title}\n  ${e.oldUrl}  (last edited ${e.modified?.slice(0, 10) ?? "?"})`);
    console.log(`  Snapshot: git show original-site:${e.files.markdown ?? e.files.html}   ·   screenshot: original-site:${e.files.screenshot}`);
    if (!cur || !old) continue;
    const oldKeys = new Set(before.map(key));
    const newKeys = new Set(now.map(key));
    const kept = before.filter((p) => newKeys.has(key(p))).length;
    const removed = before.filter((p) => !newKeys.has(key(p)));
    const added = now.filter((p) => !oldKeys.has(key(p)));
    const hOld = headings(old), hNew = headings(curSrc);
    console.log(`  Words: ${words(before)} → ${words(now)}   Paragraphs: ${before.length} → ${now.length} (${kept} unchanged, ${removed.length} removed or reworded, ${added.length} new or reworded)`);
    const newH = hNew.filter((h) => !hOld.some((o) => key(o) === key(h)));
    const goneH = hOld.filter((h) => !hNew.some((n) => key(n) === key(h)));
    if (newH.length) console.log(`  New sections: ${newH.slice(0, 12).join(" · ")}${newH.length > 12 ? " …" : ""}`);
    if (goneH.length) console.log(`  Sections no longer there: ${goneH.slice(0, 12).join(" · ")}${goneH.length > 12 ? " …" : ""}`);
    if (full) {
      const dir = fs.mkdtempSync(path.join(os.tmpdir(), "wq-orig-"));
      fs.writeFileSync(path.join(dir, "original.txt"), before.join("\n\n") + "\n");
      fs.writeFileSync(path.join(dir, "current.txt"), now.join("\n\n") + "\n");
      try {
        execFileSync("diff", ["-u", "--label", `original ${e.oldPath}`, "--label", `current ${matches[0].newPath}`, path.join(dir, "original.txt"), path.join(dir, "current.txt")], { stdio: "inherit" });
      } catch {
        /* diff exits 1 when files differ */
      }
      fs.rmSync(dir, { recursive: true, force: true });
    }
  }
}

main();
