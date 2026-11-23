"use client";

import { useCallback, useEffect, useState } from "react";
import { HistoryDialog, RequestDialog, ScoresDialog } from "./DevDialogs";

/**
 * Hidden developer mode.
 *
 * Turn on:  add ?dev=1 to any URL, click the version number in the footer 5 times quickly,
 *           or press Ctrl+Shift+D (⌃⇧D on Mac).
 * Turn off: "Back to normal mode" in the banner, "Normal mode" in the panel, ?dev=0, or the same shortcut.
 * The setting is stored in this browser only (localStorage "wq-dev"). While it is on,
 * Google Analytics ignores this browser (see components/Analytics.tsx).
 */

const KEY = "wq-dev";
const UI_KEY = "wq-dev-ui"; // remembers panel open/closed and overlay choices
const OVERLAYS = [
  ["headings", "Outline headings (H1–H4)"],
  ["alt", "Show image alt text"],
  ["links", "Highlight links (external = orange)"],
  ["boxes", "Outline all boxes"],
] as const;
type Overlay = (typeof OVERLAYS)[number][0];
const REPO = "https://github.com/najaphotos5/wisequest";

import type { Change, Scores } from "./DevDialogs";
type History = { shallow: boolean; site: Change[]; byPath: Record<string, Change[]> };

type PageInfo = { source?: string; words?: number; meta?: Record<string, unknown>; summaryPoints?: number };
type Build = { version?: string; builtAt?: string; commit?: string };

function readJson<T>(id: string): T {
  try {
    return JSON.parse(document.getElementById(id)?.textContent || "{}") as T;
  } catch {
    return {} as T;
  }
}

/** Best guess at the source file for pages built from app/ (content pages embed their own). */
function guessSource(path: string) {
  const p = path.replace(/\/$/, "");
  if (p === "") return "app/page.tsx";
  return `app${p}/page.tsx`;
}

export function DevMode() {
  const [on, setOn] = useState(false);
  const [open, setOpen] = useState(false); // banner shows the essentials; click DEV to expand
  const [overlays, setOverlays] = useState<Record<Overlay, boolean>>({ headings: false, alt: false, links: false, boxes: false });
  const [stats, setStats] = useState<Record<string, string | number>>({});
  const [info, setInfo] = useState<PageInfo>({});
  const [build, setBuild] = useState<Build>({});
  const [path, setPath] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [scores, setScores] = useState<Scores | null>(null);
  const [dialog, setDialog] = useState<null | "scores" | "history" | "request">(null);
  const [history, setHistory] = useState<History | null>(null);

  // Scores and history are generated at build time (scripts/dev-data.ts) and only downloaded in dev mode.
  useEffect(() => {
    if (!on || scores) return;
    fetch("/dev-data/scores.json").then((r) => (r.ok ? r.json() : null)).then(setScores).catch(() => {});
    fetch("/dev-data/history.json").then((r) => (r.ok ? r.json() : null)).then(setHistory).catch(() => {});
  }, [on, scores]);

  // Restore / remember panel state and overlay choices across pages.
  useEffect(() => {
    try {
      const ui = JSON.parse(localStorage.getItem(UI_KEY) || "{}");
      if (typeof ui.open === "boolean") setOpen(ui.open);
      if (ui.overlays) setOverlays((o) => ({ ...o, ...ui.overlays }));
    } catch {}
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(UI_KEY, JSON.stringify({ open, overlays }));
    } catch {}
  }, [open, overlays, loaded]);

  const setMode = useCallback((v: boolean) => {
    try {
      if (v) localStorage.setItem(KEY, "1");
      else localStorage.removeItem(KEY);
      // Drop ?dev=… from the address so a refresh keeps the chosen mode.
      const url = new URL(location.href);
      if (url.searchParams.has("dev")) {
        url.searchParams.delete("dev");
        window.history.replaceState(window.history.state, "", url.pathname + url.search + url.hash);
      }
    } catch {}
    setOn(v);
  }, []);

  // Initial state, ?dev=1 / ?dev=0, keyboard shortcut and the hidden footer trigger.
  useEffect(() => {
    const q = new URLSearchParams(location.search).get("dev");
    if (q === "1" || q === "on") setMode(true);
    else if (q === "0" || q === "off") setMode(false);
    else setOn(localStorage.getItem(KEY) === "1");

    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "d") {
        e.preventDefault();
        setOn((cur) => {
          const next = !cur;
          try {
            if (next) localStorage.setItem(KEY, "1");
            else localStorage.removeItem(KEY);
          } catch {}
          return next;
        });
      }
    };
    let clicks: number[] = [];
    const onClick = (e: MouseEvent) => {
      if (!(e.target as Element)?.closest?.("[data-dev-trigger]")) return;
      const now = Date.now();
      clicks = [...clicks.filter((t) => now - t < 3000), now];
      if (clicks.length >= 5) {
        clicks = [];
        setMode(true);
        setOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    document.addEventListener("click", onClick);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("click", onClick);
    };
  }, [setMode]);

  // Gather page details whenever dev mode is on or the page changes.
  useEffect(() => {
    if (!on) return;
    const collect = () => {
      setPath(location.pathname);
      setInfo(readJson<PageInfo>("wq-page-info"));
      setBuild(readJson<Build>("wq-build"));
      const main = document.getElementById("main") ?? document.body;
      const imgs = [...main.querySelectorAll("img")];
      const links = [...main.querySelectorAll<HTMLAnchorElement>("a[href]")];
      const external = links.filter((a) => a.host && a.host !== location.host).length;
      setStats({
        "H1 / H2 / H3": ["h1", "h2", "h3"].map((h) => main.querySelectorAll(h).length).join(" / "),
        Images: imgs.length,
        "Images missing alt": imgs.filter((i) => !i.hasAttribute("alt")).length,
        "Decorative images (alt=\"\")": imgs.filter((i) => i.getAttribute("alt") === "").length,
        "Links (internal / external)": `${links.length - external} / ${external}`,
        Videos: main.querySelectorAll("iframe, [data-youtube], button[aria-label*='Play' i]").length,
        Viewport: `${window.innerWidth} × ${window.innerHeight}`,
      });
    };
    collect();
    const id = window.setInterval(() => location.pathname !== path && collect(), 800);
    return () => window.clearInterval(id);
  }, [on, path]);

  // Overlay classes on <html>.
  useEffect(() => {
    const el = document.documentElement;
    for (const [k] of OVERLAYS) el.classList.toggle(`wq-dev-${k}`, on && overlays[k]);
    el.classList.toggle("wq-dev", on);
  }, [on, overlays]);

  // Alt-text labels (images can't show pseudo-elements, so we draw positioned badges).
  useEffect(() => {
    if (!on || !overlays.alt) return;
    const layer = document.createElement("div");
    layer.setAttribute("aria-hidden", "true");
    layer.style.cssText = "position:absolute;left:0;top:0;width:0;height:0;z-index:2147483646;pointer-events:none";
    document.body.appendChild(layer);
    let raf = 0;
    const draw = () => {
      layer.textContent = "";
      document.querySelectorAll<HTMLImageElement>("main img").forEach((img) => {
        const r = img.getBoundingClientRect();
        if (r.width < 24 || r.height < 16) return;
        const alt = img.getAttribute("alt");
        const b = document.createElement("div");
        b.textContent = alt === null ? "⚠ NO ALT" : alt === "" ? 'alt="" (decorative)' : `alt: ${alt}`;
        b.style.cssText = `position:absolute;left:${r.left + scrollX + 4}px;top:${r.top + scrollY + 4}px;max-width:${Math.max(r.width - 8, 80)}px;font:600 11px/1.3 ui-monospace,monospace;padding:2px 6px;border-radius:4px;color:#fff;background:${alt === null ? "#c0392b" : alt === "" ? "#6b7785" : "#1d4ed8"};box-shadow:0 1px 3px #0006`;
        layer.appendChild(b);
      });
    };
    const schedule = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(draw);
    };
    draw();
    window.addEventListener("resize", schedule);
    const t = window.setInterval(schedule, 1500); // images load lazily / slideshow changes
    return () => {
      window.removeEventListener("resize", schedule);
      window.clearInterval(t);
      cancelAnimationFrame(raf);
      layer.remove();
    };
  }, [on, overlays.alt, path]);

  if (!on) return null;

  const source = info.source ?? guessSource(path);
  const words = info.words;
  const rows: [string, React.ReactNode][] = [
    ["Version", <span key="v">{build.version ?? "?"} · <a href={`${REPO}/blob/main/CHANGELOG.md`} target="_blank" rel="noreferrer">changelog</a></span>],
    ["Built", build.builtAt ? new Date(build.builtAt).toLocaleString() : "?"],
    ["Commit", build.commit ? <a href={`${REPO}/commit/${build.commit}`} target="_blank" rel="noreferrer">{build.commit.slice(0, 7)}</a> : "?"],
    ["Path", path],
    [
      "Source",
      <span key="s">
        <a href={`${REPO}/blob/main/${source}`} target="_blank" rel="noreferrer">{source}</a>{" "}
        · <a href={`${REPO}/edit/main/${source}`} target="_blank" rel="noreferrer">edit</a>
        {!info.source && <em> (guess)</em>}
      </span>,
    ],
    ...(words ? ([["Words / reading time", `${words} / ~${Math.max(1, Math.round(words / 200))} min`]] as [string, React.ReactNode][]) : []),
    ...Object.entries(info.meta ?? {}).map(([k, v]) => [k, String(v)] as [string, React.ReactNode]),
    ...(info.summaryPoints ? ([["Summary points", info.summaryPoints]] as [string, React.ReactNode][]) : []),
    ...Object.entries(stats).map(([k, v]) => [k, v] as [string, React.ReactNode]),
    ["Analytics", "off for this browser (dev mode)"],
  ];

  const key = path.endsWith("/") ? path : `${path}/`;
  const sc = scores?.byPath[key];
  const pageHistory = history?.byPath[key] ?? [];
  const grade = (n: number, max: number) => (n / max >= 0.85 ? "good" : n / max >= 0.65 ? "ok" : "bad");

  return (
    <>
      <div className="wq-dev-banner" role="status">
        <strong>🛠 DEV MODE</strong>
        <span>{build.version}</span>
        {sc && (
          <>
            <span className={`wq-dev-${grade(sc.textScore, 10)}`}>Text {sc.textScore}/10</span>
            <span className={`wq-dev-${grade(sc.pageScore, 100)}`}>Page {sc.pageScore}/100</span>
            {sc.rank && scores && (
              <button type="button" className="wq-dev-chip" onClick={() => setDialog("scores")} title="See all pages sorted by score">
                #{sc.rank} lowest of {scores.pages} ▸
              </button>
            )}
          </>
        )}
        {scores && !sc && (
          <button type="button" className="wq-dev-chip" onClick={() => setDialog("scores")}>All page scores ▸</button>
        )}
        <button type="button" className="wq-dev-btn" onClick={() => setDialog("history")} disabled={!history}>
          🕘 Version history
        </button>
        <button type="button" className="wq-dev-btn" onClick={() => setDialog("request")}>
          ✉ Request a change
        </button>
        <button type="button" onClick={() => setMode(false)} className="wq-dev-btn wq-dev-exit" title="Turn off dev mode and return to the normal website">
          ✕ Back to normal mode
        </button>
      </div>
      {dialog === "scores" && scores && <ScoresDialog scores={scores} current={key} onClose={() => setDialog(null)} />}
      {dialog === "history" && history && <HistoryDialog site={history.site} shallow={history.shallow} onClose={() => setDialog(null)} />}
      {dialog === "request" && <RequestDialog pageUrl={location.origin + path} onClose={() => setDialog(null)} />}
      <div className="wq-dev-panel" role="region" aria-label="Developer mode">
      <div className="wq-dev-bar">
        <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
          🛠 DEV {open ? "▾" : "▸"}
        </button>
        <button type="button" onClick={() => setMode(false)} title="Turn off dev mode (or add ?dev=0)">
          ✕ Normal mode
        </button>
      </div>
      {open && (
        <div className="wq-dev-body">
          <table>
            <tbody>
              {rows.map(([k, v]) => (
                <tr key={k}>
                  <th>{k}</th>
                  <td>{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <fieldset>
            <legend>Quality score</legend>
            {sc ? (
              <>
                <p>
                  Text <b className={`wq-dev-${grade(sc.textScore, 10)}`}>{sc.textScore}/10</b> · Page{" "}
                  <b className={`wq-dev-${grade(sc.pageScore, 100)}`}>{sc.pageScore}/100</b>
                  {scores && <span className="wq-dev-muted"> (site avg {scores.averageText} / {scores.averagePage})</span>}
                </p>
                <p className="wq-dev-muted">
                  Reading ease {sc.readingEase} · {sc.avgSentence} words/sentence · {Object.entries(sc.parts).map(([k, v]) => `${k} ${Math.round(v)}`).join(" · ")}
                </p>
                {sc.issues.length ? (
                  <ul>{sc.issues.map((i) => <li key={i}>{i}</li>)}</ul>
                ) : (
                  <p>No issues found ✓</p>
                )}
              </>
            ) : (
              <p className="wq-dev-muted">{scores ? "Not scored (redirect or special page)." : "Loading…"}</p>
            )}
          </fieldset>
          <fieldset>
            <legend>Change history</legend>
            {pageHistory.length ? (
              <ul>
                {pageHistory.map((c) => (
                  <li key={c.sha}>
                    <span className="wq-dev-muted">{c.date}</span>{" "}
                    <a href={`${REPO}/commit/${c.sha}`} target="_blank" rel="noreferrer">{c.sha}</a> {c.subject}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="wq-dev-muted">{history ? "No history found for this page's source file." : "Loading…"}</p>
            )}
            {history?.shallow && <p className="wq-dev-muted">History may be incomplete (shallow build).</p>}
            {history && history.site.length > 0 && (
              <details>
                <summary>Recent site-wide changes</summary>
                <ul>
                  {history.site.slice(0, 10).map((c) => (
                    <li key={c.sha}>
                      <span className="wq-dev-muted">{c.date}</span> {c.subject}
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </fieldset>
          <fieldset>
            <legend>Overlays</legend>
            {OVERLAYS.map(([k, label]) => (
              <label key={k}>
                <input type="checkbox" checked={overlays[k]} onChange={(e) => setOverlays((o) => ({ ...o, [k]: e.target.checked }))} /> {label}
              </label>
            ))}
          </fieldset>
          <p className="wq-dev-hint">Ctrl+Shift+D toggles · ?dev=0 turns off</p>
        </div>
      )}
      </div>
    </>
  );
}
