# WiseQuest — new site

Next.js rebuild of https://wisequest.home.blog, live at **https://wisequest.org/**.
Static export (`out/`), deployed to GitHub Pages on every push to `main`.

> **Updating the site? Read the [update-site skill](.claude/skills/update-site/SKILL.md) first.**
> It's the required procedure for every person and agent: setup, where content lives, best practices, building
> and previewing, versioning, and releasing safely when several agents work at once.

## Guidelines for people and agents

All rules live in **skills** under [`.claude/skills/`](.claude/skills/). Any agent (Claude, Codex, Cursor, Copilot, Gemini…) or person working on this repo must read and follow the one for their task. The skills win over anything else, including this README and routine prompts. [`CLAUDE.md`](CLAUDE.md) and [`AGENTS.md`](AGENTS.md) point agents here.

| Skill | When |
| --- | --- |
| [update-site](.claude/skills/update-site/SKILL.md) | Any change to the repo (required) |
| [telegram-voice](.claude/skills/telegram-voice/SKILL.md) | Any message written as the WiseQuest bot (Telegram, GitHub issue comments): Arabic Islamic phrases plus formal English, never on the website |
| [task-queue](.claude/skills/task-queue/SKILL.md) | Handling change requests from the group: split into tasks, one high-quality task per hour, queue order |
| [telegram-pinned](.claude/skills/telegram-pinned/SKILL.md) | Required after any change to how Telegram messages are processed or what users can do: update the pinned help message |
| [telegram-commands](.claude/skills/telegram-commands/SKILL.md) | Every bot command (/status, /undo, /idea, /report, /page, /check, /history, /mute, owner /pause /resume /priority), requests without /todo, Arabic requests |
| [bot-operations](.claude/skills/bot-operations/SKILL.md) | Reliability: run lock, missed messages, health alerts, health-check routine, daylight saving, pause |
| [telegram-nudges](.claude/skills/telegram-nudges/SKILL.md) | Reminders when nobody answers, and the once-a-day quiet-day check-in |
| [daily-suggestion](.claude/skills/daily-suggestion/SKILL.md) | The daily improvement idea |
| [weekly-report](.claude/skills/weekly-report/SKILL.md) | The Friday weekly report |
| [website-report](.claude/skills/website-report/SKILL.md) | The detailed analytics PDF (`npm run report:pdf`) attached to the Friday report and /report |
| [analytics](.claude/skills/analytics/SKILL.md) | Reading Google Analytics |

**Automations** (Claude cloud routines; their prompts defer to the skills above):
- hourly Telegram assistant (every hour, around the clock): requests, queue, publishing, reminders, quiet-day check-in
- health check: every 3 hours, alerts the owners if the hourly assistant stops
- daily suggestion: 8 AM Pacific (Thursdays: site-health sweep)
- weekly report: Fridays

Their state is on the `claude/telegram-state` branch. Never merge it into `main`.

**Quick start:**

```bash
npm ci                                                        # once
git pull --rebase --autostash                                 # before every change
# …make one focused change…
npm run build && npm run check-links && npx serve out         # build, check, preview
npm run release -- patch "Updated Quran 101 time to 7:30 PM"  # bump version, commit, push
```

The UX audit and site structure plan are in [docs/AUDIT.md](docs/AUDIT.md). The current list of suggested improvements is in [docs/UX-IMPROVEMENTS.md](docs/UX-IMPROVEMENTS.md).

## The original site

The original WordPress site, https://wisequest.home.blog/, is the **first commit** of this repo's history (`git log --reverse`). It is also kept on the branch **`original-site`**. That branch holds every page as HTML, Markdown and a full-page screenshot, plus an index mapping each old URL to its new page. The commit right after it ("Start the Next.js rebuild…") removes those files from the working tree, so they don't ship with the site. To compare:

```bash
npm run original -- /learn/jesus/          # old URL(s) and what changed (words, paragraphs, new sections)
npm run original -- /learn/jesus/ --full   # the full text diff
npm run original -- --list                 # every old page and where it lives now
```

## Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Local dev server at http://localhost:3000 |
| `npm run build` | Static export to `out/` (also regenerates redirect files) |
| `npx serve out` | Preview the production build |
| `npm run check-links` | Verify every internal link/asset in `out/` resolves |
| `npm run check-videos` | Find embedded videos that no longer exist |
| `npm run check-external` | Find links to other websites whose page is gone (404/410) |
| `node scripts/screenshot.cjs <url> <out.png> --text "<words>"` | Phone screenshot centred on (and highlighting) the changed part of a page, used for before/after replies |
| `node scripts/telegram-updates.cjs fetch <offset>` / `ack <next>` | The only way the bot reads Telegram: same request every run, cross-checked with Telegram's pending count, logged |
| `npm run original -- <path>` | Compare a page with the original WordPress site (branch `original-site`) |
| `npm run report:pdf` | Detailed analytics report as a PDF (last 7 + 28 days) |
| `npm run release -- <patch\|minor\|major> "summary"` | Sync, build, check links, bump version, commit, push (retries safely if someone else pushed) |
| `npm run version:show` | Print the current version |
| `npm run scrape -- --assets` | Re-pull all pages + images/PDFs from the live WordPress site into `content/_raw` and `public/wp` |
| `npm run migrate` | Re-convert `content/_raw` → cleaned MDX (skips files marked `curated: true`) |

## Making changes & versions

Every change follows the [update-site skill](.claude/skills/update-site/SKILL.md). [`CLAUDE.md`](CLAUDE.md) points Claude to it, including `@claude` on GitHub. Every change is built, link-checked, version-bumped, committed, and pushed with `npm run release`.

Versions are **vXX.XX.XX** in `VERSION` (shown in the site footer), with history in [`CHANGELOG.md`](CHANGELOG.md):

| Change | Command | Example |
| --- | --- | --- |
| Small fix (text, typo, photo, link, time) | `npm run release -- patch "…"` | v01.03.00 → v01.03.01 |
| New page, section, or feature | `npm run release -- minor "…"` | v01.03.01 → v01.04.00 |
| Redesign or URL-breaking change | `npm run release -- major "…"` | v01.04.00 → v02.00.00 |

GitHub Actions:
- **Deploy to GitHub Pages** builds and publishes every push to `main`.
- **Tag release** tags each version.
- **Version check** blocks pull requests that don't bump the version or don't build.

## Where things live

- `content/pages/**.mdx` — every article page (URL = file path). Front matter: `title`, `description`, `section`, `updated`, optional `sources`, `lang`.
- `content/qa/*.mdx` — one file per Q&A question (shows up in the searchable `/qa` index automatically).
- `data/mosques.json`, `data/sessions.json` — area mosques and Quran 101 locations/times.
- `lib/site.ts` — site name, nav menus, contact details, form endpoint, donate link.
- `lib/redirects.ts` — old WordPress URLs → new URLs (generates `public/_redirects` and `vercel.json`).
- `components/PageFeedback.tsx` — "Was this page helpful?" on every page (after the article on article and Q&A pages, otherwise above the footer). Sends GA events `feedback_yes`, `feedback_no`, `feedback_no_<reason>`; see them with `npm run ga -- feedback 28` or `/feedback` in Telegram.
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
