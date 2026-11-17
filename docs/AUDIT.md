# WiseQuest — UX/UI Audit & Next.js Rebuild Plan

## Context
https://wisequest.home.blog ("The Universal Message of All Prophets") is a WordPress.com dawah site run by local volunteers (Roseville/Sacramento). It has strong raw content but suffers from WordPress.com clutter, an overloaded menu, empty sections, broken formatting and no clear visitor journey. Goal: build a new site locally in `/Users/jadnaja/wisequest` (empty dir) with **Next.js**, content **scraped from the live site** and cleaned up, maintained by the owner in code. Hosting decided later (static export keeps every option open: Vercel, Netlify, Cloudflare Pages, GitHub Pages).

---

## Part 1 — Audit findings (from homepage, How to become Muslim, Contact, Local, New Muslims, Q&A)

### Navigation / information architecture
- ~17 top-level menu items + submenus; no hierarchy. Duplicates: "Muhammad > Muhammad", "New Muslims guide > New Muslims / New Muslim Guide / Short Guide" (3 overlapping guides), "Local" vs "Local Mosques" vs "Useful Links", "Converts" vs "New Muslims".
- Opaque slugs: `/espanol/700-2/`, `/887-2/`, `/local-info/` (page is actually "Quran 101"). Inconsistent labels ("ebooks" lowercase, "AmharI").
- Links split across two domains (wisequest.home.blog and wisequest.org) with no explanation.

### Homepage
- ~25 stacked sections, very long scroll, no clear hero or primary action; the "become Muslim" CTA repeats 3×.
- **Empty sections:** "What they say about The Glorious Quran", "Islam & Science", six blank blocks under "Discover Why Amazing People Are Reverting" (unrendered video embeds).
- Unlabeled orphan link list ("Who is Allah?", "Don't be Deceived"…) looks like leftover widget text.
- Formatting bugs: stray `**`, escaped `\*\*`, backslashes, duplicated sentences in Quran 4:163–165; typos ("Why it should be matter?").

### Content quality / trust
- Inconsistent spelling: Muhammad/Mohammad, Quran/Qur'an; missing ﷺ honorific left blanks ("The Prophet  said").
- Unsourced hadith/claims; no author, dates or "reviewed by" info.
- Logo filename says "whyislam-volunteers" while footer disclaims WhyIslam affiliation; operating org (ICNA/icnasac.org) never named. **No About page.**

### Conversion path (most important UX gap)
- "How to become Muslim" ends with no next step (no "talk to someone now", no mosque/mentor hookup, no shahada-with-a-witness option).
- Contact page: "Thank you for your response" shows before submit; overlapping reason/contact-preference options; no email/phone/hours/response time; "← Back" links to itself; no privacy statement.
- No phone/WhatsApp/chat — the highest-intent visitors have to fill a form and wait.

### Local / Quran 101
- Sacramento: "time TBA", online sessions "coming soon" with no dates. No organizer contact, parking, walk-in policy, session format.

### Q&A
- One long scroll, no table of contents/accordion/search; mixed heading levels; ~40 stray periods; duplicated content ("Does God care" vs "Does God love"); thin answers; audio without transcript.

### Accessibility / technical
- Most images have empty or filename alt text; generic stock photos; "click here" links.
- WordPress.com artifacts everywhere: "Like Loading…", "Loading Comments…", "%d", comment forms on every static page, cookie notice mid-page, "Collapse this bar".
- No structured data, SEO titles/meta descriptions inconsistent; PDFs listed with no size/description.

---

## Part 2 — Recommended improvements & missing sections

**New IA (7 top-level items max):**
1. **Start Here** – What is Islam · Purpose of Life · God (Who is Allah, 99 Names) · Five Pillars
2. **Learn** – Quran · Muhammad ﷺ (+ Teachings) · Jesus in Islam · Women in Islam · History · Islam & Science · AI Insights
3. **Q&A** – searchable FAQ with categories/accordions, one page per question (better SEO)
4. **Stories** – convert stories (videos with transcripts)
5. **New Muslims** – single merged guide (step 1–5 roadmap) · How to Pray · Toolkit PDF · Useful links
6. **Local** – Quran 101 sessions, area mosques (map), events
7. **Resources** – ebooks/PDFs, free Quran request, multilingual library
+ persistent **"Talk to us" / "Become Muslim"** buttons in the header; language switcher (EN / ES + external links for others).

**Homepage redesign (short, purposeful):** hero (verse 2:136 + one-line mission + two CTAs: "Learn about Islam" / "I have questions") → 3-card "What is Islam / Who is God / What is the Quran" → Five Pillars strip → convert-story carousel → Quran 101 next-session card → free Quran offer → FAQ teaser → contact band.

**Missing sections/pages to add:**
- **About Us** (who runs it, affiliation with ICNA Sacramento clarified, mission, scholarly reviewers)
- **Talk to a Muslim now**: phone/text/WhatsApp number, email, expected response time, hours
- **Shahada next steps**: "Say it with us" (in person/video call), assigned mentor, what to expect in first 30 days
- **Events calendar** (Quran 101, open mosque days, new-Muslim circles)
- **Area mosques map** with addresses, sisters' facilities, parking, new-Muslim programs
- **Free Quran request form** on-site (instead of off-domain)
- **Islam & Science** and **Quran testimonials** — fill in or drop
- **Volunteer** and **Donate** pages (clearly naming beneficiary)
- **Privacy policy**, accessibility statement, sources/citations section on articles
- Glossary of Arabic terms (Shahada, Salah, Zakat, fitra, ﷺ…)
- Newsletter signup (replace WP subscribe widget)

**UI direction:** calm, trustworthy palette (deep teal/green + warm sand + white), Arabic-friendly typography (e.g. Inter/Source Serif for EN, Amiri for Quranic Arabic), verse blocks styled as distinct cards with reference, generous whitespace, mobile-first, dark mode, real local photos instead of stock where possible. WCAG 2.2 AA: alt text, contrast, keyboard nav, descriptive links.

---

## Part 3 — Build plan (Next.js)

**Stack:** Next.js (App Router, TypeScript) with `output: 'export'` (static, host-anywhere) · Tailwind CSS · MDX content via `@next/mdx` or `next-mdx-remote` + `gray-matter` · `next-intl` for EN/ES · Fuse.js client search for Q&A · `next/image` (unoptimized for export) · Formspree/Web3Forms (or a host function later) for forms.

**Project structure (`/Users/jadnaja/wisequest`):**
```
app/[locale]/(pages)/…        route per IA section
app/[locale]/qa/[slug]/        one page per question
components/  Header, MegaMenu, Footer, Hero, VerseCard, CTA, Accordion,
             StoryCard, EventCard, MosqueMap, ContactForm, LanguageSwitcher
content/en/*.mdx, content/es/*.mdx   frontmatter: title, description, updated, sources[]
content/qa/*.mdx, content/stories/*.mdx, data/events.json, data/mosques.json
public/pdfs, public/images
scripts/scrape.ts              one-off scraper
```

**Steps:**
1. Scaffold: `create-next-app` (TS, Tailwind, App Router, ESLint); configure static export, next-intl, MDX.
2. **Scrape** (`scripts/scrape.ts`, using `cheerio` + `turndown`): crawl the ~25 menu URLs listed in the audit, extract `.entry-content`, strip WP widgets/likes/comments/share, convert to Markdown with frontmatter, download images & PDFs to `public/`. Produce a `content/_raw/` dump plus a report of empty sections and external links.
3. **Clean & restructure content:** map raw pages → new IA, merge the 3 new-Muslim guides into one, split Q&A into per-question files, fix typos/formatting, standardize "Muhammad ﷺ" and "Quran", add alt text, add sources. Flag items needing the owner's input (phone, About text, Sacramento schedule, convert video URLs).
4. Build design system & layout components (header with sticky CTAs, mobile menu, footer with contact/social/privacy).
5. Build pages: homepage, article template (TOC, verse cards, sources, updated date, next/prev), Q&A index with search + categories, stories, New Muslims roadmap, Local (events + mosques), Contact (fixed form), About, Resources.
6. SEO: per-page metadata, Open Graph, `sitemap.xml`, `robots.txt`, JSON-LD (Organization, FAQPage, Event), `hreflang` for EN/ES; redirect map old slugs → new (`redirects.json`, applied at host).
7. Accessibility & performance pass (Lighthouse ≥ 95, axe).

**Owner inputs needed during build:** org/About details & affiliation wording, public phone/email, Sacramento session details, convert-story video links, preferred form backend, logo files.

## Verification
- `npm run dev` → browse every route locally at http://localhost:3000 in Chrome (claude-in-chrome) at desktop and mobile widths; screenshot key pages.
- `npm run build` succeeds with static export into `out/`; `npx serve out` to test the production build.
- Link check (e.g. `lychee` or a small script) — no broken internal links, all old slugs in redirect map.
- Lighthouse + axe on homepage, an article, Q&A, Contact.
- Contact/Quran-request forms submit successfully to the test endpoint.
- Content diff report: every scraped page accounted for (migrated, merged, or intentionally dropped).
