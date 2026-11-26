/**
 * Builds the detailed WiseQuest website report as a PDF (used by the `website-report` skill).
 *
 *   npm run report:pdf                         last 7 days (+ last 28 days once 28 days of data exist), saved to /tmp/wisequest-report-<date>.pdf
 *   npm run report:pdf -- --days 28 --out report.pdf
 *   npm run report:pdf -- --html report.html   also keep the HTML (for checking the layout)
 *
 * Reads Google Analytics through scripts/ga-report.ts (read-only) and, if present, page quality scores from
 * out/dev-data/scores.json (run `npm run build` first to include them). Renders with the Chrome that is already
 * installed (cloud: /usr/bin/google-chrome; macOS: Google Chrome.app), so no extra packages are needed.
 * Prints the PDF path and a JSON summary of the key numbers (for the Telegram message).
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import matter from "gray-matter";

const ROOT = process.cwd();
type Row = Record<string, string | number>;
type Report = { rows: Row[]; previous?: Row[] };
type GA = Record<string, Report> & { days: number };

const arg = (name: string, def?: string) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : def;
};
const DAYS = Number(arg("days", "7"));
const today = new Date().toISOString().slice(0, 10);
const OUT = path.resolve(arg("out", path.join(os.tmpdir(), `wisequest-report-${today}.pdf`))!);
const HTML_OUT = arg("html");
// Google Analytics tracking began on this date. Until 28 full days exist, the report shows only the shorter period.
const TRACKING_START = process.env.GA_TRACKING_START ?? "2026-11-22";
const DAYS_OF_DATA = Math.floor((Date.parse(today) - Date.parse(TRACKING_START)) / 864e5);
const HAS28 = DAYS_OF_DATA >= 28;

function ga(days: number): GA {
  const out = execFileSync("npx", ["tsx", "scripts/ga-report.ts", "all", String(days), "--json", "--compare"], {
    cwd: ROOT,
    encoding: "utf8",
    maxBuffer: 32 << 20,
    stdio: ["ignore", "pipe", "inherit"],
  });
  return JSON.parse(out) as GA;
}

// ---------- helpers ----------
const n = (v: unknown) => Number(v ?? 0) || 0;
const esc = (s: unknown) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
const int = (v: unknown) => Math.round(n(v)).toLocaleString("en-US");
const pct = (v: unknown) => `${Math.round(n(v) * 100)}%`;
const secs = (v: unknown) => {
  const s = Math.round(n(v));
  return s >= 60 ? `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, "0")}s` : `${s}s`;
};
const sum = (rows: Row[] | undefined, k: string) => (rows ?? []).reduce((a, r) => a + n(r[k]), 0);
function change(cur: number, prev: number | undefined) {
  if (prev === undefined || !prev) return `<span class="muted">n/a</span>`;
  const d = (cur - prev) / prev;
  const cls = d > 0.02 ? "up" : d < -0.02 ? "down" : "muted";
  return `<span class="${cls}">${d > 0 ? "▲" : d < 0 ? "▼" : "•"} ${Math.abs(Math.round(d * 100))}%</span>`;
}

// Page titles from content front matter (fallback: the path).
function titles() {
  const map: Record<string, string> = { "/": "Home", "/learn/": "Learn (overview)", "/qa/": "Questions & Answers", "/local/": "Quran 101 (local classes)", "/start/": "Start here" };
  const walk = (dir: string): string[] =>
    fs.existsSync(dir) ? fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(dir, e.name)) : e.name.endsWith(".mdx") ? [path.join(dir, e.name)] : [])) : [];
  for (const f of [...walk(path.join(ROOT, "content/pages")), ...walk(path.join(ROOT, "content/qa"))]) {
    const rel = path.relative(ROOT, f).replace(/\\/g, "/");
    const url = rel.startsWith("content/qa/") ? `/qa/${rel.slice(11, -4)}/` : `/${rel.slice(14, -4)}/`;
    try {
      const t = matter(fs.readFileSync(f, "utf8")).data.title;
      if (typeof t === "string") map[url] = t;
    } catch {}
  }
  return map;
}
const norm = (p: unknown) => {
  let s = String(p ?? "").split("?")[0];
  if (!s.endsWith("/") && !s.includes(".")) s += "/";
  return s;
};

type Score = { path?: string; textScore?: number; pageScore?: number; issues?: string[]; fixes?: string[] };
type Quality = { averageText?: number; averagePage?: number; pages: Score[] };
function quality(): Quality {
  const f = path.join(ROOT, "out/dev-data/scores.json");
  if (!fs.existsSync(f)) return { pages: [] };
  try {
    const j = JSON.parse(fs.readFileSync(f, "utf8"));
    const src = j.byPath && typeof j.byPath === "object" ? j.byPath : {};
    const pages = Object.entries(src).filter(([, v]) => v && typeof v === "object").map(([k, v]) => ({ path: norm(k), ...(v as Score) }));
    return { averageText: j.averageText, averagePage: j.averagePage, pages };
  } catch {
    return { pages: [] };
  }
}

const git = (...a: string[]) => {
  try {
    return execFileSync("git", a, { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
  } catch {
    return "";
  }
};

/** Last week's quality averages from the weekly report log (state branch), if any. */
function previousQuality(): { averageText?: number; averagePage?: number } {
  git("fetch", "-q", "origin", "claude/telegram-state");
  const raw = git("show", "origin/claude/telegram-state:reports.json");
  try {
    const list = JSON.parse(raw) as { week_end?: string; quality?: { averageText?: number; averagePage?: number } }[];
    const last = [...list].reverse().find((r) => r.quality && r.week_end && r.week_end < today);
    return last?.quality ?? {};
  } catch {
    return {};
  }
}

const cap = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

/** Visitor-facing changes published in the period, grouped by topic (dev tools and bot/skill updates are left out). */
function siteChanges(days: number) {
  const ref = git("rev-parse", "--verify", "-q", "origin/main").trim() ? "origin/main" : "HEAD";
  const log = git("log", ref, `--since=${days} days ago`, "--format=%cs|%s", "--", "content", "app", "components", "public", "lib", "data");
  const SKIP = /(dev mode|^telegram bot|^guidelines|^website report|^version format|^daily suggestion|^weekly report|^reverted request)/i;
  const items = log
    .split("\n")
    .filter(Boolean)
    .map((l) => {
      const [date, ...rest] = l.split("|");
      const subj = rest.join("|");
      const m = subj.match(/^v([\d.]+):\s*(.*?)(?:\s*\(#\d+\))?$/);
      const text = m ? m[2] : subj;
      const i = text.indexOf(":");
      return { date, version: m ? `v${m[1]}` : "", topic: i > 0 && i < 40 ? text.slice(0, i).trim() : "Other improvements", detail: cap(i > 0 && i < 40 ? text.slice(i + 1).trim() : text) };
    })
    .filter((x) => !SKIP.test(x.topic) && !SKIP.test(x.detail));
  const groups = new Map<string, typeof items>();
  // Merge sub-topics into their page ("Jesus page chart" → "Jesus page").
  const topics = [...new Set(items.map((i) => i.topic))].sort((a, b) => a.length - b.length);
  for (const it of items) {
    const parent = topics.find((t) => t !== it.topic && t !== "Other improvements" && it.topic.toLowerCase().startsWith(t.toLowerCase() + " "));
    if (parent) it.topic = parent;
  }
  for (const it of items) groups.set(it.topic, [...(groups.get(it.topic) ?? []), it]);
  return { count: items.length, groups: [...groups.entries()].map(([topic, list]) => ({ topic, list })).sort((a, b) => b.list.length - a.list.length) };
}

function scores(): Record<string, { textScore?: number; pageScore?: number }> {
  const f = path.join(ROOT, "out/dev-data/scores.json");
  if (!fs.existsSync(f)) return {};
  try {
    const j = JSON.parse(fs.readFileSync(f, "utf8"));
    const src = j.byPath && typeof j.byPath === "object" ? j.byPath : j;
    const list: Row[] = Array.isArray(src) ? src : Object.entries(src).filter(([, v]) => v && typeof v === "object").map(([k, v]) => ({ path: k, ...(v as object) }));
    return Object.fromEntries(list.map((r) => [norm(r.path ?? r.url), { textScore: r.textScore as number, pageScore: r.pageScore as number }]));
  } catch {
    return {};
  }
}

function bars(rows: Row[]) {
  const data = rows.map((r) => ({ d: String(r.date), v: n(r.activeUsers) })).sort((a, b) => a.d.localeCompare(b.d));
  if (!data.length) return `<p class="muted">No daily data yet.</p>`;
  const W = 700, H = 150, TOP = 18, max = Math.max(...data.map((x) => x.v), 1), bw = Math.min(W / data.length, 48);
  const label = (d: string) => `${d.slice(4, 6)}/${d.slice(6, 8)}`;
  const every = Math.ceil(data.length / 10);
  return `<svg viewBox="0 0 ${W} ${H + TOP + 24}" width="100%" role="img" aria-label="Visitors per day">
    ${data
      .map((x, i) => {
        const h = Math.max(2, (x.v / max) * H);
        return `<rect x="${i * bw + 2}" y="${TOP + H - h}" width="${bw - 4}" height="${h}" rx="3" fill="#0f5c55"/>
        <text x="${i * bw + bw / 2}" y="${TOP + H - h - 4}" font-size="10" text-anchor="middle" fill="#334">${x.v}</text>
        ${i % every === 0 ? `<text x="${i * bw + bw / 2}" y="${TOP + H + 16}" font-size="10" text-anchor="middle" fill="#667">${label(x.d)}</text>` : ""}`;
      })
      .join("")}
  </svg>`;
}

function table(head: string[], rows: string[][], cls = "") {
  if (!rows.length) return `<p class="muted">No data for this period yet.</p>`;
  return `<table class="${cls}"><thead><tr>${head.map((h) => `<th>${h}</th>`).join("")}</tr></thead><tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
}

// Filled in by build() for the JSON summary.
const attention: { page: string; title: string; views: number; reasons: string[]; issue: string; fix: string }[] = [];
const changesSummary: { count: number; groups: { topic: string; count: number; latest: string }[] } = { count: 0, groups: [] };
const feedbackSummary: { yes: number; no: number; pages: string[] } = { yes: 0, no: 0, pages: [] };
const qualitySummary: { averageText?: number; averagePage?: number; prevText?: number; prevPage?: number } = {};

// ---------- build ----------
function build(week: GA, month: GA) {
  const L = HAS28 ? "28 days" : `${DAYS} days`; // period used for the detail sections
  let no = 0;
  const sec = (t: string) => `<h2>${++no}. ${t}</h2>`;
  const T = titles();
  const Q = scores();
  const ov = (g: GA) => g.overview?.rows?.[0] ?? {};
  const ovp = (g: GA) => g.overview?.previous?.[0];
  const kpis = (g: GA, label: string) => {
    const c = ov(g), p = ovp(g);
    const perUser = (r: Row | undefined) => (r && n(r.activeUsers) ? n(r.userEngagementDuration) / n(r.activeUsers) : undefined);
    const vpu = (r: Row | undefined) => (r && n(r.activeUsers) ? n(r.screenPageViews) / n(r.activeUsers) : undefined);
    const card = (name: string, val: string, cur: number, prev: number | undefined) => `<div class="kpi"><div class="kv">${val}</div><div class="kn">${name}</div><div class="kc">${change(cur, prev)}</div></div>`;
    return `<h3>${label}</h3><div class="kpis">
      ${card("Visitors", int(c.activeUsers), n(c.activeUsers), p ? n(p.activeUsers) : undefined)}
      ${card("New visitors", int(c.newUsers), n(c.newUsers), p ? n(p.newUsers) : undefined)}
      ${card("Visits (sessions)", int(c.sessions), n(c.sessions), p ? n(p.sessions) : undefined)}
      ${card("Page views", int(c.screenPageViews), n(c.screenPageViews), p ? n(p.screenPageViews) : undefined)}
      ${card("Engaged time per visitor", secs(perUser(c)), perUser(c) ?? 0, perUser(p))}
      ${card("Engagement rate", pct(c.engagementRate), n(c.engagementRate), p ? n(p.engagementRate) : undefined)}
      ${card("Pages per visitor", (vpu(c) ?? 0).toFixed(1), vpu(c) ?? 0, vpu(p))}
    </div>`;
  };

  const prevViews = Object.fromEntries((week.pages?.previous ?? []).map((r) => [norm(r.pagePath), n(r.screenPageViews)]));
  const pageRows = (g: GA, withChange: boolean) =>
    (g.pages?.rows ?? []).slice(0, 15).map((r, i) => {
      const p = norm(r.pagePath), q = Q[p];
      return [
        String(i + 1),
        `<b>${esc(T[p] ?? p)}</b><br><span class="muted small">${esc(p)}</span>`,
        int(r.screenPageViews),
        int(r.activeUsers),
        secs(r.avgEngagementSec),
        pct(r.engagementRate),
        q?.pageScore !== undefined ? `${Math.round(q.pageScore)}/100` : "–",
        ...(withChange ? [change(n(r.screenPageViews), prevViews[p])] : []),
      ];
    });

  const QL = quality();
  const PQ = previousQuality();
  const views = Object.fromEntries((month.pages?.rows ?? []).map((r) => [norm(r.pagePath), r]));
  attention.length = 0;
  for (const q of QL.pages) {
    const r = views[q.path!];
    const reasons: string[] = [];
    if (r && n(r.screenPageViews) >= 5 && n(r.avgEngagementSec) < 15) reasons.push(`visitors leave quickly (${secs(r.avgEngagementSec)})`);
    if (r && n(r.screenPageViews) >= 5 && n(r.engagementRate) < 0.35) reasons.push(`few engaged visits (${pct(r.engagementRate)})`);
    if (n(q.pageScore) && n(q.pageScore) < 75) reasons.push(`low page rating (${Math.round(n(q.pageScore))}/100)`);
    if (q.textScore !== undefined && n(q.textScore) < 6) reasons.push(`hard to read (text ${n(q.textScore).toFixed(1)}/10)`);
    if (reasons.length) attention.push({ page: q.path!, title: T[q.path!] ?? q.path!, views: r ? n(r.screenPageViews) : 0, reasons, issue: q.issues?.[0] ?? "", fix: q.fixes?.[0] ?? "" });
  }
  attention.sort((a, b) => b.views - a.views || b.reasons.length - a.reasons.length);
  const fix = attention.slice(0, 10).map((a) => [`<b>${esc(a.title)}</b><br><span class="muted small">${esc(a.page)}</span>`, int(a.views), esc(a.reasons.join("; ")), `${esc(a.issue)}${a.fix ? `<br><span class="muted small">Suggested: ${esc(a.fix)}</span>` : ""}`]);

  const qualityRows = [...QL.pages]
    .sort((a, b) => n(a.pageScore) - n(b.pageScore))
    .map((q) => [`<b>${esc(T[q.path!] ?? q.path)}</b><br><span class="muted small">${esc(q.path)}</span>`, q.textScore !== undefined ? `${n(q.textScore).toFixed(1)}/10` : "–", q.pageScore !== undefined ? `${Math.round(n(q.pageScore))}/100` : "–", views[q.path!] ? int(views[q.path!].screenPageViews) : "0", esc(q.issues?.[0] ?? "No issues found")]);
  const qChange = (cur?: number, prev?: number, dp = 1) => (cur === undefined || prev === undefined ? "" : ` <span class="${cur >= prev ? "up" : "down"}">${cur >= prev ? "▲" : "▼"} ${Math.abs(cur - prev).toFixed(dp)}</span>`);
  const goodPages = QL.pages.filter((q) => n(q.pageScore) >= 85).length;

  const CH = siteChanges(DAYS);
  changesSummary.count = CH.count;
  changesSummary.groups = CH.groups.map((g) => ({ topic: g.topic, count: g.list.length, latest: g.list[0]?.detail ?? "" }));
  const changesHtml = CH.count
    ? `<p><b>${CH.count}</b> visitor-facing update${CH.count === 1 ? "" : "s"} published in the last ${DAYS} days (internal tools and bot settings not counted).</p>
      ${CH.groups
        .map((g) => `<h3>${esc(g.topic)} <span class="muted">(${g.list.length})</span></h3><ul>${g.list.slice(0, 6).map((it) => `<li>${esc(it.detail)} <span class="muted small">${esc(it.version)} · ${esc(it.date)}</span></li>`).join("")}${g.list.length > 6 ? `<li class="muted">…and ${g.list.length - 6} more</li>` : ""}</ul>`)
        .join("")}`
    : `<p class="muted">No visitor-facing changes were published in this period.</p>`;
  qualitySummary.averageText = QL.averageText;
  qualitySummary.averagePage = QL.averagePage;
  qualitySummary.prevText = PQ.averageText;
  qualitySummary.prevPage = PQ.averagePage;

  const totalSessions = sum(month.sources?.rows, "sessions") || 1;
  const sources = (month.sources?.rows ?? []).slice(0, 10).map((r) => [esc(r.sessionDefaultChannelGroup), esc(r.sessionSource), int(r.sessions), pct(n(r.sessions) / totalSessions), pct(r.engagementRate)]);
  const totalUsers = sum(month.geo?.rows, "activeUsers") || 1;
  const LOCAL = /sacramento|roseville|elk grove|folsom|davis|rocklin|citrus heights|rancho cordova|lincoln|west sacramento|granite bay|el dorado hills/i;
  const local = (month.geo?.rows ?? []).filter((r) => LOCAL.test(String(r.city))).reduce((a, r) => a + n(r.activeUsers), 0);
  const geo = (month.geo?.rows ?? []).slice(0, 12).map((r) => [esc(r.country), esc(r.city), int(r.activeUsers), int(r.sessions)]);
  const devTotal = sum(month.devices?.rows, "activeUsers") || 1;
  const devices = (month.devices?.rows ?? []).map((r) => [esc(r.deviceCategory), int(r.activeUsers), pct(n(r.activeUsers) / devTotal), pct(r.engagementRate), secs(r.averageSessionDuration)]);
  const landing = (month.landing?.rows ?? []).slice(0, 10).map((r) => [esc(T[norm(r.landingPage)] ?? r.landingPage), int(r.sessions), pct(r.engagementRate), secs(r.averageSessionDuration)]);
  const downloads = (month.downloads?.rows ?? []).slice(0, 10).map((r) => [esc(r.fileName || r.linkUrl), int(r.eventCount), int(r.totalUsers)]);
  const events = (month.events?.rows ?? []).slice(0, 12).map((r) => [esc(r.eventName), int(r.eventCount), int(r.totalUsers)]);
  // "Was this page helpful?" per page.
  const fb: Record<string, { yes: number; no: number; reasons: Record<string, number> }> = {};
  for (const r of month.feedback?.rows ?? []) {
    const p = norm(r.pagePath), e = String(r.eventName), c = n(r.eventCount);
    const f = (fb[p] ??= { yes: 0, no: 0, reasons: {} });
    if (e === "feedback_yes") f.yes += c;
    else if (e === "feedback_no") f.no += c;
    else if (e.startsWith("feedback_no_")) f.reasons[e.slice(12)] = (f.reasons[e.slice(12)] ?? 0) + c;
  }
  const REASON: Record<string, string> = { unclear: "Hard to understand", missing: "Missing information", wrong: "Something looks wrong", other: "Something else" };
  const fbTotal = Object.values(fb).reduce((a, f) => ({ yes: a.yes + f.yes, no: a.no + f.no }), { yes: 0, no: 0 });
  const fbRows = Object.entries(fb)
    .sort((a, b) => b[1].yes + b[1].no - (a[1].yes + a[1].no))
    .map(([p, f]) => {
      const top = Object.entries(f.reasons).sort((a, b) => b[1] - a[1])[0];
      return [`<b>${esc(T[p] ?? p)}</b><br><span class="muted small">${esc(p)}</span>`, int(f.yes), int(f.no), f.yes + f.no ? pct(f.yes / (f.yes + f.no)) : "–", top ? `${esc(REASON[top[0]] ?? top[0])} (${top[1]})` : "–"];
    });
  feedbackSummary.yes = fbTotal.yes;
  feedbackSummary.no = fbTotal.no;
  feedbackSummary.pages = Object.entries(fb).filter(([, f]) => f.no > f.yes).map(([p]) => p).slice(0, 5);

  const KEY = ["/become-muslim/", "/new-muslims/", "/contact/", "/resources/free-quran/", "/local/"];
  const keyRows = KEY.map((k) => {
    const r = (month.pages?.rows ?? []).find((x) => norm(x.pagePath) === k);
    return [`<b>${esc(T[k] ?? k)}</b><br><span class="muted small">${k}</span>`, r ? int(r.screenPageViews) : "0", r ? int(r.activeUsers) : "0", r ? secs(r.avgEngagementSec) : "–"];
  });

  const period = (d: number) => {
    const end = new Date(Date.now() - 864e5), start = new Date(Date.now() - d * 864e5);
    const f = (x: Date) => x.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    return `${f(start)} – ${f(end)}`;
  };
  const small = n(ov(week).screenPageViews) < 300;

  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>WiseQuest website report ${today}</title><style>
  @page { size: A4; margin: 16mm 14mm; }
  body { font-family: -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; color: #1d2a33; font-size: 11px; line-height: 1.45; }
  h1 { font-size: 24px; margin: 0; color: #0f5c55; } h2 { font-size: 15px; color: #0f5c55; border-bottom: 2px solid #e3efed; padding-bottom: 4px; margin: 22px 0 8px; page-break-after: avoid; }
  h3 { font-size: 12px; margin: 12px 0 6px; color: #2c3e48; }
  .cover { border-radius: 12px; background: linear-gradient(135deg, #0f5c55, #1e8a7f); color: white; padding: 22px 24px; margin-bottom: 14px; }
  .cover h1 { color: white; } .cover p { margin: 4px 0 0; opacity: .9; }
  .kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
  .kpi { border: 1px solid #dfe8e6; border-radius: 10px; padding: 8px 10px; background: #f8fbfa; }
  .kv { font-size: 18px; font-weight: 700; color: #0f5c55; } .kn { color: #4b5b65; } .kc { font-size: 10px; margin-top: 2px; }
  table { width: 100%; border-collapse: collapse; margin: 4px 0 6px; page-break-inside: auto; } tr { page-break-inside: avoid; }
  th { text-align: left; background: #0f5c55; color: white; font-weight: 600; padding: 5px 6px; font-size: 10px; }
  td { padding: 5px 6px; border-bottom: 1px solid #e8eeec; vertical-align: top; } tbody tr:nth-child(even) td { background: #f8fbfa; }
  .up { color: #1a7f37; font-weight: 600; } .down { color: #c0392b; font-weight: 600; } .muted { color: #7a8a93; } .small { font-size: 9px; }
  .note { background: #fff8e6; border: 1px solid #f3dfa8; border-radius: 8px; padding: 8px 10px; margin: 8px 0; }
  .cols { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
  footer { margin-top: 20px; color: #7a8a93; font-size: 9px; text-align: center; }
  </style></head><body>
  <div class="cover"><h1>WiseQuest website report</h1><p>Last ${DAYS} days: ${period(DAYS)}${HAS28 ? ` · Last 28 days: ${period(28)}` : ""}</p><p>wisequest.org · Generated ${today}</p></div>
  ${small ? `<div class="note"><b>Small numbers:</b> the site is still new (tracking began on Nov 22, 2026), so week-to-week changes can swing widely. Treat them as early signals, not trends.</div>` : ""}

  ${sec("Key numbers")}
  ${kpis(week, `Last ${DAYS} days (vs the ${DAYS} days before)`)}
  ${HAS28 ? kpis(month, "Last 28 days (vs the 28 days before)") : `<p class="muted small">28-day figures will appear once 28 days of data exist (tracking began on ${TRACKING_START}; ${DAYS_OF_DATA} days so far).</p>`}
  <p class="muted small">Engaged time = time the page was open and in focus. Engagement rate = share of visits that lasted 10 s+, viewed 2+ pages or included an action.</p>

  ${sec(`Improvements published (last ${DAYS} days)`)}
  ${changesHtml}

  ${sec("Page quality ratings")}
  <div class="kpis">
    <div class="kpi"><div class="kv">${QL.averageText !== undefined ? n(QL.averageText).toFixed(1) : "–"}/10${qChange(QL.averageText, PQ.averageText)}</div><div class="kn">Average text rating (readability)</div></div>
    <div class="kpi"><div class="kv">${QL.averagePage !== undefined ? Math.round(n(QL.averagePage)) : "–"}/100${qChange(QL.averagePage, PQ.averagePage, 0)}</div><div class="kn">Average page rating (overall)</div></div>
    <div class="kpi"><div class="kv">${goodPages}/${QL.pages.length}</div><div class="kn">Pages rated 85+ (good)</div></div>
  </div>
  <p class="muted small">Text rating: sentence length, reading ease and plain words (out of 10). Page rating: text, structure, accessibility, media and freshness (out of 100). From the site's own build-time checks; changes compare with last week's report.</p>
  ${table(["Page (lowest rated first)", "Text", "Page", `Views (${L})`, "Main issue"], qualityRows)}

  ${sec(`Visitors per day (last ${L})`)}
  ${bars(month.daily?.rows ?? [])}

  ${sec(`Top pages: last ${DAYS} days`)}
  ${table(["#", "Page", "Views", "Visitors", "Engaged time / visitor", "Engagement", "Quality", "Views vs before"], pageRows(week, true))}

  ${HAS28 ? `${sec("Top pages: last 28 days")}
  ${table(["#", "Page", "Views", "Visitors", "Engaged time / visitor", "Engagement", "Quality"], pageRows(month, false))}` : ""}

  ${sec("Pages that need attention")}
  <p>Pages where visitors leave quickly (under 15 s), few visits are engaged (under 35%), the page rating is under 75, or the text is hard to read (under 6/10). Busiest pages first.</p>
  ${table(["Page", `Views (${L})`, "Why", "Main issue and suggested fix"], fix)}

  ${sec(`Visitor feedback: "Was this page helpful?" (last ${L})`)}
  ${fbTotal.yes + fbTotal.no ? `<p><b>${int(fbTotal.yes)}</b> said yes and <b>${int(fbTotal.no)}</b> said no (${pct(fbTotal.yes / (fbTotal.yes + fbTotal.no))} helpful).</p>` : ""}
  ${table(["Page", "👍 Yes", "👎 No", "Helpful", "Most common reason for No"], fbRows)}

  ${sec("Key pages: are visitors reaching them?")}
  ${table(["Page", `Views (${L})`, "Visitors", "Engaged time / visitor"], keyRows)}

  ${sec("How visitors arrive")}
  <h3>First page seen (landing pages, last ${L})</h3>
  ${table(["Landing page", "Visits", "Engagement", "Avg visit length"], landing)}
  <h3>Traffic sources (last ${L})</h3>
  ${table(["Channel", "Source", "Visits", "Share", "Engagement"], sources)}

  ${sec("Where visitors are")}
  <p>Sacramento area: <b>${pct(local / totalUsers)}</b> of visitors in the last ${L} (${int(local)} of ${int(totalUsers)}).</p>
  ${table(["Country", "City", "Visitors", "Visits"], geo)}

  <div class="cols"><div>
  ${sec("Devices")}
  ${table(["Device", "Visitors", "Share", "Engagement", "Avg visit"], devices)}
  </div><div>
  ${sec("Downloads")}
  ${table(["File", "Downloads", "People"], downloads)}
  </div></div>

  ${sec(`All tracked actions (last ${L})`)}
  ${table(["Event", "Count", "People"], events)}

  <footer>WiseQuest · wisequest.org · Data: Google Analytics 4 (read-only)${Object.keys(Q).length ? " and the site's quality scores" : ""}. No personal data is included.</footer>
  </body></html>`;
}

function chrome() {
  const c = [process.env.CHROME_PATH, "/usr/bin/google-chrome", "/usr/bin/google-chrome-stable", "/opt/pw-browsers/chromium", "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser"];
  const found = c.find((p) => p && fs.existsSync(p));
  if (!found) throw new Error("No Chrome/Chromium found (set CHROME_PATH).");
  return found;
}

function main() {
  const week = ga(DAYS);
  const month = DAYS === 28 || !HAS28 ? week : ga(28);
  const html = build(week, month);
  const tmpHtml = HTML_OUT ? path.resolve(HTML_OUT) : path.join(os.tmpdir(), `wisequest-report-${process.pid}.html`);
  fs.writeFileSync(tmpHtml, html);
  execFileSync(chrome(), ["--headless=new", "--no-sandbox", "--disable-gpu", "--no-pdf-header-footer", `--print-to-pdf=${OUT}`, `file://${tmpHtml}`], { stdio: "ignore", timeout: 120000 });
  if (!HTML_OUT) fs.rmSync(tmpHtml, { force: true });
  const o = week.overview?.rows?.[0] ?? {};
  const top = (week.pages?.rows ?? []).slice(0, 3).map((r) => ({ page: norm(r.pagePath), views: n(r.screenPageViews), engagedSec: Math.round(n(r.avgEngagementSec)) }));
  console.log(JSON.stringify({ pdf: OUT, bytes: fs.statSync(OUT).size, days: DAYS, visitors: n(o.activeUsers), pageViews: n(o.screenPageViews), engagedSecPerVisitor: n(o.activeUsers) ? Math.round(n(o.userEngagementDuration) / n(o.activeUsers)) : 0, engagementRate: Math.round(n(o.engagementRate) * 100), visitors28: HAS28 ? n(month.overview?.rows?.[0]?.activeUsers) : null, daysOfData: DAYS_OF_DATA, top, quality: qualitySummary, attention: attention.slice(0, 5).map((a) => ({ page: a.page, title: a.title, views: a.views, reasons: a.reasons, fix: a.fix })), improvements: changesSummary, feedback: feedbackSummary }, null, 2));
}

main();
