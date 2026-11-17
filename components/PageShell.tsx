import type { ReactNode } from "react";
import type { PageMeta } from "@/lib/content";
import { imageFor } from "@/lib/visuals";
import { PhotoHero } from "./visual";

export function PageHeader({
  meta,
  path,
  crumbs = [],
}: {
  meta: Pick<PageMeta, "title" | "description" | "section">;
  path: string;
  crumbs?: { label: string; href: string }[];
}) {
  return <PhotoHero image={imageFor(path)} section={meta.section} title={meta.title} description={meta.description} crumbs={crumbs} />;
}

export function Prose({ children }: { children: ReactNode }) {
  return <div className="prose prose-lg mx-auto max-w-3xl px-4 py-12 prose-headings:scroll-mt-24">{children}</div>;
}
