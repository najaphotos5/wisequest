---
name: update-site
description: Make any change to the WiseQuest website (content, pages, photos, design, settings) and release it. Use for every edit to this repo, e.g. "fix a typo", "add a Q&A", "change a photo", "update the Quran 101 time". Always ends by bumping the vXX.XX.XXX version, committing, and pushing.
---

# Updating the WiseQuest site

Every change follows the same five steps. Do not stop before step 5: a change is not done until it is committed and pushed.

## 1. Make the change

Where things live:

| What | Where |
| --- | --- |
| Article pages (URL = file path) | `content/pages/**.mdx` |
| Q&A answers (one file each, listed on `/qa` automatically) | `content/qa/*.mdx` |
| Homepage, contact, local, Q&A index | `app/**/page.tsx` |
| Menus, contact details, donate/sign-up links | `lib/site.ts` |
| Quran 101 times and places / mosque list | `data/sessions.json`, `data/mosques.json` |
| Page cover photos (route → image) and section colors | `lib/visuals.ts`, files in `public/img/` |
| Photo credits | `data/image-credits.json` |
| Old WordPress URL redirects | `lib/redirects.ts` |

Content rules:
- Front matter: `title`, `description`, `section`; long pages also take `summary:` (3–5 key-point bullets, written only from the page's own text).
- Pages over ~600 words with 3+ `##` headings read chapter by chapter automatically; each `##` is a chapter, so keep headings short.
- After hand-editing a page migrated from WordPress, make sure its front matter has `curated: true` so `npm run migrate` never overwrites it.
- MDX components: `<Verse cite>`, `<Callout title>`, `<Steps>/<Step title>`, `<Download href title note>`, `<Figure src alt caption>`, `<YouTube id title>`, `<VideoGrid>`, `<ButtonLink href>`.
- Link to pages and files with root paths (`/learn/quran`, `/img/x.jpg`); never hard-code `/wisequest/`. The GitHub Pages prefix is added at build time.
- New photos: public domain/CC0 or Pexels only, resized to max 1600px (`sips -Z 1600`), credited in `data/image-credits.json`.
- Quran verses and hadith: never invent wording or references. Use what the page already has, or flag it for the owner to verify.

## 2. Verify

```bash
npm run build && npm run check-links
```
Both must pass. Fix any error before continuing. For visual changes, preview with `npx serve out` and look at the page.

## 3. Bump the version

Format **vXX.XX.XXX** = major.minor.patch, stored in `VERSION`. Pick the part by the size of the change:

| Change | Part | Example |
| --- | --- | --- |
| Small: typo or text edit, swap a photo, fix a link, update a time/address, small style tweak | `patch` (last number) | v01.03.000 → v01.03.001 |
| New page, section, feature, or noticeable design change | `minor` (middle number, resets last) | v01.03.001 → v01.04.000 |
| Redesign, new site structure, or changes that break existing URLs | `major` (first number, resets the others) | v01.04.000 → v02.00.000 |

If one push contains several changes, bump once using the largest part.

```bash
npm run version:bump -- patch "One plain-English line describing the change"
```
This updates `VERSION` and adds an entry to the top of `CHANGELOG.md`. Don't edit those files by hand, and don't create git tags: the deploy workflow tags each release automatically.

## 4. Commit

Commit the change together with `VERSION` and `CHANGELOG.md`, with the version first in the message:

```bash
git add -A
git commit -m "v01.03.001: Fix typo on the Quran page"
```

## 5. Push

```bash
git push
```
- Working on `main` (local session): pushing publishes the site. GitHub Actions builds it and it's live at https://najaphotos5.github.io/wisequest/ in about 2 minutes. Check the run with `gh run list --limit 1`.
- Working on a branch (e.g. called with `@claude` from a GitHub issue or pull request): push the branch and open/update the pull request. The site goes live when it's merged into `main`.
- If the push is rejected because `main` moved, run `git pull --rebase`. If `VERSION`/`CHANGELOG.md` conflict, keep the newer version from `main`, then bump again from it, rebuild, commit, and push.

Finish by telling the user what changed, the new version number, and the live link to the changed page.
