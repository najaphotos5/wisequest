/**
 * Runs after `next build` (npm postbuild). GitHub Pages can't do server
 * redirects, so for every old WordPress path in lib/redirects.ts this writes
 * out/<old>/index.html that forwards visitors (and search engines) to the new URL.
 */
import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { OLD_TO_NEW } from "../lib/redirects";

const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const site = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://wisequest.org").replace(/\/$/, "");
const withSlash = (p: string) => (p.endsWith("/") ? p : `${p}/`);

const page = (to: string) => {
  const href = `${base}${withSlash(to)}`;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Redirecting…</title>
<meta name="robots" content="noindex"><link rel="canonical" href="${site}${withSlash(to)}">
<meta http-equiv="refresh" content="0; url=${href}">
<script>location.replace(${JSON.stringify(href)} + location.search + location.hash)</script>
</head><body><p>This page has moved to <a href="${href}">${href}</a>.</p></body></html>
`;
};

async function main() {
  let written = 0;
  for (const [from, to] of Object.entries(OLD_TO_NEW)) {
    if (from === "/" || from === to) continue;
    const file = path.join("out", from, "index.html");
    if (existsSync(file)) continue; // never overwrite a real page
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, page(to));
    written++;
  }
  console.log(`Wrote ${written} redirect pages`);
}

main();
