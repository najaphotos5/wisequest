import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import credits from "@/data/image-credits.json";
import { YouTube } from "./YouTube";

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
      href={href}
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
  return <a href={href} {...props} {...(href.startsWith("http") && { target: "_blank", rel: "noopener noreferrer" })} />;
}

function Img(props: ComponentProps<"img">) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img loading="lazy" {...props} alt={props.alt ?? ""} />;
}

export function Figure({ src, alt, caption, wide }: { src: string; alt: string; caption?: string; wide?: boolean }) {
  return (
    <figure className={`not-prose my-10 ${wide ? "lg:-mx-24" : ""}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} loading="lazy" className="aspect-[16/9] w-full rounded-xl object-cover shadow-md" />
      {caption && <figcaption className="mt-2 text-sm text-muted">{caption}</figcaption>}
    </figure>
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

export const mdxComponents = { PhotoCredits, Figure, YouTube, VideoEmbed, VideoGrid, Download, Verse, Callout, Steps, Step, ButtonLink, a: A, img: Img };
