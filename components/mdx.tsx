import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import credits from "@/data/image-credits.json";
import { YouTube } from "./YouTube";
import { asset } from "@/lib/asset";

function VideoEmbed({ src, title = "Embedded video" }: { src: string; title?: string }) {
  return (
    <span className="not-prose my-6 block aspect-video overflow-hidden rounded-xl border border-line bg-surface-2">
      <iframe src={src} title={title} loading="lazy" allowFullScreen className="h-full w-full" />
    </span>
  );
}

function VideoGrid({ children }: { children: ReactNode }) {
  return <div className="not-prose my-8 grid gap-4 sm:grid-cols-2">{children}</div>;
}

export function Download({ href, title, note }: { href: string; title: string; note?: string }) {
  const ext = href.split(".").pop()?.toUpperCase() ?? "FILE";
  return (
    <a
      href={asset(href)}
      target="_blank"
      rel="noopener"
      className="not-prose my-3 flex items-center gap-4 rounded-xl border border-line bg-surface p-4 no-underline transition hover:border-brand"
    >
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-brand-soft text-xs font-bold text-brand">{ext}</span>
      <span className="min-w-0">
        <span className="block font-semibold text-ink">{title}</span>
        <span className="block text-sm text-muted">{note ?? `Read online or download (${ext})`}</span>
      </span>
    </a>
  );
}

export function Verse({ children, cite }: { children: ReactNode; cite: string }) {
  return (
    <figure className="not-prose my-8 rounded-2xl border-l-4 border-accent bg-surface p-6 shadow-sm">
      <blockquote className="font-serif text-lg leading-relaxed text-ink">{children}</blockquote>
      <figcaption className="mt-3 text-sm font-semibold text-brand">{cite}</figcaption>
    </figure>
  );
}

export function Callout({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <aside className="not-prose my-8 rounded-2xl bg-brand-soft p-6">
      {title && <p className="font-serif text-lg font-semibold text-ink">{title}</p>}
      <div className="mt-2 space-y-3 text-ink [&_a]:font-semibold [&_a]:text-brand [&_a]:underline">{children}</div>
    </aside>
  );
}

export function Steps({ children }: { children: ReactNode }) {
  return <ol className="not-prose my-8 space-y-4 [counter-reset:step]">{children}</ol>;
}

export function Step({ title, children }: { title: string; children: ReactNode }) {
  return (
    <li className="relative rounded-2xl border border-line bg-surface p-5 pl-16 [counter-increment:step] before:absolute before:left-5 before:top-5 before:grid before:h-8 before:w-8 before:place-items-center before:rounded-full before:bg-brand before:text-sm before:font-bold before:text-brand-ink before:content-[counter(step)]">
      <p className="font-semibold text-ink">{title}</p>
      <div className="mt-1 space-y-2 text-muted [&_a]:font-semibold [&_a]:text-brand [&_a]:underline">{children}</div>
    </li>
  );
}

export function ButtonLink({ href, children, variant = "primary" }: { href: string; children: ReactNode; variant?: "primary" | "ghost" }) {
  return (
    <Link href={href} className={`${variant === "primary" ? "btn-primary" : "btn-ghost"} not-prose no-underline`}>
      {children}
    </Link>
  );
}

function A({ href = "", ...props }: ComponentProps<"a">) {
  if (href.startsWith("/") && !/\.\w{2,4}$/.test(href)) return <Link href={href} {...props} />;
  return <a href={asset(href)} {...props} {...(href.startsWith("http") && { target: "_blank", rel: "noopener noreferrer" })} />;
}

function Img(props: ComponentProps<"img">) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img loading="lazy" {...props} src={typeof props.src === "string" ? asset(props.src) : props.src} alt={props.alt ?? ""} />;
}

export function Figure({ src, alt, caption, wide }: { src: string; alt: string; caption?: string; wide?: boolean }) {
  return (
    <figure className={`not-prose my-10 ${wide ? "lg:-mx-24" : ""}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={asset(src)} alt={alt} loading="lazy" className="aspect-[16/9] w-full rounded-xl object-cover shadow-md" />
      {caption && <figcaption className="mt-2 text-sm text-muted">{caption}</figcaption>}
    </figure>
  );
}

const compareKinds = {
  islam: { label: "Islamic View", mark: "🕌", cell: "bg-brand-soft", note: "A summary of the teaching, with its Quran reference" },
  jesus: { label: "Jesus’ View", mark: "✝️", cell: "bg-brand-soft", note: undefined },
  church: { label: "Church Teachings", mark: "❌", cell: "bg-rose-50", note: undefined },
} as const;

// Same table on every screen: on phones it keeps its columns and scrolls sideways, with # and Aspect pinned on the left.
const compareCols = "grid grid-cols-[2rem_6.25rem_12.5rem_12.5rem_12.5rem] md:grid-cols-[2.5rem_minmax(7rem,0.7fr)_1fr_1fr_1fr]";
const pinNum = "sticky left-0 z-10 md:static";
const pinAspect = "sticky left-8 z-10 shadow-[3px_0_6px_-3px_rgba(0,0,0,0.25)] md:static md:shadow-none";

export function CompareChart({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <div className="not-prose my-8 lg:-mx-24">
      {title && <h2 className="mb-4 text-center font-serif text-2xl font-semibold text-ink md:text-3xl">{title}</h2>}
      <p className="mb-2 text-center text-xs text-muted md:hidden">Swipe sideways to see all columns →</p>
      <div className="overflow-x-auto overscroll-x-contain rounded-xl border border-line bg-surface shadow-sm">
        <div role="table" aria-label={title ?? "Comparison of the Islamic view, Jesus’ view, and Church teachings"} className="min-w-[46rem] md:min-w-0">
          <div role="row" className={`divide-x divide-white/20 bg-brand text-xs font-bold text-white md:text-sm ${compareCols}`}>
            <span role="columnheader" className={`bg-brand px-1 py-3 text-center ${pinNum}`}>#</span>
            <span role="columnheader" className={`bg-brand px-3 py-3 md:px-4 ${pinAspect}`}>Aspect</span>
            {Object.values(compareKinds).map((k) => (
              <span key={k.label} role="columnheader" className="px-3 py-3 md:px-4">
                {k.label} {k.mark}
                {k.note && <span className="block text-[0.7rem] font-normal opacity-90 md:text-xs">{k.note}</span>}
              </span>
            ))}
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

export function CompareTopic({ num, title, children }: { num?: number | string; title: string; children: ReactNode }) {
  return (
    <div role="row" className={`divide-x divide-line border-t border-line ${compareCols}`}>
      <div role="cell" className={`bg-surface px-1 py-3 text-center text-xs font-semibold text-muted md:py-4 md:text-sm ${pinNum}`}>
        {num}
      </div>
      <div role="rowheader" className={`bg-surface-2 px-3 py-3 font-serif text-sm font-semibold leading-snug text-ink md:px-4 md:py-4 md:text-base ${pinAspect}`}>
        {title}
      </div>
      {children}
    </div>
  );
}

export function CompareView({ kind, source, children }: { kind: keyof typeof compareKinds; source?: string; children: ReactNode }) {
  return (
    <div role="cell" className={`px-3 py-3 text-sm leading-relaxed text-ink md:px-4 md:py-4 md:text-[0.95rem] ${compareKinds[kind].cell}`}>
      {children}
      {source && (
        <p className="mt-2 border-t border-line pt-2 text-xs text-muted md:text-sm">
          <span className="font-semibold">Quran reference:</span> {source.replace(/^Quran\s*/, "")}
        </p>
      )}
    </div>
  );
}

function PhotoCredits() {
  return (
    <ul className="text-sm">
      {Object.entries(credits).map(([key, c]) => (
        <li key={key}>
          <a href={c.source} target="_blank" rel="noopener noreferrer">{c.title}</a>
          {c.creator ? ` by ${c.creator}` : ""} ({c.license})
        </li>
      ))}
    </ul>
  );
}

export const mdxComponents = { PhotoCredits, Figure, YouTube, VideoEmbed, VideoGrid, Download, Verse, Callout, Steps, Step, ButtonLink, CompareChart, CompareTopic, CompareView, a: A, img: Img };
