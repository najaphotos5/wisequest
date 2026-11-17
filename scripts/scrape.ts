/**
 * One-off scraper: pulls every page/post from the live WordPress.com site via
 * the public REST API, strips WordPress widgets, converts to Markdown and
 * writes content/_raw/<slug>.md plus content/_raw/_report.json.
 *
 * Usage: npm run scrape            (add --assets to also download images/PDFs)
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import * as cheerio from "cheerio";
import TurndownService from "turndown";

const SITE = "wisequest.home.blog";
const API = `https://public-api.wordpress.com/wp/v2/sites/${SITE}`;
const OUT = path.join(process.cwd(), "content/_raw");
const ASSETS = path.join(process.cwd(), "public/wp");
const DOWNLOAD_ASSETS = process.argv.includes("--assets");

type WpItem = {
  id: number;
  slug: string;
  link: string;
  parent?: number;
  modified: string;
  title: { rendered: string };
  content: { rendered: string };
  excerpt?: { rendered: string };
};

async function fetchAll(kind: "pages" | "posts"): Promise<WpItem[]> {
  const items: WpItem[] = [];
  for (let page = 1; ; page++) {
    const res = await fetch(`${API}/${kind}?per_page=100&page=${page}`);
    if (!res.ok) break;
    const batch = (await res.json()) as WpItem[];
    items.push(...batch);
    if (batch.length < 100) break;
  }
  return items;
}

const turndown = new TurndownService({ headingStyle: "atx", bulletListMarker: "-" });
turndown.remove(["script", "style", "iframe", "form"]);

function decode(html: string) {
  return cheerio.load(`<p>${html}</p>`).text().replace(/ /g, " ").trim();
}

function clean(html: string) {
  const $ = cheerio.load(html);
  $(".sharedaddy, .jp-relatedposts, .wpcnt, .wp-block-jetpack-subscriptions, #jp-post-flair").remove();
  // Keep embed URLs (YouTube etc.) as plain links so they survive conversion.
  $("figure.wp-block-embed").each((_, el) => {
    const text = $(el).find(".wp-block-embed__wrapper").text().trim();
    const url = /^https?:/.test(text) ? text : $(el).find("a[href]").attr("href") ?? $(el).find("iframe").attr("src");
    $(el).replaceWith(url ? `<p>[embed](${url})</p>` : "");
  });
  $("iframe").each((_, el) => {
    const src = $(el).attr("src");
    $(el).replaceWith(src ? `<p>[embed](${src})</p>` : "");
  });
  const images = $("img").map((_, el) => ({ src: $(el).attr("src") ?? "", alt: $(el).attr("alt") ?? "" })).get();
  const links = $("a").map((_, el) => $(el).attr("href") ?? "").get();
  return { html: $("body").html() ?? "", images, links };
}

const isAsset = (url: string) => /\/wp-content\/uploads\/|files\.wordpress\.com/.test(url);

/** Flatten an uploads URL to a local filename, e.g. 2024-03-logo.png */
function assetName(url: string) {
  const p = new URL(url.split("?")[0]).pathname;
  const m = p.match(/uploads\/(\d{4})\/(\d{2})\/(.+)$/);
  return m ? `${m[1]}-${m[2]}-${m[3].replace(/\//g, "-")}` : path.basename(p);
}

function localizeAssets(md: string) {
  return md.replace(/https?:\/\/[^\s)"]+/g, (url) => (isAsset(url) ? `/wp/${assetName(url)}` : url));
}

/** Turn embed placeholders into MDX components (YouTube) or plain links. */
function embeds(md: string) {
  return md.replace(/\\\[embed\\\]\((.+?)\)\s*$/gm, (_, raw: string) => {
    const url = raw.replace(/\\_/g, "_");
    const yt = url.match(/youtube(?:-nocookie)?\.com\/embed\/([\w-]+)|youtu\.be\/([\w-]+)/);
    if (yt) return `<YouTube id="${yt[1] ?? yt[2]}" />`;
    if (/player\.vimeo\.com|videopress\.com|video\.wordpress\.com/.test(url)) return `<VideoEmbed src="${url}" />`;
    return url.startsWith("http") ? `[Embedded media](${url})` : "";
  });
}

function tidy(md: string) {
  return embeds(localizeAssets(md))
    .replace(/^\s*\.\s*$/gm, "") // stray lone periods left by empty blocks
    .replace(/\\\*\\\*/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

async function download(url: string) {
  const res = await fetch(url.split("?")[0]);
  const dest = path.join(ASSETS, assetName(url));
  if (!res.ok) return;
  await writeFile(dest, Buffer.from(await res.arrayBuffer()));
}

async function main() {
  await mkdir(OUT, { recursive: true });
  if (DOWNLOAD_ASSETS) await mkdir(ASSETS, { recursive: true });

  const [pages, posts] = await Promise.all([fetchAll("pages"), fetchAll("posts")]);
  const report: Record<string, unknown>[] = [];
  const assetUrls = new Set<string>();

  for (const [kind, items] of [["page", pages], ["post", posts]] as const) {
    for (const item of items) {
      const title = decode(item.title.rendered);
      const { html, images, links } = clean(item.content.rendered);
      const md = tidy(turndown.turndown(html));
      const external = [...new Set(links.filter((l) => l.startsWith("http") && !l.includes(SITE)))];
      const pdfs = links.filter((l) => /\.pdf(\?|$)/i.test(l));
      [...images.map((i) => i.src), ...links].filter(isAsset).forEach((u) => assetUrls.add(u.split("?")[0]));

      const frontmatter = [
        "---",
        `title: ${JSON.stringify(title)}`,
        `kind: ${kind}`,
        `wpId: ${item.id}`,
        `parent: ${item.parent ?? 0}`,
        `oldUrl: ${JSON.stringify(item.link)}`,
        `modified: ${JSON.stringify(item.modified)}`,
        "---",
        "",
      ].join("\n");
      await writeFile(path.join(OUT, `${item.slug}.md`), frontmatter + md + "\n");

      report.push({
        slug: item.slug,
        kind,
        title,
        oldUrl: item.link,
        words: md.split(/\s+/).filter(Boolean).length,
        imagesMissingAlt: images.filter((i) => !i.alt.trim()).length,
        externalLinks: external,
        pdfs,
      });
    }
  }

  if (DOWNLOAD_ASSETS) {
    for (const url of assetUrls) await download(url).catch(() => {});
  }

  report.sort((a, b) => String(a.slug).localeCompare(String(b.slug)));
  await writeFile(path.join(OUT, "_report.json"), JSON.stringify(report, null, 2));
  console.log(`Scraped ${pages.length} pages, ${posts.length} posts → ${OUT}`);
  if (DOWNLOAD_ASSETS) console.log(`Downloaded ${assetUrls.size} assets → ${ASSETS}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
