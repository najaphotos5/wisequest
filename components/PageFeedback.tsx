"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

/**
 * "Was this page helpful?" at the bottom of every page (rendered once in app/layout.tsx).
 *
 * Sends Google Analytics events, read per page with the built-in pagePath dimension (no GA admin setup needed):
 *   feedback_yes, feedback_no, and after a "No" one of feedback_no_unclear / _missing / _wrong / _other.
 * Each event also carries { feedback, reason, page_path } for custom dimensions later.
 * No free text is collected, so nothing personal can reach analytics. A vote is remembered per page in this browser.
 */
const REASONS = [
  { id: "unclear", label: "Hard to understand" },
  { id: "missing", label: "Missing information" },
  { id: "wrong", label: "Something looks wrong" },
  { id: "other", label: "Something else" },
] as const;

type State = "ask" | "yes" | "no" | "done";
const key = (p: string) => `wq-feedback:${p}`;

function send(name: string, params: Record<string, string>) {
  const w = window as unknown as { gtag?: (...a: unknown[]) => void };
  w.gtag?.("event", name, params);
}

function Thumb({ down = false }: { down?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={`h-[18px] w-[18px] ${down ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 10v11H4a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1h3Z" />
      <path d="M7 10l4.2-7.1a1.8 1.8 0 0 1 3.3 1.3L13.6 9H19a2 2 0 0 1 2 2.3l-1.3 7.7A2.4 2.4 0 0 1 17.3 21H7" />
    </svg>
  );
}

/**
 * `inline`: placed right after an article (before "Your next step"). `global`: the fallback at the bottom of every
 * page (app/layout.tsx); it hides itself when the page already has an inline one, so each page shows exactly one.
 */
export function PageFeedback({ placement = "global" }: { placement?: "inline" | "global" }) {
  const path = usePathname() || "/";
  const [state, setState] = useState<State>("ask");
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if (placement === "global") setHidden(Boolean(document.querySelector('[data-feedback="inline"]')));
  }, [placement, path]);

  useEffect(() => {
    try {
      setState(localStorage.getItem(key(path)) ? "done" : "ask");
    } catch {
      setState("ask");
    }
  }, [path]);

  const remember = (v: string) => {
    try {
      localStorage.setItem(key(path), v);
    } catch {}
  };

  const vote = (yes: boolean) => {
    send(yes ? "feedback_yes" : "feedback_no", { feedback: yes ? "helpful" : "not_helpful", page_path: path });
    remember(yes ? "yes" : "no");
    setState(yes ? "yes" : "no");
  };

  const reason = (id: string) => {
    send(`feedback_no_${id}`, { feedback: "not_helpful", reason: id, page_path: path });
    setState("done");
  };

  const btn =
    "inline-flex items-center gap-2 rounded-full border border-line bg-surface px-4 py-2 text-sm font-medium text-ink shadow-sm transition hover:-translate-y-px hover:border-brand hover:bg-brand-soft hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";

  if (hidden) return null;

  return (
    <section aria-label="Page feedback" data-feedback={placement} className={placement === "inline" ? "bg-surface" : "border-t border-line bg-surface"}>
      <div className={`mx-auto flex min-h-[4.5rem] max-w-3xl ${placement === "inline" ? "border-t border-line" : ""} flex-wrap items-center justify-center gap-x-5 gap-y-3 px-4 py-6 text-center`} aria-live="polite">
        {state === "ask" && (
          <>
            <p className="font-serif text-base text-ink/80">Was this page helpful?</p>
            <div className="flex gap-3">
              <button type="button" className={btn} onClick={() => vote(true)}>
                <Thumb /> Yes
              </button>
              <button type="button" className={btn} onClick={() => vote(false)}>
                <Thumb down /> No
              </button>
            </div>
          </>
        )}
        {state === "yes" && <p className="text-sm text-muted">Thank you for letting us know. We are glad it helped.</p>}
        {state === "no" && (
          <div className="flex w-full flex-col items-center gap-3">
            <p className="text-sm text-muted">Thank you. What could be better?</p>
            <div className="flex flex-wrap justify-center gap-2">
              {REASONS.map((r) => (
                <button key={r.id} type="button" onClick={() => reason(r.id)} className="rounded-full border border-line bg-surface-2 px-3 py-1.5 text-xs font-medium text-ink/80 transition hover:border-brand hover:bg-brand-soft hover:text-brand">
                  {r.label}
                </button>
              ))}
            </div>
          </div>
        )}
        {state === "done" && (
          <p className="text-sm text-muted">
            Thank you for your feedback. Questions or suggestions?{" "}
            <Link href="/contact" className="font-medium text-brand underline-offset-4 hover:underline">
              Contact us
            </Link>
          </p>
        )}
      </div>
    </section>
  );
}
