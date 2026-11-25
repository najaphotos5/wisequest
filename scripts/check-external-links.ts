/**
 * Finds links to OTHER websites that no longer work (the page is gone: 404/410).
 *   npm run check-external            human-readable list
 *   npm run check-external -- --json  { checked, unknown, dead: [{ page, file, line, url, status }] }
 *
 * Scans markdown links and href="..." in content/pages and content/qa. Skips wisequest.org itself
 * and video sites (see check-videos). Read-only. A link counts as dead only when the site clearly
 * says the page doesn't exist (404 or 410). Network errors, timeouts and blocks are "unknown",
 * because some networks (e.g. cloud sandboxes) block many sites.
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const SKIP = /(^|\.)(wisequest\.org|youtube\.com|youtu\.be|youtube-nocookie\.com|vimeo\.com|videopress\.com|video\.wordpress\.com|localhost)$/i;
type Found = { page: string; file: string; line: number; url: string };

function walk(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(path.join(dir, e.name)) : e.name.endsWith(".mdx") ? [path.join(dir, e.name)] : [],
  );
}

const pageUrl = (rel: string) => (rel.startsWith("content/qa/") ? `/qa/${rel.slice(11, -4)}/` : `/${rel.slice(14, -4)}/`);

function collect(): Found[] {
  const out: Found[] = [];
  for (const file of [...walk(path.join(ROOT, "content/pages")), ...walk(path.join(ROOT, "content/qa"))]) {
    const rel = path.relative(ROOT, file).replace(/\\/g, "/");
    fs.readFileSync(file, "utf8").split("\n").forEach((text, i) => {
      for (const m of text.matchAll(/\]\((https?:\/\/[^)\s]+)\)|href="(https?:\/\/[^"]+)"/g)) {
        const url = (m[1] ?? m[2]).replace(/[.,;]+$/, "");
        let host = "";
        try {
          host = new URL(url).hostname;
        } catch {
          continue;
        }
        if (!SKIP.test(host)) out.push({ page: pageUrl(rel), file: rel, line: i + 1, url });
      }
    });
  }
  return out;
}

const BROWSER_UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36";

async function status(url: string): Promise<number | null> {
  const s = await statusOnce(url);
  // Some sites (e.g. Amazon short links) answer 404 to anything that isn't a browser: confirm with a full GET.
  if (s === 404 || s === 410) {
    try {
      const r = await fetch(url, { redirect: "follow", signal: AbortSignal.timeout(15000), headers: { "User-Agent": BROWSER_UA, Accept: "text/html", "Accept-Language": "en" } });
      return r.status;
    } catch {
      return null;
    }
  }
  return s;
}

async function statusOnce(url: string): Promise<number | null> {
  for (const method of ["HEAD", "GET"]) {
    try {
      const r = await fetch(url, {
        method,
        redirect: "follow",
        signal: AbortSignal.timeout(12000),
        headers: { "User-Agent": BROWSER_UA, "Accept-Language": "en" },
      });
      // Some servers reject HEAD (405/403/400); retry those with GET.
      if (method === "HEAD" && [400, 403, 405, 501].includes(r.status)) continue;
      return r.status;
    } catch {
      if (method === "GET") return null;
    }
  }
  return null;
}

async function main() {
  const json = process.argv.includes("--json");
  const links = collect();
  const unique = new Map<string, Found[]>();
  for (const l of links) unique.set(l.url, [...(unique.get(l.url) ?? []), l]);

  const dead: (Found & { status: number })[] = [];
  let unknown = 0;
  const entries = [...unique.entries()];
  for (let i = 0; i < entries.length; i += 8) {
    await Promise.all(
      entries.slice(i, i + 8).map(async ([url, uses]) => {
        const s = await status(url);
        if (s === 404 || s === 410) dead.push(...uses.map((u) => ({ ...u, status: s })));
        else if (s === null || s >= 500 || s === 403 || s === 429) unknown++;
      }),
    );
  }
  if (json) {
    console.log(JSON.stringify({ checked: unique.size, unknown, dead }, null, 2));
    return;
  }
  console.log(`Checked ${unique.size} outside links (${unknown} couldn't be checked).`);
  if (unknown > unique.size / 2) console.log("⚠ Most links couldn't be checked: outside sites are probably blocked from this network.");
  else if (!dead.length) console.log("No dead outside links found ✓");
  for (const d of dead) console.log(`✖ ${d.page}  ${d.url}  (${d.status})  (${d.file}:${d.line})`);
}

main();
