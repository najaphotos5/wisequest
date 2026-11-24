/**
 * Finds embedded videos that no longer exist (deleted, private, or removed from the old WordPress).
 *   npm run check-videos            human-readable list
 *   npm run check-videos -- --json  [{ page, file, line, kind, id, url, reason }]
 *
 * Checks YouTube (<YouTube id>), Vimeo, VideoPress and WordPress video embeds (<VideoEmbed src>)
 * in content/pages and content/qa. Read-only; needs network access to youtube.com, vimeo.com,
 * videopress.com and video.wordpress.com. A video counts as dead only when the service says so
 * clearly ("unavailable", "not found"), never because of a network error.
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
type Found = { page: string; file: string; line: number; kind: string; id: string; url: string; title: string };
type Dead = Found & { reason: string };

function walk(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(path.join(dir, e.name)) : e.name.endsWith(".mdx") ? [path.join(dir, e.name)] : [],
  );
}

function pageUrl(rel: string) {
  return rel.startsWith("content/qa/") ? `/qa/${rel.slice(11, -4)}/` : `/${rel.slice(14, -4)}/`;
}

function collect(): Found[] {
  const out: Found[] = [];
  for (const file of [...walk(path.join(ROOT, "content/pages")), ...walk(path.join(ROOT, "content/qa"))]) {
    const rel = path.relative(ROOT, file).replace(/\\/g, "/");
    fs.readFileSync(file, "utf8").split("\n").forEach((text, i) => {
      const base = { page: pageUrl(rel), file: rel, line: i + 1 };
      for (const m of text.matchAll(/<YouTube\s+id="([^"]+)"(?:\s+title="([^"]*)")?/g))
        out.push({ ...base, kind: "YouTube", id: m[1], url: `https://www.youtube.com/watch?v=${m[1]}`, title: m[2] ?? "" });
      for (const m of text.matchAll(/<VideoEmbed\s+src="([^"]+)"/g)) {
        const u = m[1];
        const vimeo = u.match(/vimeo\.com\/video\/(\d+)/);
        const vp = u.match(/videopress\.com\/(?:v|embed)\/(\w+)/) ?? u.match(/video\.wordpress\.com\/(?:v|embed)\/(\w+)/);
        if (vimeo) out.push({ ...base, kind: "Vimeo", id: vimeo[1], url: `https://vimeo.com/${vimeo[1]}`, title: "" });
        else if (vp) out.push({ ...base, kind: "VideoPress", id: vp[1], url: u, title: "" });
      }
    });
  }
  return out;
}

async function get(url: string) {
  const r = await fetch(url, { redirect: "follow", headers: { "User-Agent": "Mozilla/5.0 (WiseQuest link check)", "Accept-Language": "en" } });
  return { status: r.status, text: await r.text() };
}

/** Returns a reason when the video is clearly gone, "" when it's fine, null when we couldn't tell. */
async function check(v: Found): Promise<string | null> {
  try {
    if (v.kind === "YouTube") {
      const { text } = await get(v.url);
      const s = text.match(/"playabilityStatus":\{"status":"([A-Z_]+)"(?:,"reason":"([^"]*)")?/);
      if (!s) return null;
      if (s[1] === "OK" || s[1] === "LOGIN_REQUIRED" || s[1] === "AGE_CHECK_REQUIRED") return "";
      return s[2] || s[1].toLowerCase();
    }
    if (v.kind === "Vimeo") {
      const { status } = await get(`https://vimeo.com/api/oembed.json?url=${encodeURIComponent(v.url)}`);
      return status === 404 ? "Vimeo: video not found" : status === 200 || status === 403 ? "" : null;
    }
    const api = await get(`https://public-api.wordpress.com/rest/v1.1/videos/${v.id}`);
    if (api.status === 200) return "";
    const page = await get(v.url);
    return /not found|doesn.t exist/i.test(page.text) || api.status === 404 ? "VideoPress: video not found" : null;
  } catch {
    return null;
  }
}

async function main() {
  const json = process.argv.includes("--json");
  const videos = collect();
  const unique = new Map<string, Found[]>();
  for (const v of videos) unique.set(`${v.kind}:${v.id}`, [...(unique.get(`${v.kind}:${v.id}`) ?? []), v]);

  const dead: Dead[] = [];
  let unknown = 0;
  const entries = [...unique.values()];
  for (let i = 0; i < entries.length; i += 8) {
    await Promise.all(
      entries.slice(i, i + 8).map(async (uses) => {
        const reason = await check(uses[0]);
        if (reason === null) unknown++;
        else if (reason) dead.push(...uses.map((u) => ({ ...u, reason })));
      }),
    );
  }
  if (json) {
    console.log(JSON.stringify({ checked: unique.size, unknown, dead }, null, 2));
    return;
  }
  console.log(`Checked ${unique.size} videos (${unknown} couldn't be checked).`);
  if (!dead.length) console.log("All videos still exist ✓");
  for (const d of dead) console.log(`✖ ${d.page}  ${d.kind} ${d.id}${d.title ? ` "${d.title}"` : ""}: ${d.reason}  (${d.file}:${d.line})`);
}

main();
