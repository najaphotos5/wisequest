/** Checks every internal link and asset in the static export (out/) resolves to a file. */
import fs from "node:fs";
import path from "node:path";

const OUT = path.join(process.cwd(), "out");
const htmlFiles = (fs.readdirSync(OUT, { recursive: true }) as string[]).filter((f) => f.endsWith(".html"));
const broken = new Map<string, Set<string>>();

for (const file of htmlFiles) {
  const html = fs.readFileSync(path.join(OUT, file), "utf8");
  for (const [, url] of html.matchAll(/(?:href|src)="(\/[^"#?]*)/g)) {
    if (url.startsWith("/_next/")) continue;
    const p = decodeURIComponent(url);
    const candidates = [p, path.join(p, "index.html"), `${p.replace(/\/$/, "")}.html`];
    if (!candidates.some((c) => fs.existsSync(path.join(OUT, c)) && fs.statSync(path.join(OUT, c)).isFile())) {
      if (!broken.has(p)) broken.set(p, new Set());
      broken.get(p)!.add(file);
    }
  }
}

for (const [url, files] of broken) console.log(`BROKEN ${url}  ← ${[...files].slice(0, 3).join(", ")}`);
console.log(`${htmlFiles.length} pages checked, ${broken.size} broken links`);
process.exit(broken.size ? 1 : 0);
