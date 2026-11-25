/**
 * Site version in the form vXX.XX.XX (major.minor.patch, each two digits, zero-padded).
 * Older versions (up to v01.20.009) used a three-digit patch; they still parse.
 *
 *   npm run version:bump -- patch "Fixed a typo on the Quran page"
 *   npm run version:bump -- minor "Added a Ramadan Q&A page"
 *   npm run version:bump -- major "Redesigned the site"
 *   npm run version:show
 *
 * Updates VERSION and adds an entry at the top of CHANGELOG.md.
 * Git tags are created automatically by the deploy workflow.
 */
import { readFileSync, writeFileSync } from "node:fs";

type Part = "major" | "minor" | "patch";
const LIMITS: Record<Part, number> = { major: 99, minor: 99, patch: 99 };

export function parse(v: string) {
  const m = v.trim().match(/^v(\d{2})\.(\d{2})\.(\d{2,3})$/);
  if (!m) throw new Error(`Invalid version "${v.trim()}" (expected vXX.XX.XX)`);
  return { major: +m[1], minor: +m[2], patch: +m[3] };
}

export function format({ major, minor, patch }: Record<Part, number>) {
  return `v${String(major).padStart(2, "0")}.${String(minor).padStart(2, "0")}.${String(patch).padStart(2, "0")}`;
}

export function bump(v: string, part: Part) {
  const n = parse(v);
  if (part === "major") return format({ major: n.major + 1, minor: 0, patch: 0 });
  if (part === "minor") return format({ ...n, minor: n.minor + 1, patch: 0 });
  return format({ ...n, patch: n.patch + 1 });
}

function main() {
  const [cmd, summary] = process.argv.slice(2);
  const current = readFileSync("VERSION", "utf8").trim();
  parse(current);

  if (!cmd || cmd === "show") {
    console.log(current);
    return;
  }
  if (!(cmd in LIMITS)) throw new Error(`Usage: version.ts <patch|minor|major|show> "summary"`);
  if (!summary?.trim()) throw new Error("Add a one-line summary of the change.");

  const next = bump(current, cmd as Part);
  const n = parse(next);
  (Object.keys(LIMITS) as Part[]).forEach((p) => {
    if (n[p] > LIMITS[p]) throw new Error(`${p} would exceed ${LIMITS[p]}; bump the next part up instead.`);
  });

  writeFileSync("VERSION", `${next}\n`);
  const date = new Date().toISOString().slice(0, 10);
  const log = readFileSync("CHANGELOG.md", "utf8");
  const marker = "<!-- entries -->";
  writeFileSync("CHANGELOG.md", log.replace(marker, `${marker}\n\n## ${next} — ${date} (${cmd})\n\n- ${summary.trim()}`));
  console.log(`${current} → ${next}`);
}

main();
