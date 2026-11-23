"use client";

import { useEffect, useMemo, useRef, useState } from "react";

/** Pop-up windows used by dev mode (components/DevMode.tsx). Only rendered while dev mode is on. */

export type PageScore = {
  path: string;
  textScore: number;
  pageScore: number;
  readingEase: number;
  avgSentence: number;
  words: number;
  rank?: number;
  parts: Record<string, number>;
  issues: string[];
};
export type Scores = { pages: number; averageText: number; averagePage: number; generatedAt: string; byPath: Record<string, PageScore> };
export type Change = { sha: string; date: string; subject: string };

const REPO = "https://github.com/najaphotos5/wisequest";

function Dialog({ title, onClose, children, wide }: { title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="wq-dev-overlay" onClick={onClose}>
      <div className={`wq-dev-dialog${wide ? " wq-dev-dialog-wide" : ""}`} role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <div className="wq-dev-dialog-head">
          <strong>{title}</strong>
          <button type="button" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <div className="wq-dev-dialog-body">{children}</div>
      </div>
    </div>
  );
}

// ---------- 1. All pages, sortable by any score ----------
const COLUMNS = [
  ["pageScore", "Page /100"],
  ["textScore", "Text /10"],
  ["structure", "Structure"],
  ["accessibility", "Access."],
  ["media", "Media"],
  ["freshness", "Fresh"],
  ["words", "Words"],
  ["issues", "Issues"],
] as const;
type Col = (typeof COLUMNS)[number][0];

function value(p: PageScore, c: Col): number {
  if (c === "pageScore" || c === "textScore" || c === "words") return p[c];
  if (c === "issues") return p.issues.length;
  return p.parts[c] ?? 0;
}

export function ScoresDialog({ scores, current, onClose }: { scores: Scores; current: string; onClose: () => void }) {
  const [sort, setSort] = useState<{ col: Col; asc: boolean }>({ col: "pageScore", asc: true });
  const rows = useMemo(() => {
    const list = Object.values(scores.byPath);
    return list.sort((a, b) => (value(a, sort.col) - value(b, sort.col)) * (sort.asc ? 1 : -1) || a.path.localeCompare(b.path));
  }, [scores, sort]);
  const cls = (n: number, max: number) => (n / max >= 0.85 ? "wq-dev-good" : n / max >= 0.65 ? "wq-dev-ok" : "wq-dev-bad");
  return (
    <Dialog title={`All pages by score (${scores.pages} pages · site average: text ${scores.averageText}/10, page ${scores.averagePage}/100)`} onClose={onClose} wide>
      <p className="wq-dev-muted">Click a column to sort (click again to reverse). Click a page to open it. Scores are computed when the site is built.</p>
      <table className="wq-dev-table">
        <thead>
          <tr>
            <th>Page</th>
            {COLUMNS.map(([c, label]) => (
              <th key={c}>
                <button type="button" onClick={() => setSort((s) => ({ col: c, asc: s.col === c ? !s.asc : c === "words" || c === "issues" ? false : true }))}>
                  {label} {sort.col === c ? (sort.asc ? "▲" : "▼") : ""}
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((p) => (
            <tr key={p.path} className={p.path === current ? "wq-dev-current" : undefined}>
              <td>
                <a href={p.path} title={p.issues.join("\n") || "No issues"}>{p.path}</a>
              </td>
              <td className={cls(p.pageScore, 100)}>{p.pageScore}</td>
              <td className={cls(p.textScore, 10)}>{p.textScore}</td>
              {(["structure", "accessibility", "media", "freshness"] as const).map((k) => (
                <td key={k} className={cls(p.parts[k] ?? 0, 100)}>{Math.round(p.parts[k] ?? 0)}</td>
              ))}
              <td>{p.words}</td>
              <td title={p.issues.join("\n")}>{p.issues.length}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Dialog>
  );
}

// ---------- 2. Request a change via Telegram ----------
/** Builds the message: always starts with /todo (added only if missing), then the request, then the page link. */
export function buildTodo(input: string, pageUrl: string | null) {
  const text = input.trim();
  const body = /^\/todo(@\w+)?\b/i.test(text) ? text : `/todo ${text}`;
  return pageUrl ? `${body}\n(page: ${pageUrl})` : body;
}

export function RequestDialog({ pageUrl, onClose }: { pageUrl: string; onClose: () => void }) {
  const [text, setText] = useState("");
  const [withPage, setWithPage] = useState(true);
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => ref.current?.focus(), []);
  const message = buildTodo(text, withPage ? pageUrl : null);
  const ready = text.replace(/^\/todo(@\w+)?/i, "").trim().length > 3;
  // Telegram share puts the "url" field first, so the whole message goes there to keep /todo at the start.
  const share = `https://t.me/share/url?url=${encodeURIComponent(message)}`;
  return (
    <Dialog title="Request a change" onClose={onClose}>
      <label htmlFor="wq-dev-req">What should change?</label>
      <textarea
        id="wq-dev-req"
        ref={ref}
        rows={4}
        value={text}
        placeholder='e.g. "Fix the typo in the second paragraph" (you can start with /todo or not)'
        onChange={(e) => setText(e.target.value)}
      />
      <label className="wq-dev-check">
        <input type="checkbox" checked={withPage} onChange={(e) => setWithPage(e.target.checked)} /> Include a link to this page
      </label>
      <p className="wq-dev-muted">Message that will be sent:</p>
      <pre className="wq-dev-preview">{message}</pre>
      <div className="wq-dev-actions">
        <a
          href={ready ? share : undefined}
          aria-disabled={!ready}
          target="_blank"
          rel="noreferrer"
          className={`wq-dev-primary${ready ? "" : " wq-dev-disabled"}`}
          onClick={(e) => {
            if (!ready) e.preventDefault();
            else setTimeout(onClose, 300);
          }}
        >
          Open Telegram to send →
        </a>
        <button type="button" onClick={() => navigator.clipboard?.writeText(message)} disabled={!ready}>
          Copy message
        </button>
      </div>
      <p className="wq-dev-muted">
        Telegram opens with the message ready: choose the <b>Wisequest</b> group and press Send. It is sent from your own account, so the hourly
        assistant picks it up (it ignores messages from bots, and the bot&apos;s secret key can&apos;t be stored in the website).
      </p>
    </Dialog>
  );
}

// ---------- 3. Site-wide version history ----------
export function HistoryDialog({ site, shallow, onClose }: { site: Change[]; shallow: boolean; onClose: () => void }) {
  const [q, setQ] = useState("");
  const rows = site.filter((c) => !q || `${c.subject} ${c.date} ${c.sha}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <Dialog title={`Version history (whole site · ${site.length} changes)`} onClose={onClose} wide>
      <input className="wq-dev-search" type="search" placeholder="Search changes…" value={q} onChange={(e) => setQ(e.target.value)} />
      <table className="wq-dev-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Version / summary</th>
            <th>Commit</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((c) => {
            const m = c.subject.match(/^(v\d+\.\d+\.\d+):\s*(.*)$/);
            return (
              <tr key={c.sha}>
                <td className="wq-dev-nowrap">{c.date}</td>
                <td>
                  {m ? (
                    <>
                      <b>{m[1]}</b> {m[2]}
                    </>
                  ) : (
                    c.subject
                  )}
                </td>
                <td>
                  <a href={`${REPO}/commit/${c.sha}`} target="_blank" rel="noreferrer">{c.sha}</a>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {shallow && <p className="wq-dev-muted">History may be incomplete (shallow build).</p>}
      <p className="wq-dev-muted">
        From the site&apos;s git history. Full details: <a href={`${REPO}/commits/main`} target="_blank" rel="noreferrer">GitHub</a> ·{" "}
        <a href={`${REPO}/blob/main/CHANGELOG.md`} target="_blank" rel="noreferrer">CHANGELOG</a>
      </p>
    </Dialog>
  );
}
