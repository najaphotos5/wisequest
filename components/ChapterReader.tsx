"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import type { Chapter } from "@/lib/rehype-chapters";

const MODE_KEY = "wq-reading-mode";

function readMode(): "chapters" | "full" {
  try {
    return localStorage.getItem(MODE_KEY) === "full" ? "full" : "chapters";
  } catch {
    return "chapters";
  }
}

/**
 * Shows long pages one chapter at a time (Key points → chapters with
 * Previous/Next). Every chapter stays in the HTML; without JavaScript, or in
 * "full page" mode, everything is shown.
 */
export function ChapterReader({
  chapters,
  summary,
  minutes,
  color,
  children,
}: {
  chapters: Chapter[];
  summary?: string[];
  minutes: number;
  color: string;
  children: ReactNode;
}) {
  const contentRef = useRef<HTMLDivElement>(null);
  const readerRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<"chapters" | "full">("chapters");
  const [active, setActive] = useState(0);
  const [ready, setReady] = useState(false);

  /** Index of the chapter containing the element the URL hash points to. */
  const indexFromHash = useCallback(() => {
    const id = decodeURIComponent(window.location.hash.slice(1));
    if (!id) return -1;
    const target = document.getElementById(id);
    const section = target?.closest<HTMLElement>("section[data-chapter]");
    return section ? chapters.findIndex((c) => c.id === section.id) : -1;
  }, [chapters]);

  const pendingScroll = useRef(false);

  useEffect(() => {
    setMode(readMode());
    const i = indexFromHash();
    if (i >= 0) {
      setActive(i);
      pendingScroll.current = true; // re-scroll once other chapters are hidden
    }
    setReady(true);
    const onHash = () => {
      const j = indexFromHash();
      setActive(j >= 0 ? j : 0);
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, [indexFromHash]);

  // Show only the active chapter (all of them in full mode).
  useEffect(() => {
    if (!ready) return;
    contentRef.current?.querySelectorAll<HTMLElement>("section[data-chapter]").forEach((el, i) => {
      el.hidden = mode === "chapters" && i !== active;
    });
    if (pendingScroll.current) {
      pendingScroll.current = false;
      const target = document.getElementById(decodeURIComponent(window.location.hash.slice(1)));
      requestAnimationFrame(() => (mode === "chapters" ? readerRef.current : target)?.scrollIntoView({ block: "start" }));
    }
  }, [active, mode, ready]);

  function go(i: number, { focus = true } = {}) {
    const next = Math.max(0, Math.min(chapters.length - 1, i));
    setActive(next);
    if (window.location.hash !== `#${chapters[next].id}`) history.pushState(null, "", `#${chapters[next].id}`);
    requestAnimationFrame(() => {
      readerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      if (focus) {
        const heading = document.getElementById(chapters[next].id)?.querySelector<HTMLElement>("h2") ?? document.getElementById(chapters[next].id);
        heading?.setAttribute("tabindex", "-1");
        heading?.focus({ preventScroll: true });
      }
    });
  }

  function setReadingMode(m: "chapters" | "full") {
    setMode(m);
    try {
      localStorage.setItem(MODE_KEY, m);
    } catch {}
    if (m === "chapters") go(active, { focus: false });
    else requestAnimationFrame(() => readerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  const chaptered = ready && mode === "chapters";
  const current = chapters[active];
  const nextChapter = chapters[active + 1];
  const prevChapter = chapters[active - 1];

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      {/* Key points */}
      <aside className="mx-auto max-w-3xl rounded-2xl border-l-4 bg-surface-2 p-6 sm:p-8" style={{ borderColor: color }} aria-labelledby="key-points">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="key-points" className="font-display text-2xl font-semibold">Key points</h2>
          <p className="text-sm text-muted">
            {minutes} min read · {chapters.length} chapters
          </p>
        </div>
        {summary && summary.length > 0 && (
          <ul className="mt-4 space-y-2">
            {summary.map((s) => (
              <li key={s} className="flex gap-3">
                <span aria-hidden="true" className="mt-2 h-2 w-2 shrink-0 rounded-full" style={{ background: color }} />
                <span>{s}</span>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-6 flex flex-wrap gap-3">
          <button type="button" className="btn-primary px-6 py-3 text-base" onClick={() => (mode === "chapters" ? go(0) : setReadingMode("chapters"))}>
            Start reading →
          </button>
          <button type="button" className="btn-ghost px-6 py-3 text-base" aria-pressed={mode === "full"} onClick={() => setReadingMode(mode === "full" ? "chapters" : "full")}>
            {mode === "full" ? "Read chapter by chapter" : "Show the full page"}
          </button>
        </div>
      </aside>

      <div ref={readerRef} className={`mt-12 scroll-mt-24 ${chaptered ? "lg:grid lg:grid-cols-[230px_1fr] lg:gap-12" : ""}`}>
        {chaptered && (
          <nav aria-label="Chapters" className="mb-8 lg:mb-0">
            {/* Mobile: dropdown */}
            <label className="block lg:hidden">
              <span className="sr-only">Choose a chapter</span>
              <select
                value={active}
                onChange={(e) => go(Number(e.target.value))}
                className="w-full rounded-xl border-2 border-line bg-white px-4 py-3 font-display font-medium"
              >
                {chapters.map((c, i) => (
                  <option key={c.id} value={i}>
                    Chapter {i + 1} of {chapters.length}: {c.title}
                  </option>
                ))}
              </select>
            </label>
            {/* Desktop: sticky list */}
            <ol className="sticky top-24 hidden space-y-1 lg:block">
              {chapters.map((c, i) => (
                <li key={c.id}>
                  <a
                    href={`#${c.id}`}
                    onClick={(e) => {
                      e.preventDefault();
                      go(i);
                    }}
                    aria-current={i === active ? "step" : undefined}
                    className="flex items-start gap-3 rounded-lg px-3 py-2 text-sm hover:bg-surface-2 aria-[current=step]:bg-surface-2 aria-[current=step]:font-semibold"
                  >
                    <span
                      className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 text-[10px] font-bold"
                      style={i <= active ? { background: color, borderColor: color, color: "#fff" } : { borderColor: "var(--line)" }}
                      aria-hidden="true"
                    >
                      {i < active ? "✓" : i + 1}
                    </span>
                    <span>{c.title}</span>
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        )}

        <div className="min-w-0">
          {chaptered && (
            <div className="mx-auto mb-6 max-w-3xl">
              <p className="font-display text-sm font-semibold uppercase tracking-wider" style={{ color }}>
                Chapter {active + 1} of {chapters.length}
              </p>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-2" role="progressbar" aria-label="Reading progress" aria-valuemin={1} aria-valuemax={chapters.length} aria-valuenow={active + 1}>
                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${((active + 1) / chapters.length) * 100}%`, background: color }} />
              </div>
            </div>
          )}

          <div ref={contentRef} className="prose prose-lg mx-auto max-w-3xl prose-headings:scroll-mt-24">
            {children}
          </div>

          {chaptered && current && (
            <div className="mx-auto mt-10 flex max-w-3xl flex-wrap items-center justify-between gap-3 border-t border-line pt-6">
              {prevChapter ? (
                <button type="button" className="btn-ghost" onClick={() => go(active - 1)}>
                  ← {prevChapter.title}
                </button>
              ) : (
                <span />
              )}
              {nextChapter ? (
                <button type="button" className="btn-primary px-6 py-3 text-base" onClick={() => go(active + 1)}>
                  Next: {nextChapter.title} →
                </button>
              ) : (
                <button type="button" className="btn-ghost" onClick={() => setReadingMode("full")}>
                  You&apos;ve finished. Show the full page
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
