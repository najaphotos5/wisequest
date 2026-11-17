# WiseQuest — new site

Next.js rebuild of https://wisequest.home.blog. Static export (`out/`), deployable to any static host.
The UX audit and site structure plan are in [docs/AUDIT.md](docs/AUDIT.md).

## Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Local dev server at http://localhost:3000 |
| `npm run build` | Static export to `out/` (also regenerates redirect files) |
| `npx serve out` | Preview the production build |
| `npm run check-links` | Verify every internal link/asset in `out/` resolves |
| `npm run scrape -- --assets` | Re-pull all pages + images/PDFs from the live WordPress site into `content/_raw` and `public/wp` |
| `npm run migrate` | Re-convert `content/_raw` → cleaned MDX (skips files marked `curated: true`) |

## Making changes & versions

Follow the `update-site` Claude skill (`.claude/skills/update-site/SKILL.md`); `CLAUDE.md` points Claude to it, including `@claude` on GitHub. Every change is built and link-checked, gets a version bump, is committed, and is pushed.

Versions are **vXX.XX.XXX** in `VERSION` (shown in the site footer), with history in `CHANGELOG.md`:

```bash
npm run version:bump -- patch "Fixed a typo"      # small fix:   v01.03.000 → v01.03.001
npm run version:bump -- minor "Added a new page"  # new feature: v01.03.001 → v01.04.000
npm run version:bump -- major "Redesign"          # big change:  v01.04.000 → v02.00.000
```
The deploy workflow tags each released version on GitHub automatically.

## Where things live

- `content/pages/**.mdx` — every article page (URL = file path). Front matter: `title`, `description`, `section`, `updated`, optional `sources`, `lang`.
- `content/qa/*.mdx` — one file per Q&A question (shows up in the searchable `/qa` index automatically).
- `data/mosques.json`, `data/sessions.json` — area mosques and Quran 101 locations/times.
- `lib/site.ts` — site name, nav menus, contact details, form endpoint, donate link.
- `lib/redirects.ts` — old WordPress URLs → new URLs (generates `public/_redirects` and `vercel.json`).
- MDX components available in content: `<Verse cite>`, `<Callout title>`, `<Steps>/<Step title>`, `<Download href title note>`, `<YouTube id title>`, `<VideoGrid>`, `<ButtonLink href>`.

After hand-editing a migrated page, add `curated: true` to its front matter so `npm run migrate` never overwrites it.

## Before launch — owner inputs needed

- [ ] `lib/site.ts`: public **email, phone/text, WhatsApp**, social links, final domain.
- [ ] Form backend: create a Formspree/Web3Forms form and set `NEXT_PUBLIC_FORM_ENDPOINT` (without it, forms open the visitor's email app, which needs `contact.email` set).
- [ ] `content/pages/about.mdx`: confirm organization/affiliation wording, add team and reviewers.
- [ ] `content/pages/privacy.mdx`: confirm form provider and data retention.
- [ ] `data/sessions.json`: Sacramento Quran 101 schedule; confirm the Roseville address (old site lists both "Foothills Blvd" and "Foothill Blvd 95661").
- [ ] Review Quran translations and hadith references added during cleanup (`start.mdx`, `become-muslim.mdx`).
- [ ] Migrated articles still have long "click here" links and some images without alt text. Review each page and mark it `curated: true`.
- [ ] `public/wp` is ~250 MB of PDFs/images. Check the host's size limits, or move large PDFs to object storage.
