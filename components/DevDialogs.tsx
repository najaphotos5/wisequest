"use client";

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { site } from "@/lib/site";

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
  fixes?: string[];
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

export function ScoresDialog({
  scores,
  current,
  history,
  onClose,
  onRequest,
}: {
  scores: Scores;
  current: string;
  history?: Record<string, Change[]>;
  onClose: () => void;
  onRequest?: (pagePath: string, text: string) => void;
}) {
  const [sort, setSort] = useState<{ col: Col; asc: boolean }>({ col: "pageScore", asc: true });
  const [openRow, setOpenRow] = useState<string | null>(null);
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
            <Fragment key={p.path}>
              <tr className={p.path === current ? "wq-dev-current" : undefined}>
                <td>
                  <a href={p.path}>{p.path}</a>
                </td>
                <td className={cls(p.pageScore, 100)}>{p.pageScore}</td>
                <td className={cls(p.textScore, 10)}>{p.textScore}</td>
                {(["structure", "accessibility", "media", "freshness"] as const).map((k) => (
                  <td key={k} className={cls(p.parts[k] ?? 0, 100)}>{Math.round(p.parts[k] ?? 0)}</td>
                ))}
                <td>{p.words}</td>
                <td>
                  <button type="button" className="wq-dev-issues-btn" onClick={() => setOpenRow((r) => (r === p.path ? null : p.path))} aria-expanded={openRow === p.path}>
                    {p.issues.length} {openRow === p.path ? "▾" : "▸"}
                  </button>
                </td>
              </tr>
              {openRow === p.path && (
                <tr className="wq-dev-detail">
                  <td colSpan={9}>
                    <IssueDetail page={p} history={history?.[p.path] ?? []} onRequest={onRequest} />
                  </td>
                </tr>
              )}
            </Fragment>
          ))}
        </tbody>
      </table>
    </Dialog>
  );
}

/** Builds the request text for a set of issues on one page. */
function fixRequestText(page: PageScore, idx: number[]) {
  const fixes = page.fixes ?? [];
  const lines = idx.map((i, n) => `${n + 1}. ${page.issues[i]} → ${fixes[i] ?? "Review and fix."}`);
  return `Fix ${idx.length === 1 ? "this issue" : `these ${idx.length} issues`} on ${page.path}:\n${lines.join("\n")}`;
}

/** Issues for one page, the suggested change for each, a one-line summary, recent edits, and request buttons. */
function IssueDetail({ page, history, onRequest }: { page: PageScore; history: Change[]; onRequest?: (pagePath: string, text: string) => void }) {
  const [picked, setPicked] = useState<number[]>([]);
  if (!page.issues.length) return <p className="wq-dev-good">No issues found on this page ✓</p>;
  const fixes = page.fixes ?? [];
  const weakest = Object.entries(page.parts).sort((a, b) => a[1] - b[1])[0];
  const all = page.issues.map((_, i) => i);
  const request = (idx: number[]) => onRequest?.(page.path, fixRequestText(page, idx));
  const toggle = (i: number) => setPicked((p) => (p.includes(i) ? p.filter((x) => x !== i) : [...p, i].sort((a, b) => a - b)));
  return (
    <div className="wq-dev-issue-detail">
      <p>
        <b>Summary:</b> {page.issues.length} issue{page.issues.length > 1 ? "s" : ""} found. Weakest area: <b>{weakest[0]}</b> ({Math.round(weakest[1])}/100). Fixing
        these would mainly improve the {page.textScore < 7 ? "text score" : "page score"}.
      </p>
      <table className="wq-dev-table">
        <thead>
          <tr>
            {onRequest && (
              <th>
                <input
                  type="checkbox"
                  aria-label="Select all issues"
                  checked={picked.length === all.length}
                  onChange={(e) => setPicked(e.target.checked ? all : [])}
                />
              </th>
            )}
            <th>#</th>
            <th>Issue</th>
            <th>Suggested change</th>
            {onRequest && <th />}
          </tr>
        </thead>
        <tbody>
          {page.issues.map((issue, i) => (
            <tr key={issue}>
              {onRequest && (
                <td>
                  <input type="checkbox" aria-label={`Select issue ${i + 1}`} checked={picked.includes(i)} onChange={() => toggle(i)} />
                </td>
              )}
              <td>{i + 1}</td>
              <td>{issue}</td>
              <td>{fixes[i] ?? "Review and fix."}</td>
              {onRequest && (
                <td>
                  <button type="button" className="wq-dev-fix-btn" onClick={() => request([i])}>
                    Request fix
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      {onRequest && (
        <div className="wq-dev-actions wq-dev-fix-actions">
          <button type="button" className="wq-dev-send" disabled={!picked.length} onClick={() => request(picked)}>
            Request selected fixes ({picked.length})
          </button>
          <button type="button" onClick={() => request(all)}>
            Request all {page.issues.length} fixes
          </button>
        </div>
      )}
      {history.length > 0 && (
        <p className="wq-dev-muted">
          Recent changes to this page: {history.slice(0, 3).map((c) => `${c.date} ${c.subject}`).join(" · ")}
        </p>
      )}
    </div>
  );
}

// ---------- 2. Request a change via Telegram ----------
/** Builds the message: always starts with /todo (added only if missing), then the request, then the page link. */
export function buildTodo(input: string, pageUrl: string | null) {
  const text = input.trim();
  const body = /^\/todo(@\w+)?\b/i.test(text) ? text : `/todo ${text}`;
  return pageUrl ? `${body}\n(page: ${pageUrl})` : body;
}

/** Re-encode any image as PNG (the only image type browsers can reliably put on the clipboard). */
function toPng(blob: Blob): Promise<Blob> {
  if (blob.type === "image/png") return Promise.resolve(blob);
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = img.naturalWidth;
      c.height = img.naturalHeight;
      c.getContext("2d")!.drawImage(img, 0, 0);
      c.toBlob((b) => (b ? resolve(b) : reject(new Error("convert failed"))), "image/png");
      URL.revokeObjectURL(img.src);
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(blob);
  });
}

const PASS_KEY = "wq-dev-relay-pass";

async function blobToBase64(blob: Blob): Promise<string> {
  const buf = new Uint8Array(await blob.arrayBuffer());
  let bin = "";
  for (let i = 0; i < buf.length; i += 0x8000) bin += String.fromCharCode(...buf.subarray(i, i + 0x8000));
  return btoa(bin);
}

/** Shrink big screenshots so the upload stays small (max 1600px wide, JPEG). */
function shrink(blob: Blob): Promise<Blob> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, 1600 / img.naturalWidth);
      if (scale === 1 && blob.size < 1_500_000) return resolve(blob);
      const c = document.createElement("canvas");
      c.width = Math.round(img.naturalWidth * scale);
      c.height = Math.round(img.naturalHeight * scale);
      c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
      c.toBlob((b) => resolve(b ?? blob), "image/jpeg", 0.85);
    };
    img.onerror = () => resolve(blob);
    img.src = URL.createObjectURL(blob);
  });
}

async function relay(body: Record<string, unknown>) {
  // text/plain avoids a CORS pre-flight, which Apps Script doesn't answer.
  const r = await fetch(site.devRelayUrl, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(body), redirect: "follow" });
  return (await r.json()) as { ok: boolean; error?: string; warning?: string; message_id?: number; issue?: number };
}

export function RequestDialog({ pageUrl, initialText = "", onClose }: { pageUrl: string; initialText?: string; onClose: () => void }) {
  const [text, setText] = useState(initialText);
  const [withPage, setWithPage] = useState(true);
  const [image, setImage] = useState<{ blob: Blob; url: string } | null>(null);
  const [status, setStatus] = useState("");
  const [pass, setPass] = useState(() => (typeof localStorage !== "undefined" ? localStorage.getItem(PASS_KEY) ?? "" : ""));
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState<string | null>(null);
  const canRelay = Boolean(site.devRelayUrl);
  const send = async () => {
    if (!ready || sending) return;
    if (!pass) return setStatus("Enter the dev passcode first.");
    setSending(true);
    setStatus("Sending…");
    try {
      const img = image ? await shrink(image.blob) : null;
      const res = await relay({
        passcode: pass,
        text: buildTodo(text, null),
        page: withPage ? pageUrl : "",
        ...(img ? { imageBase64: await blobToBase64(img), imageType: img.type || "image/png" } : {}),
      });
      if (!res.ok) {
        if (res.error === "Wrong passcode") localStorage.removeItem(PASS_KEY);
        setStatus(`✕ ${res.error ?? "Failed to send"}`);
      } else {
        localStorage.setItem(PASS_KEY, pass);
        setSent(`✓ Sent to the Wisequest group${res.issue ? ` (request queued as #${res.issue})` : ""}. The hourly assistant will react 👀 and reply there.${res.warning ? ` Note: ${res.warning}` : ""}`);
        setStatus("");
      }
    } catch {
      setStatus("✕ Couldn't reach the relay. Use “Open Telegram” instead.");
    } finally {
      setSending(false);
    }
  };
  const ref = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  useEffect(() => ref.current?.focus(), []);
  useEffect(() => () => { if (image) URL.revokeObjectURL(image.url); }, [image]);
  const message = buildTodo(text, withPage ? pageUrl : null);
  const ready = text.replace(/^\/todo(@\w+)?/i, "").trim().length > 3;
  // Telegram share puts the "url" field first, so the whole message goes there to keep /todo at the start.
  const share = `https://t.me/share/url?url=${encodeURIComponent(message)}`;

  const takeImage = (file: File | Blob | null | undefined) => {
    if (!file || !file.type.startsWith("image/")) return false;
    setImage({ blob: file, url: URL.createObjectURL(file) });
    setStatus("");
    return true;
  };
  const onPaste = (e: React.ClipboardEvent) => {
    const item = [...e.clipboardData.items].find((i) => i.type.startsWith("image/"));
    if (item && takeImage(item.getAsFile())) e.preventDefault();
  };
  const copyImage = () => {
    if (!image || !("ClipboardItem" in window)) return false;
    // Pass a Promise so the copy still counts as part of the click (required by Safari).
    navigator.clipboard
      .write([new ClipboardItem({ "image/png": toPng(image.blob) })])
      .then(() => setStatus("✓ Image copied. In Telegram, choose the Wisequest group, then press ⌘V (Ctrl+V) to attach it before sending."))
      .catch(() => setStatus("Couldn't copy the image automatically. Use “Copy image” below, or attach the screenshot in Telegram."));
    return true;
  };

  return (
    <Dialog title="Request a change" onClose={onClose}>
      <div onPaste={onPaste} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); takeImage(e.dataTransfer.files[0]); }}>
        <label htmlFor="wq-dev-req">What should change?</label>
        <textarea
          id="wq-dev-req"
          ref={ref}
          rows={initialText ? 8 : 4}
          value={text}
          placeholder={'e.g. "Fix the typo in the second paragraph" (you can start with /todo or not).\nPaste (⌘V) or drop a screenshot here to include it.'}
          onChange={(e) => setText(e.target.value)}
        />
        <div className="wq-dev-image-row">
          {image ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image.url} alt="Screenshot to include with the request" className="wq-dev-thumb" />
              <button type="button" onClick={() => { setImage(null); setStatus(""); }}>Remove image</button>
            </>
          ) : (
            <button type="button" onClick={() => fileRef.current?.click()}>📎 Add a screenshot</button>
          )}
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => takeImage(e.target.files?.[0])} />
        </div>
        <label className="wq-dev-check">
          <input type="checkbox" checked={withPage} onChange={(e) => setWithPage(e.target.checked)} /> Include a link to this page
        </label>
        <p className="wq-dev-muted">Message that will be sent{image ? " (as the image caption)" : ""}:</p>
        <pre className="wq-dev-preview">{message}</pre>
        {canRelay && !sent && (
          <label className="wq-dev-pass">
            Dev passcode{" "}
            <input type="password" value={pass} onChange={(e) => setPass(e.target.value)} autoComplete="off" placeholder="asked once, then remembered" />
          </label>
        )}
        {sent && <p className="wq-dev-status">{sent}</p>}
        <div className="wq-dev-actions">
          {canRelay && !sent && (
            <button type="button" className="wq-dev-send" onClick={send} disabled={!ready || sending}>
              {sending ? "Sending…" : "Send now ➤"}
            </button>
          )}
          <a
            href={ready ? share : undefined}
            aria-disabled={!ready}
            target="_blank"
            rel="noreferrer"
            className={`wq-dev-primary${canRelay ? " wq-dev-secondary" : ""}${ready ? "" : " wq-dev-disabled"}`}
            onClick={(e) => {
              if (!ready) return e.preventDefault();
              if (!copyImage()) setTimeout(onClose, 300);
            }}
          >
            {canRelay ? "or open Telegram" : "Open Telegram to send →"}
          </a>
          <button type="button" onClick={() => navigator.clipboard?.writeText(message)} disabled={!ready}>
            Copy message
          </button>
          {image && (
            <button type="button" onClick={copyImage}>
              Copy image
            </button>
          )}
        </div>
        {status && <p className="wq-dev-status">{status}</p>}
        <p className="wq-dev-muted">
          {canRelay ? (
            <>
              <b>Send now</b> posts it in the Wisequest group as the bot (with the screenshot) and queues it for the hourly assistant. Or open Telegram to send it
              from your own account.
            </>
          ) : (
            <>
              Telegram opens with the message ready: choose the <b>Wisequest</b> group and press Send{image ? " (after pasting the image with ⌘V)" : ""}. It is sent
              from your own account, so the hourly assistant picks it up.
            </>
          )}
        </p>
      </div>
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
