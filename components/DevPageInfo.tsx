import type { Page } from "@/lib/content";

/**
 * Hidden page details for dev mode (see components/DevMode.tsx).
 * Renders a JSON <script> that browsers ignore; it only shows up in the dev panel.
 */
export function DevPageInfo({ page, kind }: { page: Page; kind: "pages" | "qa" }) {
  const words = page.body.replace(/<[^>]+>|[#*_`>[\]()-]/g, " ").split(/\s+/).filter(Boolean).length;
  const m = page.meta as Record<string, unknown>;
  const info = {
    source: `content/${kind}/${page.slug}.mdx`,
    words,
    meta: Object.fromEntries(
      ["section", "category", "updated", "curated", "migratedFrom", "lang", "chapters"].filter((k) => m[k] !== undefined).map((k) => [k, m[k]]),
    ),
    summaryPoints: Array.isArray(m.summary) ? m.summary.length : 0,
  };
  return <script type="application/json" id="wq-page-info" dangerouslySetInnerHTML={{ __html: JSON.stringify(info) }} />;
}
