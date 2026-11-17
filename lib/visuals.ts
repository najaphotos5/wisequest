/**
 * Visual identity per route: a cover photo (public/img, credits in
 * data/image-credits.json) and a color-coded section tag.
 */
export const sections = {
  "Start Here": { color: "#00a6d6", tag: "Start Here" },
  Learn: { color: "#0fa37f", tag: "Learn" },
  "Q&A": { color: "#f18a1c", tag: "Q&A" },
  Stories: { color: "#e2367f", tag: "Stories" },
  "New Muslims": { color: "#7a4fd6", tag: "New Muslims" },
  Local: { color: "#e2403a", tag: "Local" },
  Resources: { color: "#2a6fdb", tag: "Resources" },
  "Take a step": { color: "#0fa37f", tag: "Take a step" },
  About: { color: "#1f2933", tag: "About" },
  Contact: { color: "#f18a1c", tag: "Contact" },
  Español: { color: "#e2367f", tag: "Español" },
  "Get Involved": { color: "#7a4fd6", tag: "Get Involved" },
} as const;

export type SectionName = keyof typeof sections;

export function sectionColor(section?: string) {
  return sections[section as SectionName]?.color ?? "#0fa37f";
}

const images: Record<string, string> = {
  "/": "hero",
  "/start": "start",
  "/start/god": "god",
  "/purpose-of-life": "purpose",
  "/learn": "quran-open",
  "/learn/quran": "quran",
  "/learn/muhammad": "muhammad",
  "/learn/muhammad/teachings": "teachings",
  "/learn/jesus": "jesus",
  "/learn/women": "women",
  "/learn/history": "history",
  "/learn/palestine": "palestine",
  "/learn/ai-insights": "ai",
  "/learn/why-cant-we-see-god": "unseen",
  "/stories": "stories",
  "/new-muslims": "new-muslims",
  "/new-muslims/how-to-pray": "prayer",
  "/local": "local",
  "/local/mosques": "mosques",
  "/local/quran-101/handouts": "handouts",
  "/resources": "resources",
  "/resources/free-quran": "free-quran",
  "/qa": "qa",
  "/qa/is-this-life-like-a-dream": "dream",
  "/qa/how-to-find-inner-peace": "peace",
  "/qa/does-god-care-about-us": "care",
  "/qa/is-life-a-punishment-for-original-sin": "sin",
  "/qa/why-is-there-suffering": "suffering",
  "/qa/does-god-forgive-without-blood-sacrifice": "forgiveness",
  "/contact": "contact",
  "/about": "about",
  "/glossary": "glossary",
  "/get-involved": "get-involved",
  "/get-involved/dawah-toolkit": "toolkit",
  "/es": "es",
  "/become-muslim": "become-muslim",
  "/privacy": "qa",
};

export function imageFor(path: string) {
  const key = images[path.replace(/\/$/, "") || "/"];
  return key ? `/img/${key}.jpg` : "/img/hero.jpg";
}
