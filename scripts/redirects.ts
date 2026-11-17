/**
 * Writes host redirect files from lib/redirects.ts so old WordPress URLs keep
 * working: public/_redirects (Netlify / Cloudflare Pages) and vercel.json.
 */
import { writeFile } from "node:fs/promises";
import { OLD_TO_NEW } from "../lib/redirects";

const rules = Object.entries(OLD_TO_NEW).filter(([from, to]) => from !== "/" && from !== to);
const withSlash = (p: string) => (p === "/" ? p : `${p}/`);

async function main() {
  await writeFile("public/_redirects", rules.flatMap(([from, to]) => [`${from} ${withSlash(to)} 301`, `${from}/ ${withSlash(to)} 301`]).join("\n") + "\n");
  await writeFile(
    "vercel.json",
  JSON.stringify({ trailingSlash: true, redirects: rules.map(([from, to]) => ({ source: from, destination: withSlash(to), permanent: true })) }, null, 2) + "\n",
);
  console.log(`Wrote ${rules.length} redirects`);
}

main();
