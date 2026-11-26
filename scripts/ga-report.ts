/**
 * Read-only Google Analytics 4 reports for wisequest.org (used by the `analytics` skill).
 *
 *   npm run ga -- overview [days]     totals vs the previous period
 *   npm run ga -- pages [days]        views, users and engagement time per page
 *   npm run ga -- sources [days]      where visitors come from
 *   npm run ga -- geo [days]          countries and cities
 *   npm run ga -- devices [days]      mobile / desktop / tablet
 *   npm run ga -- daily [days]        visits per day (trend)
 *   npm run ga -- landing [days]      first page people see
 *   npm run ga -- events [days]       downloads, clicks, scrolls, video plays
 *   npm run ga -- downloads 28        which files (PDFs) were downloaded
 *   npm run ga -- feedback 28         "Was this page helpful?" answers per page (feedback_yes / feedback_no / feedback_no_<reason>)
 *   npm run ga -- realtime            people on the site right now
 *   npm run ga -- all [days]          every report above (default 28 days)
 *   add --json for machine-readable output
 *   add --compare to any report (except realtime) to also get the previous period of the same length
 *
 * Credentials (a Google service account with Viewer access to the GA property), first found wins:
 *   GA_SA_KEY_B64    base64 of the service-account JSON (one line, for cloud routines)
 *   GA_SA_KEY        the service-account JSON itself
 *   GA_SA_KEY_FILE   path to the JSON file
 *   macOS Keychain   service "ga-service-account", account "wisequest" (base64 of the JSON)
 * Uses the read-only scope only. Nothing is written to Google Analytics.
 */
import { execFileSync } from "node:child_process";
import { createSign } from "node:crypto";
import { readFileSync } from "node:fs";

const PROPERTY = process.env.GA_PROPERTY_ID ?? "565414333";
const API = `https://analyticsdata.googleapis.com/v1beta/properties/${PROPERTY}`;

type Key = { client_email: string; private_key: string };

function loadKey(): Key {
  if (process.env.GA_SA_KEY_B64) return JSON.parse(Buffer.from(process.env.GA_SA_KEY_B64, "base64").toString("utf8"));
  if (process.env.GA_SA_KEY) return JSON.parse(process.env.GA_SA_KEY);
  if (process.env.GA_SA_KEY_FILE) return JSON.parse(readFileSync(process.env.GA_SA_KEY_FILE, "utf8"));
  try {
    const b64 = execFileSync("security", ["find-generic-password", "-a", "wisequest", "-s", "ga-service-account", "-w"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
    return JSON.parse(Buffer.from(b64, "base64").toString("utf8"));
  } catch {
    throw new Error("No Google Analytics credentials. Set GA_SA_KEY / GA_SA_KEY_FILE, or store the key in the Keychain (see the analytics skill).");
  }
}

async function token(key: Key): Promise<string> {
  const b64u = (o: object | string) => Buffer.from(typeof o === "string" ? o : JSON.stringify(o)).toString("base64url");
  const now = Math.floor(Date.now() / 1000);
  const unsigned = `${b64u({ alg: "RS256", typ: "JWT" })}.${b64u({
    iss: key.client_email,
    scope: "https://www.googleapis.com/auth/analytics.readonly",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  })}`;
  const sig = createSign("RSA-SHA256").update(unsigned).sign(key.private_key).toString("base64url");
  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: `${unsigned}.${sig}` }),
  });
  const j = (await r.json()) as { access_token?: string; error_description?: string };
  if (!j.access_token) throw new Error(`Google sign-in failed: ${j.error_description ?? r.status}`);
  return j.access_token;
}

type Row = Record<string, string | number>;
type Spec = { dimensions?: string[]; metrics: string[]; orderBy?: string; desc?: boolean; limit?: number; compare?: boolean; eventName?: string; eventPrefix?: string };

const range = (days: number, offset = 0) => ({ startDate: `${days + offset}daysAgo`, endDate: offset ? `${offset + 1}daysAgo` : "yesterday" });

async function run(tok: string, spec: Spec, days: number, realtime = false): Promise<{ rows: Row[]; previous?: Row[] }> {
  const body: Record<string, unknown> = {
    metrics: spec.metrics.map((name) => ({ name })),
    dimensions: (spec.dimensions ?? []).map((name) => ({ name })),
    limit: spec.limit ?? 25,
  };
  if (spec.orderBy) body.orderBys = [{ desc: spec.desc ?? true, [spec.metrics.includes(spec.orderBy) ? "metric" : "dimension"]: spec.metrics.includes(spec.orderBy) ? { metricName: spec.orderBy } : { dimensionName: spec.orderBy } }];
  if (spec.eventPrefix) body.dimensionFilter = { filter: { fieldName: "eventName", stringFilter: { matchType: "BEGINS_WITH", value: spec.eventPrefix } } };
  if (spec.eventName) body.dimensionFilter = { filter: { fieldName: "eventName", stringFilter: { value: spec.eventName } } };
  if (!realtime) body.dateRanges = spec.compare ? [range(days), range(days, days)] : [range(days)];
  const r = await fetch(`${API}:${realtime ? "runRealtimeReport" : "runReport"}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${tok}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const j = (await r.json()) as {
    error?: { message: string };
    dimensionHeaders?: { name: string }[];
    metricHeaders?: { name: string }[];
    rows?: { dimensionValues?: { value: string }[]; metricValues: { value: string }[] }[];
  };
  if (j.error) throw new Error(j.error.message);
  const dh = (j.dimensionHeaders ?? []).map((h) => h.name);
  const mh = (j.metricHeaders ?? []).map((h) => h.name);
  const all = (j.rows ?? []).map((row) => {
    const o: Row = {};
    dh.forEach((d, i) => (o[d] = row.dimensionValues?.[i]?.value ?? ""));
    mh.forEach((m, i) => (o[m] = Number(row.metricValues[i]?.value ?? 0)));
    return o;
  });
  if (spec.compare && dh.includes("dateRange")) {
    return { rows: all.filter((r) => r.dateRange === "date_range_0"), previous: all.filter((r) => r.dateRange === "date_range_1") };
  }
  return { rows: all };
}

const REPORTS: Record<string, Spec & { realtime?: boolean; title: string }> = {
  overview: {
    title: "Overview (vs previous period)",
    metrics: ["activeUsers", "newUsers", "sessions", "screenPageViews", "engagementRate", "averageSessionDuration", "userEngagementDuration"],
    compare: true,
  },
  pages: {
    title: "Pages",
    dimensions: ["pagePath"],
    metrics: ["screenPageViews", "activeUsers", "userEngagementDuration", "engagementRate"],
    orderBy: "screenPageViews",
    limit: 50,
  },
  sources: { title: "Traffic sources", dimensions: ["sessionDefaultChannelGroup", "sessionSource"], metrics: ["sessions", "activeUsers", "engagementRate"], orderBy: "sessions" },
  geo: { title: "Countries and cities", dimensions: ["country", "city"], metrics: ["activeUsers", "sessions"], orderBy: "activeUsers" },
  devices: { title: "Devices", dimensions: ["deviceCategory"], metrics: ["activeUsers", "sessions", "engagementRate", "averageSessionDuration"], orderBy: "activeUsers" },
  daily: { title: "Daily trend", dimensions: ["date"], metrics: ["activeUsers", "sessions", "screenPageViews"], orderBy: "date", desc: false, limit: 120 },
  landing: { title: "Landing pages", dimensions: ["landingPage"], metrics: ["sessions", "engagementRate", "averageSessionDuration"], orderBy: "sessions" },
  events: { title: "Events", dimensions: ["eventName"], metrics: ["eventCount", "totalUsers"], orderBy: "eventCount" },
  downloads: { title: "Downloads (files)", dimensions: ["fileName", "linkUrl"], metrics: ["eventCount", "totalUsers"], orderBy: "eventCount", eventName: "file_download" },
  feedback: { title: "Page feedback (Was this page helpful?)", dimensions: ["pagePath", "eventName"], metrics: ["eventCount"], orderBy: "eventCount", eventPrefix: "feedback_", limit: 200 },
  realtime: { title: "Right now (last 30 minutes)", dimensions: ["unifiedScreenName"], metrics: ["activeUsers"], orderBy: "activeUsers", realtime: true },
};

const fmt = (k: string, v: string | number) => {
  if (typeof v !== "number") return v;
  if (k === "engagementRate") return `${Math.round(v * 100)}%`;
  if (k === "averageSessionDuration" || k === "avgEngagementSec") return `${Math.round(v)}s`;
  if (k === "userEngagementDuration") return `${Math.round(v / 60)}min`;
  return Number.isInteger(v) ? String(v) : v.toFixed(1);
};

function table(rows: Row[]) {
  if (!rows.length) return "(no data yet)";
  const cols = Object.keys(rows[0]).filter((c) => c !== "dateRange");
  const lines = rows.map((r) => cols.map((c) => String(fmt(c, r[c]))));
  const w = cols.map((c, i) => Math.max(c.length, ...lines.map((l) => l[i].length)));
  const line = (cells: string[]) => cells.map((c, i) => c.padEnd(w[i])).join("  ");
  return [line(cols), line(w.map((n) => "-".repeat(n))), ...lines.map(line)].join("\n");
}

async function main() {
  const args = process.argv.slice(2);
  const json = args.includes("--json");
  const compareAll = args.includes("--compare");
  const rest = args.filter((a) => a !== "--json" && a !== "--compare");
  const which = rest[0] ?? "overview";
  const days = Number(rest[1] ?? 28);
  const names = which === "all" ? Object.keys(REPORTS) : [which];
  if (!names.every((n) => REPORTS[n])) {
    console.error(`Unknown report "${which}". Use: ${Object.keys(REPORTS).join(", ")}, all`);
    process.exit(2);
  }
  const tok = await token(loadKey());
  const out: Record<string, unknown> = { property: PROPERTY, days, generatedAt: new Date().toISOString() };
  for (const n of names) {
    const spec = { ...REPORTS[n], compare: REPORTS[n].compare || (compareAll && !REPORTS[n].realtime) };
    const res = await run(tok, spec, days, spec.realtime);
    if (n === "pages") {
      // Average engagement time per user, the "time on page" people usually want.
      for (const r of [...res.rows, ...(res.previous ?? [])]) r.avgEngagementSec = Number(r.activeUsers) ? Number(r.userEngagementDuration) / Number(r.activeUsers) : 0;
    }
    out[n] = res;
    if (!json) {
      console.log(`\n## ${spec.title}${spec.realtime ? "" : ` (last ${days} days)`}`);
      console.log(table(res.rows));
      if (res.previous) console.log(`\nPrevious ${days} days:\n${table(res.previous)}`);
    }
  }
  if (json) console.log(JSON.stringify(out, null, 2));
}

main().catch((e) => {
  console.error(`✖ ${e instanceof Error ? e.message : e}`);
  process.exit(1);
});
