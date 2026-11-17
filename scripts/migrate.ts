/**
 * Converts the scraped WordPress Markdown in content/_raw into cleaned MDX in
 * content/pages, following the new information architecture in ROUTES.
 * Hand-written pages (home, become-muslim, contact, …) live in content/pages
 * too but are NOT listed here, so this script never overwrites them.
 *
 * Usage: npm run migrate
 */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import { OLD_TO_NEW } from "../lib/redirects";

const RAW = path.join(process.cwd(), "content/_raw");
const OUT = path.join(process.cwd(), "content/pages");
const YT_CACHE = path.join(RAW, "_youtube.json");

type Route = { raw: string; slug: string; title: string; description: string; section: string };

/** Auto-migrated pages: raw WordPress slug → new route. */
const ROUTES: Route[] = [
  { raw: "purpose-of-life", slug: "purpose-of-life", section: "Start Here", title: "Discovering Your Purpose in Life", description: "Who are we, why are we here, and what happens next? Reflections from the Quran on the meaning of life." },
  { raw: "quran", slug: "learn/quran", section: "Learn", title: "The Quran: Proof of Divine Revelation", description: "What the Quran is, how it was preserved, five reasons it is from God, and where to read or listen to it for free." },
  { raw: "muhammad", slug: "learn/muhammad", section: "Learn", title: "Prophet Muhammad ﷺ", description: "Who was Prophet Muhammad ﷺ? His life, character, forgiveness, and what historians have said about him." },
  { raw: "understanding-the-mercy-of-prophet-muhammad-pbuh", slug: "learn/muhammad/teachings", section: "Learn", title: "Teachings of Prophet Muhammad ﷺ", description: "Sample teachings of the Prophet ﷺ on mercy, love, community, charity, character, the environment, and family." },
  { raw: "jesus", slug: "learn/jesus", section: "Learn", title: "Jesus in Islam and Christianity", description: "How Muslims see Jesus (peace be upon him): a mighty messenger of God, born of the Virgin Mary." },
  { raw: "women-in-islam", slug: "learn/women", section: "Learn", title: "Women in Islam", description: "Equal reward, equal accountability, and the honored place of mothers, daughters, and wives in Islam." },
  { raw: "history", slug: "learn/history", section: "Learn", title: "History", description: "Talks and reading on history, including the Hundred Years' War on Palestine." },
  { raw: "ai", slug: "learn/ai-insights", section: "Learn", title: "AI Insights", description: "Video commentary exploring questions about God, religion, and Islam through AI analysis." },
  { raw: "answering-dr-todd-phillips-why-god-does-not-allow-us-to-see-him-in-this-life", slug: "learn/why-cant-we-see-god", section: "Learn", title: "Why Doesn't God Let Us See Him in This Life?", description: "A response to Dr. Todd Phillips on why God remains unseen in this life." },
  { raw: "peace", slug: "learn/palestine", section: "Learn", title: "Palestine: The Other Side of the News", description: "Perspectives and sources on Palestine that rarely reach mainstream media." },
  { raw: "new-muslims-stories", slug: "stories", section: "Stories", title: "From Doubt to Faith", description: "Pastors, priests, and people from every walk of life share how they discovered Islam." },
  { raw: "salah-prayer-guide", slug: "new-muslims/how-to-pray", section: "New Muslims", title: "How to Pray (Salah)", description: "A step-by-step prayer booklet and apps to help you learn the five daily prayers." },
  { raw: "handouts-quran-101", slug: "local/quran-101/handouts", section: "Local", title: "Quran 101 Handouts", description: "Session handouts from our weekly Quran 101 gatherings." },
  { raw: "daees-resources", slug: "get-involved/dawah-toolkit", section: "Get Involved", title: "Dawah Volunteer Toolkit", description: "Handbooks, signs, and handouts for volunteers sharing the message of Islam." },
];

type Question = { start: string; slug: string; title: string; category: string; description: string };

/** The single long WordPress Q&A page, split into one page per question. */
const QUESTIONS: Question[] = [
  { start: "Is this life like a dream?", slug: "is-this-life-like-a-dream", category: "Life & purpose", title: "Is this life like a dream?", description: "Why Islam teaches that this worldly life is brief compared to the eternal Hereafter." },
  { start: "How is it that we attain inner peace", slug: "how-to-find-inner-peace", category: "Life & purpose", title: "How do we find inner peace?", description: "Five steps toward tranquility: knowing God, understanding life, remembrance, gratitude, and contentment." },
  { start: "**Does God Care about us?**", slug: "does-god-care-about-us", category: "God", title: "Does God care about us? Does He love us?", description: "Al-Wadud, the Most Loving: how God shows His love and why His door is always open." },
  { start: "## Is this life a punishment", slug: "is-life-a-punishment-for-original-sin", category: "Sin & forgiveness", title: "Is this life a punishment for the sin of Adam?", description: "Islam teaches individual accountability: no soul bears the burden of another." },
  { start: "## Why there’s Sufferings?", slug: "why-is-there-suffering", category: "God", title: "Why is there suffering?", description: "Free will, growth through hardship, and why a world without pain would be absurd." },
  { start: "## Does God forgives sins without Blood", slug: "does-god-forgive-without-blood-sacrifice", category: "Sin & forgiveness", title: "Does God forgive sins without a blood sacrifice?", description: "Yes. The Quran describes a God who forgives all sins for those who sincerely repent." },
];
const QA_END = "## More Questions?";

const WORDS: [RegExp, string][] = [
  [/\bMohammad\b/g, "Muhammad"],
  [/\bMohammed\b/g, "Muhammad"],
  [/Qur[’']an/g, "Quran"],
  [/\bThe Prophet {2,}said/g, "The Prophet ﷺ said"],
  [/\bPBUH\b/g, "ﷺ"],
  [/\bdiscivered\b/gi, "discovered"],
  [/\bcausalities\b/g, "casualties"],
  [/\bAmharI\b/g, "Amharic"],
  [/\bmush more\b/g, "much more"],
];

function rewriteLinks(md: string) {
  return md.replace(/\]\((https?:\/\/(?:www\.)?(?:wisequest\.org|wisequest\.home\.blog)(\/[^)\s]*)?)\)/g, (m, _url, p = "/") => {
    const key = p.replace(/\/+$/, "") || "/";
    return OLD_TO_NEW[key] ? `](${OLD_TO_NEW[key]})` : m;
  });
}

function prettyName(name: string, href: string) {
  const n = name.replace(/\\_/g, " ").replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
  if (!n || /^wp \d+$|^wp-\d+/.test(n) || /^\d+$/.test(n)) return path.basename(href).replace(/\.\w+$/, "").replace(/[-_]/g, " ");
  return n;
}

function clean(md: string) {
  let s = md;
  // Decorative stock photos + their credit lines.
  s = s.replace(/!\[[^\]]*\]\([^)]+\)\s*\n+\s*Photo by [^\n]*Pexels[^\n]*\n?/g, "");
  s = s.replace(/^Photo by [^\n]*Pexels[^\n]*$/gm, "");
  s = s.replace(/\[!\[[^\]]*\]\([^)]*pexels-photo[^)]*\)\]\([^)]*\)/g, "");
  s = s.replace(/!\[[^\]]*\]\([^)]*pexels-photo[^)]*\)/g, "");
  // "[Name](file)[Download](file)" pairs → one download card.
  s = s.replace(/\[([^\]]*)\]\(([^)]+)\)\s*\[Download\]\(\2\)/g, (_, name, href) => `<Download href="${href}" title="${prettyName(name, href).replace(/"/g, "'")}" />`);
  // Headings: unwrap **bold** / _italic_, demote body H1s, drop empty/dot headings.
  s = s.replace(/^(#{1,6})\s+(.*)$/gm, (_, h: string, text: string) => {
    const t = text.replace(/\*\*|__|(?<!\w)_|_(?!\w)/g, "").replace(/\s+$/, "").trim();
    if (!t || /^[.\s]+$/.test(t)) return "";
    return `${h.length === 1 ? "##" : h} ${t}`;
  });
  s = s.replace(/^[.\s]+$/gm, ""); // lone dots
  s = s.replace(/(?<!!)\[\]\([^)]*\)/g, ""); // empty links
  s = s.replace(/^\s*•\s*/gm, "- "); // typed bullets
  s = s.replace(/\\\*\\\*/g, "");
  for (const [re, to] of WORDS) s = s.replace(re, to);
  s = rewriteLinks(s);
  // MDX safety: escape braces and stray "<" that aren't our components.
  s = s.replace(/[{}]/g, (c) => (c === "{" ? "&#123;" : "&#125;"));
  s = s.replace(/<(?!\/?(YouTube|VideoEmbed|Download|VideoGrid)\b)/g, "&lt;");
  s = s.replace(/^\* \* \*$/gm, "---");
  s = groupVideos(s);
  return s.replace(/\n{3,}/g, "\n\n").trim().replace(/^(---\s*)+/, "").replace(/(\s*---)+$/, "");
}

/** Wrap runs of 2+ videos (separated only by blanks/rules) in <VideoGrid>. */
function groupVideos(md: string) {
  const lines = md.split("\n");
  const out: string[] = [];
  let run: string[] = [];
  const flush = () => {
    if (run.length > 1) out.push("", "<VideoGrid>", ...run, "</VideoGrid>", "");
    else out.push(...run);
    run = [];
  };
  for (const line of lines) {
    if (/^<(YouTube|VideoEmbed) /.test(line)) run.push(line);
    else if (run.length && (/^\s*$/.test(line) || line === "---")) continue;
    else {
      flush();
      out.push(line);
    }
  }
  flush();
  return out.join("\n");
}

/** Add accessible titles to YouTube embeds via oEmbed (cached). */
async function titleVideos(md: string, cache: Record<string, string>) {
  const ids = [...md.matchAll(/<YouTube id="([\w-]+)" \/>/g)].map((m) => m[1]);
  for (const id of ids) {
    if (cache[id] !== undefined) continue;
    try {
      const res = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${id}&format=json`);
      cache[id] = res.ok ? ((await res.json()) as { title: string }).title : "";
    } catch {
      cache[id] = "";
    }
  }
  return md.replace(/<YouTube id="([\w-]+)" \/>/g, (m, id) =>
    cache[id] ? `<YouTube id="${id}" title="${cache[id].replace(/"/g, "'").replace(/[{}<>]/g, "")}" />` : m,
  );
}

/** Files marked `curated: true` have been hand-edited and are never overwritten. */
async function isCurated(file: string) {
  const src = await readFile(file, "utf8").catch(() => "");
  return /^curated: true$/m.test(src);
}

export async function readRaw(slug: string) {
  return matter(await readFile(path.join(RAW, `${slug}.md`), "utf8"));
}

async function main() {
  const cache: Record<string, string> = JSON.parse(await readFile(YT_CACHE, "utf8").catch(() => "{}"));
  for (const r of ROUTES) {
    const raw = await readRaw(r.raw);
    const body = await titleVideos(clean(raw.content), cache);
    const fm = matter.stringify(`${body}\n`, {
      title: r.title,
      description: r.description,
      section: r.section,
      updated: String(raw.data.modified).slice(0, 10),
      migratedFrom: raw.data.oldUrl,
    });
    const dest = path.join(OUT, `${r.slug}.mdx`);
    if (await isCurated(dest)) continue;
    await mkdir(path.dirname(dest), { recursive: true });
    await writeFile(dest, fm);
    console.log(`${r.raw} → ${r.slug}`);
  }
  await migrateQa(cache);
  await titleHandwritten(cache);
  await writeFile(YT_CACHE, JSON.stringify(cache, null, 2));
}

async function migrateQa(cache: Record<string, string>) {
  const raw = await readRaw("qa");
  const text = raw.content;
  const starts = QUESTIONS.map((q) => text.indexOf(q.start));
  const end = text.indexOf(QA_END);
  await mkdir(path.join(process.cwd(), "content/qa"), { recursive: true });
  for (const [i, q] of QUESTIONS.entries()) {
    if (starts[i] < 0) throw new Error(`Q&A marker not found: ${q.start}`);
    const dest = path.join(process.cwd(), "content/qa", `${q.slug}.mdx`);
    if (await isCurated(dest)) continue;
    const chunk = text.slice(starts[i] + q.start.length, starts[i + 1] ?? end);
    const body = (await titleVideos(clean(chunk), cache)).replace(/^## Does God love us\?$/m, "## Does God love us?");
    const fm = matter.stringify(`${body}\n`, {
      title: q.title,
      description: q.description,
      category: q.category,
      updated: String(raw.data.modified).slice(0, 10),
    });
    await writeFile(dest, fm);
    console.log(`qa → qa/${q.slug}`);
  }
}

/** Fill in missing titles on YouTube embeds in hand-written pages. */
async function titleHandwritten(cache: Record<string, string>) {
  const { readdir } = await import("node:fs/promises");
  const files = (await readdir(OUT, { recursive: true })).filter((f) => f.endsWith(".mdx"));
  for (const f of files) {
    const file = path.join(OUT, f);
    const src = await readFile(file, "utf8");
    const next = await titleVideos(src, cache);
    if (next !== src) await writeFile(file, next);
  }
}

if (process.argv[1]?.endsWith("migrate.ts")) main();
