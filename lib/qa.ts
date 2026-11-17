import { listPages } from "./content";
import { imageFor } from "./visuals";

export type QaEntry = { title: string; description: string; category: string; href: string; image: string };

/** Related articles elsewhere on the site that answer common questions. */
const linked: Omit<QaEntry, "image">[] = [
  { title: "What is the purpose of life?", description: "Who are we, why are we here, and what happens next?", category: "Life & purpose", href: "/purpose-of-life" },
  { title: "Why can't we see God in this life?", description: "A response to Dr. Todd Phillips.", category: "God", href: "/learn/why-cant-we-see-god" },
  { title: "What do Muslims believe about Jesus?", description: "A mighty messenger of God, born of the Virgin Mary.", category: "Prophets", href: "/learn/jesus" },
  { title: "Is the Quran really from God?", description: "Five reasons the Quran is a divine revelation.", category: "Quran", href: "/learn/quran" },
  { title: "Are women equal in Islam?", description: "Equal reward, equal accountability, and honored roles.", category: "Society", href: "/learn/women" },
  { title: "How do I become Muslim?", description: "One sincere sentence, and you are not alone.", category: "Becoming Muslim", href: "/become-muslim" },
];

export async function getQaEntries(): Promise<QaEntry[]> {
  const pages = await listPages("qa");
  const own = pages.map((p) => ({
    title: p.meta.title,
    description: p.meta.description,
    category: (p.meta as { category?: string }).category ?? "General",
    href: `/qa/${p.slug}`,
  }));
  return [...own, ...linked].map((e) => ({ ...e, image: imageFor(e.href) }));
}
