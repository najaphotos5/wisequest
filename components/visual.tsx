import Link from "next/link";
import type { ReactNode } from "react";
import { sectionColor } from "@/lib/visuals";
import { asset } from "@/lib/asset";

export function Tag({ section, className = "" }: { section: string; className?: string }) {
  return (
    <span className={`inline-block rounded-md px-2.5 py-1 font-display text-xs font-semibold text-white ${className}`} style={{ background: sectionColor(section) }}>
      # {section}
    </span>
  );
}

/** Black pill section heading. */
export function SectionTitle({ children, id, light }: { children: ReactNode; id?: string; light?: boolean }) {
  return (
    <div className="flex justify-center">
      <h2 id={id} className={`rounded-full px-8 py-2.5 text-center font-display text-xl font-semibold sm:text-2xl ${light ? "bg-white text-ink" : "bg-ink text-white"}`}>
        {children}
      </h2>
    </div>
  );
}

/** Photo card: image with a colored section tag and matching bottom stripe. */
export function ImageCard({ href, image, section, title, body, size = "md" }: { href: string; image: string; section: string; title: string; body?: string; size?: "md" | "lg" }) {
  const color = sectionColor(section);
  return (
    <Link href={href} className="group flex h-full flex-col overflow-hidden rounded-xl bg-white shadow-[0_4px_24px_rgba(0,0,0,0.08)] transition hover:-translate-y-1 hover:shadow-[0_10px_32px_rgba(0,0,0,0.14)]">
      <div className="relative overflow-hidden border-b-4" style={{ borderColor: color }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={asset(image)} alt="" loading="lazy" className={`w-full object-cover transition duration-500 group-hover:scale-105 ${size === "lg" ? "aspect-[16/9]" : "aspect-[4/3]"}`} />
        <Tag section={section} className="absolute bottom-0 right-0 rounded-b-none rounded-r-none" />
      </div>
      <div className="flex flex-1 flex-col p-6">
        <h3 className={`font-display font-semibold leading-tight text-ink ${size === "lg" ? "text-3xl" : "text-2xl"}`}>{title}</h3>
        {body && <p className="mt-3 text-muted">{body}</p>}
      </div>
    </Link>
  );
}

/** Full-bleed photo banner with big white headline. */
export function PhotoHero({
  image,
  section,
  title,
  description,
  children,
  tall,
  crumbs = [],
}: {
  image: string;
  section?: string;
  title: string;
  description?: string;
  children?: ReactNode;
  tall?: boolean;
  crumbs?: { label: string; href: string }[];
}) {
  return (
    <div className="relative isolate overflow-hidden bg-ink">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={asset(image)} alt="" className="absolute inset-0 -z-10 h-full w-full object-cover" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/80 via-black/45 to-black/15" />
      <div className={`mx-auto flex max-w-6xl flex-col justify-end px-4 ${tall ? "min-h-[78vh] py-20" : "min-h-[46vh] py-14"}`}>
        {crumbs.length > 0 && (
          <nav aria-label="Breadcrumb" className="mb-4 text-sm text-white/80">
            <ol className="flex flex-wrap gap-1">
              {crumbs.map((c, i) => (
                <li key={c.href} className="flex gap-1">
                  {i > 0 && <span aria-hidden="true">/</span>}
                  <Link href={c.href} className="hover:text-white hover:underline">{c.label}</Link>
                </li>
              ))}
            </ol>
          </nav>
        )}
        {section && <Tag section={section} className="self-start" />}
        <h1 className={`mt-4 max-w-4xl font-display font-bold leading-[1.05] text-white drop-shadow ${tall ? "text-5xl sm:text-7xl" : "text-4xl sm:text-6xl"}`}>{title}</h1>
        {description && <p className="mt-5 max-w-2xl text-lg text-white/90 sm:text-xl">{description}</p>}
        {children}
      </div>
      {section && <div className="h-1.5" style={{ background: sectionColor(section) }} />}
    </div>
  );
}
