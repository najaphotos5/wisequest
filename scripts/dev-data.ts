/**
 * Runs after `next build` (npm postbuild). Computes, offline and without any
 * external service, data shown in the hidden dev mode (components/DevMode.tsx):
 *
 *   out/dev-data/scores.json   per-page text quality score (0–10) and overall page score (0–100)
 *   out/dev-data/history.json  per-page change history from git (version + one-line summary)
 *
 * Scores are simple heuristics (readability, length, formatting problems, accessibility,
 * structure, video count, freshness). They are a guide for editors, not a judgment of the
 * religious content.
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const OUT = path.join(process.cwd(), "out");
const DEST = path.join(OUT, "dev-data");

type Issue = string;
type Score = {
  path: string;
  source: string | null;
  words: number;
  sentences: number;
  avgSentence: number;
  readingEase: number;
  textScore: number;
  pageScore: number;
  parts: Record<string, number>;
  issues: Issue[];
};

// Common misspellings seen on the site (and in general). Matched as whole words, case-insensitive.
const MISSPELLINGS = [
  "gramatic", "devine", "mathew", "farwell", "ortodox", "saudia", "discivered", "recieve", "seperate", "occured",
  "definately", "untill", "wich", "teh", "beleive", "existance", "occurence", "acheive", "arguement", "begining",
  "embarass", "goverment", "independant", "neccessary", "noticable", "persue", "publically", "tommorow", "truely", "wierd",
];
const ACRONYMS = new Set(["PBUH", "SAW", "USA", "UK", "PDF", "ICNA", "MP3", "AI", "UN", "AIPAC", "FAQ", "HD", "DNA", "NOTE"]);

function htmlFiles(dir: string): string[] {
  return (fs.readdirSync(dir, { recursive: true }) as string[])
    .filter((f) => f.endsWith("index.html") && !f.startsWith("dev-data"))
    .map((f) => f.split(path.sep).join("/"));
}

function decode(s: string) {
  return s
    .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)));
}

function syllables(word: string) {
  const w = word.toLowerCase().replace(/[^a-z]/g, "");
  if (!w) return 0;
  if (w.length <= 3) return 1;
  const m = w.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, "").replace(/^y/, "").match(/[aeiouy]{1,2}/g);
  return Math.max(1, m ? m.length : 1);
}

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));
const round1 = (n: number) => Math.round(n * 10) / 10;

function sourceFor(route: string, html: string): string | null {
  const info = html.match(/<script type="application\/json" id="wq-page-info">([^<]*)<\/script>/);
  if (info) {
    try {
      return JSON.parse(decode(info[1])).source ?? null;
    } catch {}
  }
  const p = route.replace(/\/$/, "");
  const guess = p === "" ? "app/page.tsx" : `app${p}/page.tsx`;
  return fs.existsSync(guess) ? guess : null;
}

function updatedDate(html: string): string | null {
  const info = html.match(/id="wq-page-info">([^<]*)</);
  if (!info) return null;
  try {
    return JSON.parse(decode(info[1])).meta?.updated ?? null;
  } catch {
    return null;
  }
}

function score(route: string, html: string): Score {
  const issues: Issue[] = [];
  const fullMain = (html.match(/<main[^>]*>([\s\S]*?)<\/main>/) ?? [, html])[1]!;
  // Score the article body only: skip the photo header (ends after the H1 block) and the shared "Your next step" cards.
  const isArticle = /id="wq-page-info"/.test(html);
  let mainHtml = fullMain;
  if (isArticle) {
    const start = fullMain.search(/<\/h1>/);
    const end = fullMain.search(/<section aria-labelledby="next-steps"/);
    mainHtml = fullMain.slice(start > 0 ? fullMain.indexOf("</div>", start) : 0, end > 0 ? end : undefined);
  }
  const noScript = mainHtml.replace(/<(script|style|svg|noscript)[\s\S]*?<\/\1>/g, " ");

  // ----- text -----
  const text = decode(noScript.replace(/<br\s*\/?>/g, "\n").replace(/<\/(p|li|h\d|div|blockquote|figcaption|td)>/g, ".\n").replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
  const words = text.match(/[A-Za-zÀ-ÿ'’-]+/g) ?? [];
  const sentenceList = text.split(/[.!?]+(?=\s|$)/).map((s) => s.trim()).filter((s) => (s.match(/[A-Za-z]+/g) ?? []).length >= 3);
  const sentences = Math.max(1, sentenceList.length);
  const avgSentence = words.length / sentences;
  const syl = words.reduce((n, w) => n + syllables(w), 0);
  const readingEase = words.length ? 206.835 - 1.015 * avgSentence - 84.6 * (syl / Math.max(1, words.length)) : 0;

  let t = 10;
  const pen = (n: number, why: string) => {
    if (n > 0) {
      t -= n;
      issues.push(why);
    }
  };
  if (readingEase < 30) pen(2, `Hard to read (reading ease ${Math.round(readingEase)}; aim for 50+)`);
  else if (readingEase < 45) pen(1, `Fairly hard to read (reading ease ${Math.round(readingEase)}; aim for 50+)`);
  const long = sentenceList.filter((s) => (s.match(/[A-Za-z]+/g) ?? []).length > 35).length;
  if (long) pen(Math.min(1.5, long * 0.3), `${long} very long sentence(s) (over 35 words)`);
  const rawUrls = (text.match(/\bhttps?:\/\/\S+|\bwww\.\S+\.\w+/g) ?? []).length;
  if (rawUrls) pen(Math.min(2, rawUrls * 0.4), `${rawUrls} raw web address(es) shown as text`);
  const clickHere = (text.match(/click (the )?here/gi) ?? []).length;
  if (clickHere) pen(Math.min(1, clickHere * 0.5), `"Click here" link text (${clickHere}×)`);
  const caps = (text.match(/\b[A-Z]{4,}\b/g) ?? []).filter((w) => !ACRONYMS.has(w));
  if (caps.length > 2) pen(Math.min(1.5, caps.length * 0.1), `${caps.length} ALL-CAPS words (e.g. ${[...new Set(caps)].slice(0, 3).join(", ")})`);
  const shouty = (text.match(/[!?]{2,}/g) ?? []).length;
  if (shouty) pen(Math.min(1, shouty * 0.3), `Repeated punctuation ("!!" / "??") ${shouty}×`);
  const misspelled = MISSPELLINGS.filter((w) => new RegExp(`\\b${w}\\b`, "i").test(text));
  if (misspelled.length) pen(Math.min(2, misspelled.length * 0.5), `Possible misspellings: ${misspelled.join(", ")}`);
  const doubled = (text.match(/\b(\w{2,})\s+\1\b/gi) ?? []).filter((d) => !/^(that that|had had)$/i.test(d)).length;
  if (doubled) pen(Math.min(1, doubled * 0.3), `Repeated words (e.g. "the the") ${doubled}×`);
  const fileNames = (text.match(/\b\d{4} \d{2} wp \d{6,}|\bwp \d{9,}|\b[a-z]+ [a-z]+ eng\b|\b\d{1,2} \d{1,2} \d{4}\b|\bmsg \d\b|\(\d\)$/gm) ?? []).length;
  if (fileNames) pen(Math.min(1.5, fileNames * 0.5), `${fileNames} download title(s) that look like file names`);
  const paras = [...mainHtml.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/g)].map((m) => decode(m[1].replace(/<[^>]+>/g, "")).trim()).filter(Boolean);
  const tiny = paras.filter((p) => (p.match(/[A-Za-z]+/g) ?? []).length <= 4 && !/^(Quran|Source|Sahih|Download)/i.test(p));
  if (isArticle && paras.length >= 8 && tiny.length / paras.length > 0.25)
    pen(Math.min(3.5, tiny.length * 0.25), `Broken formatting: ${tiny.length} of ${paras.length} paragraphs are 1–4 words (e.g. "${tiny.slice(0, 3).join('", "')}"); a table or list may have been flattened`);
  if (paras.length && /:$/.test(paras[paras.length - 1])) pen(0.5, `Page ends with a dangling line ("${paras[paras.length - 1]}")`);
  const firstPara = paras[0] ?? "";
  if (isArticle && /^[a-z]/.test(firstPara)) pen(2, `Text starts mid-sentence ("${firstPara.slice(0, 40)}"): leftover fragment`);
  if (isArticle && words.length < 150) pen(words.length < 80 ? 3 : 1.5, `Very little text (${words.length} words)`);
  const textScore = round1(clamp(t, 1, 10));

  // ----- structure -----
  const h1 = (fullMain.match(/<h1[\s>]/g) ?? []).length;
  const h2 = (mainHtml.match(/<h2[\s>]/g) ?? []).length;
  let structure = 100;
  if (h1 !== 1) { structure -= 40; issues.push(`${h1} H1 headings (should be exactly 1)`); }
  if (words.length > 400 && h2 === 0) { structure -= 30; issues.push("Long page with no section headings (H2)"); }
  if (/<h[3-6][\s>]/.test(mainHtml) && h2 === 0) { structure -= 15; issues.push("Sub-headings (H3+) without any H2"); }

  // ----- accessibility -----
  const imgs = mainHtml.match(/<img\b[^>]*>/g) ?? [];
  const noAlt = imgs.filter((i) => !/\balt=/.test(i)).length;
  const undescribed = isArticle ? imgs.filter((i) => /\balt=""/.test(i) && !/ytimg\.com/.test(i) && !/\/img\//.test(i)).length : 0;
  if (undescribed) issues.push(`${undescribed} content image(s) with empty alt text (screen readers skip them)`);
  const links = [...mainHtml.matchAll(/<a\b[^>]*>([\s\S]*?)<\/a>/g)].map((m) => m[1].replace(/<[^>]+>/g, "").trim());
  const vague = links.filter((l) => /^(here|click here|link|read more|this)$/i.test(l)).length;
  const urlText = links.filter((l) => /^https?:\/\//.test(l)).length;
  let a11y = 100 - noAlt * 15 - Math.min(30, undescribed * 10) - vague * 10 - Math.min(30, urlText * 5);
  if (noAlt) issues.push(`${noAlt} image(s) with no alt attribute`);
  if (urlText) issues.push(`${urlText} link(s) whose text is a raw URL`);
  a11y = clamp(a11y, 0, 100);

  // ----- media balance -----
  const videos =
    new Set([...mainHtml.matchAll(/(?:ytimg\.com\/vi|youtube(?:-nocookie)?\.com\/embed)\/([\w-]{11})/g)].map((m) => m[1])).size +
    (mainHtml.match(/<iframe[^>]+src="[^"]*(?:vimeo|videopress|video\.wordpress)/g) ?? []).length;
  let media = 100;
  if (videos > 3) { media -= Math.min(70, (videos - 3) * 8); issues.push(`${videos} videos on one page (aim for 3 or fewer)`); }

  // ----- freshness -----
  const updated = updatedDate(html);
  let fresh = 70; // unknown
  if (updated) {
    const years = (Date.now() - new Date(updated).getTime()) / (365.25 * 864e5);
    fresh = years < 1 ? 100 : years < 2 ? 80 : 50;
    if (years >= 2) issues.push(`Not updated since ${updated}`);
  }

  const parts = { text: textScore * 10, structure, accessibility: a11y, media, freshness: fresh };
  const pageScore = Math.round(parts.text * 0.5 + structure * 0.15 + a11y * 0.15 + media * 0.1 + fresh * 0.1);

  return {
    path: route,
    source: sourceFor(route, html),
    words: words.length,
    sentences,
    avgSentence: round1(avgSentence),
    readingEase: Math.round(readingEase),
    textScore,
    pageScore,
    parts,
    issues,
  };
}

function git(args: string[]) {
  try {
    return execFileSync("git", args, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    return "";
  }
}

type Change = { sha: string; date: string; subject: string };
function historyFor(file: string): Change[] {
  const out = git(["log", "--follow", "-n", "15", "--date=short", "--format=%h%x09%ad%x09%s", "--", file]);
  return out ? out.split("\n").map((l) => { const [sha, date, ...s] = l.split("\t"); return { sha, date, subject: s.join("\t") }; }) : [];
}

function main() {
  fs.mkdirSync(DEST, { recursive: true });
  const pages: Record<string, Score> = {};
  for (const f of htmlFiles(OUT)) {
    const html = fs.readFileSync(path.join(OUT, f), "utf8");
    if (/<title>Redirecting/.test(html) || f === "404/index.html") continue;
    const route = "/" + f.replace(/index\.html$/, "");
    pages[route] = score(route, html);
  }
  const list = Object.values(pages);
  const avg = (k: "textScore" | "pageScore") => round1(list.reduce((n, p) => n + p[k], 0) / Math.max(1, list.length));
  const ranked = [...list].sort((a, b) => a.pageScore - b.pageScore).map((p) => p.path);
  for (const p of list) (p as Score & { rank?: number }).rank = ranked.indexOf(p.path) + 1;
  fs.writeFileSync(
    path.join(DEST, "scores.json"),
    JSON.stringify({ generatedAt: new Date().toISOString(), pages: list.length, averageText: avg("textScore"), averagePage: avg("pageScore"), byPath: pages }),
  );

  const shallow = git(["rev-parse", "--is-shallow-repository"]) === "true";
  const history: Record<string, Change[]> = {};
  for (const p of list) if (p.source) history[p.path] = historyFor(p.source);
  const site = git(["log", "-n", "20", "--date=short", "--format=%h%x09%ad%x09%s"])
    .split("\n").filter(Boolean).map((l) => { const [sha, date, ...s] = l.split("\t"); return { sha, date, subject: s.join("\t") }; });
  fs.writeFileSync(path.join(DEST, "history.json"), JSON.stringify({ generatedAt: new Date().toISOString(), shallow, site, byPath: history }));

  console.log(`Dev data: ${list.length} pages scored (avg text ${avg("textScore")}/10, page ${avg("pageScore")}/100)${shallow ? ", history limited (shallow clone)" : ""}`);
}

main();
