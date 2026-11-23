/**
 * Site-wide settings. Values marked TODO need the site owner's input; any
 * contact field left empty is simply hidden from the UI.
 */
export const site = {
  name: "WiseQuest",
  title: "The Universal Message of All Prophets",
  tagline: "Illuminate your soul",
  description:
    "Learn about Islam, the timeless message of all prophets from Adam, Noah, Abraham, Moses, and Jesus to Muhammad ﷺ. Free Quran, local Quran 101 sessions in the Sacramento area, and support for new Muslims.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://wisequest.org",
  region: "Greater Sacramento, California",
  contact: {
    email: "", // TODO: public email, e.g. hello@wisequest.org
    phone: "", // TODO: call/text number, e.g. +1 916 555 0100
    whatsapp: "", // TODO: digits only, e.g. 19165550100
    hours: "We usually reply within 24 hours.",
  },
  /** Form endpoint (e.g. https://formspree.io/f/xxxx). Empty → forms fall back to email. */
  formEndpoint: process.env.NEXT_PUBLIC_FORM_ENDPOINT ?? "",
  /** Google Analytics 4 measurement ID (G-XXXXXXXXXX). Empty → no analytics. */
  gaId: process.env.NEXT_PUBLIC_GA_ID ?? "G-NNLSSQ6TYM",
  donateUrl: "https://www.icnasac.org/donate",
  quran101SignupUrl: "https://forms.gle/aRnAffHYuXP8Fei97",
  social: [] as { label: string; href: string }[], // TODO: YouTube, Instagram, etc.
};

export type NavItem = { label: string; href: string; description?: string; children?: NavItem[] };

export const nav: NavItem[] = [
  {
    label: "Start Here",
    href: "/start",
    children: [
      { label: "What is Islam?", href: "/start", description: "The one message of all prophets" },
      { label: "Who is God?", href: "/start/god", description: "God in His own words, and His 99 names" },
      { label: "Purpose of Life", href: "/purpose-of-life", description: "Why are we here?" },
      { label: "The Five Pillars", href: "/start#five-pillars", description: "The foundations of Muslim practice" },
    ],
  },
  {
    label: "Learn",
    href: "/learn",
    children: [
      { label: "The Quran", href: "/learn/quran" },
      { label: "Prophet Muhammad ﷺ", href: "/learn/muhammad" },
      { label: "His Teachings", href: "/learn/muhammad/teachings" },
      { label: "Jesus in Islam", href: "/learn/jesus" },
      { label: "Women in Islam", href: "/learn/women" },
      { label: "History", href: "/learn/history" },
      { label: "AI Insights", href: "/learn/ai-insights" },
    ],
  },
  { label: "Q&A", href: "/qa" },
  { label: "Stories", href: "/stories" },
  {
    label: "New Muslims",
    href: "/new-muslims",
    children: [
      { label: "Your first steps", href: "/new-muslims" },
      { label: "How to Pray", href: "/new-muslims/how-to-pray" },
      { label: "Glossary", href: "/glossary" },
    ],
  },
  {
    label: "Local",
    href: "/local",
    children: [
      { label: "Quran 101 sessions", href: "/local" },
      { label: "Area mosques", href: "/local/mosques" },
      { label: "Session handouts", href: "/local/quran-101/handouts" },
    ],
  },
  { label: "Resources", href: "/resources" },
];

export const footerNav: NavItem[] = [
  {
    label: "Explore",
    href: "/start",
    children: [
      { label: "What is Islam?", href: "/start" },
      { label: "The Quran", href: "/learn/quran" },
      { label: "Q&A", href: "/qa" },
      { label: "Stories", href: "/stories" },
      { label: "Español", href: "/es" },
    ],
  },
  {
    label: "Take a step",
    href: "/become-muslim",
    children: [
      { label: "How to become Muslim", href: "/become-muslim" },
      { label: "Get a free Quran", href: "/resources/free-quran" },
      { label: "Quran 101 near you", href: "/local" },
      { label: "Talk to us", href: "/contact" },
    ],
  },
  {
    label: "About",
    href: "/about",
    children: [
      { label: "About us", href: "/about" },
      { label: "Get involved", href: "/get-involved" },
      { label: "Privacy", href: "/privacy" },
    ],
  },
];
