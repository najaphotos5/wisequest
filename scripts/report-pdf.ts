/**
 * Builds the detailed WiseQuest website report as a PDF (used by the `website-report` skill).
 *
 *   npm run report:pdf                         last 7 days (+ last 28 days), saved to /tmp/wisequest-report-<date>.pdf
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

// ---------- build ----------
function build(week: GA, month: GA) {
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

  const fix = (month.pages?.rows ?? [])
    .filter((r) => n(r.screenPageViews) >= 5 && (n(r.avgEngagementSec) < 15 || n(r.engagementRate) < 0.35))
    .slice(0, 8)
    .map((r) => [`<b>${esc(T[norm(r.pagePath)] ?? norm(r.pagePath))}</b><br><span class="muted small">${esc(norm(r.pagePath))}</span>`, int(r.screenPageViews), secs(r.avgEngagementSec), pct(r.engagementRate)]);

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
  <div class="cover"><h1>WiseQuest website report</h1><p>Last ${DAYS} days: ${period(DAYS)} · Last 28 days: ${period(28)}</p><p>wisequest.org · Generated ${today}</p></div>
  ${small ? `<div class="note"><b>Small numbers:</b> the site is still new (tracking began on Nov 22, 2026), so week-to-week changes can swing widely. Treat them as early signals, not trends.</div>` : ""}

  <h2>1. Key numbers</h2>
  ${kpis(week, `Last ${DAYS} days (vs the ${DAYS} days before)`)}
  ${kpis(month, "Last 28 days (vs the 28 days before)")}
  <p class="muted small">Engaged time = time the page was open and in focus. Engagement rate = share of visits that lasted 10 s+, viewed 2+ pages or included an action.</p>

  <h2>2. Visitors per day (last 28 days)</h2>
  ${bars(month.daily?.rows ?? [])}

  <h2>3. Top pages: last ${DAYS} days</h2>
  ${table(["#", "Page", "Views", "Visitors", "Engaged time / visitor", "Engagement", "Quality", "Views vs before"], pageRows(week, true))}

  <h2>4. Top pages: last 28 days</h2>
  ${table(["#", "Page", "Views", "Visitors", "Engaged time / visitor", "Engagement", "Quality"], pageRows(month, false))}

  <h2>5. Pages that need attention</h2>
  <p>Pages with at least 5 views in 28 days where visitors leave quickly (under 15 s) or few visits are engaged (under 35%).</p>
  ${table(["Page", "Views", "Engaged time / visitor", "Engagement"], fix)}

  <h2>6. Key pages: are visitors reaching them?</h2>
  ${table(["Page", "Views (28 days)", "Visitors", "Engaged time / visitor"], keyRows)}

  <h2>7. How visitors arrive</h2>
  <h3>First page seen (landing pages, 28 days)</h3>
  ${table(["Landing page", "Visits", "Engagement", "Avg visit length"], landing)}
  <h3>Traffic sources (28 days)</h3>
  ${table(["Channel", "Source", "Visits", "Share", "Engagement"], sources)}

  <h2>8. Where visitors are</h2>
  <p>Sacramento area: <b>${pct(local / totalUsers)}</b> of visitors in the last 28 days (${int(local)} of ${int(totalUsers)}).</p>
  ${table(["Country", "City", "Visitors", "Visits"], geo)}

  <div class="cols"><div>
  <h2>9. Devices</h2>
  ${table(["Device", "Visitors", "Share", "Engagement", "Avg visit"], devices)}
  </div><div>
  <h2>10. Downloads</h2>
  ${table(["File", "Downloads", "People"], downloads)}
  </div></div>

  <h2>11. All tracked actions (28 days)</h2>
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
  const month = DAYS === 28 ? week : ga(28);
  const html = build(week, month);
  const tmpHtml = HTML_OUT ? path.resolve(HTML_OUT) : path.join(os.tmpdir(), `wisequest-report-${process.pid}.html`);
  fs.writeFileSync(tmpHtml, html);
  execFileSync(chrome(), ["--headless=new", "--no-sandbox", "--disable-gpu", "--no-pdf-header-footer", `--print-to-pdf=${OUT}`, `file://${tmpHtml}`], { stdio: "ignore", timeout: 120000 });
  if (!HTML_OUT) fs.rmSync(tmpHtml, { force: true });
  const o = week.overview?.rows?.[0] ?? {};
  const top = (week.pages?.rows ?? []).slice(0, 3).map((r) => ({ page: norm(r.pagePath), views: n(r.screenPageViews), engagedSec: Math.round(n(r.avgEngagementSec)) }));
  console.log(JSON.stringify({ pdf: OUT, bytes: fs.statSync(OUT).size, days: DAYS, visitors: n(o.activeUsers), pageViews: n(o.screenPageViews), engagedSecPerVisitor: n(o.activeUsers) ? Math.round(n(o.userEngagementDuration) / n(o.activeUsers)) : 0, engagementRate: Math.round(n(o.engagementRate) * 100), visitors28: n(month.overview?.rows?.[0]?.activeUsers), top }, null, 2));
}

main();
