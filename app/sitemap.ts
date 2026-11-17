import type { MetadataRoute } from "next";
import { listSlugs } from "@/lib/content";
import { site } from "@/lib/site";

export const dynamic = "force-static";

const appRoutes = ["", "learn", "qa", "contact", "local", "local/mosques", "resources/free-quran"];

export default function sitemap(): MetadataRoute.Sitemap {
  const paths = [...appRoutes, ...listSlugs("pages"), ...listSlugs("qa").map((s) => `qa/${s}`)];
  return paths.map((p) => ({ url: `${site.url}/${p}${p ? "/" : ""}` }));
}
