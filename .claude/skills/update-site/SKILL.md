---
name: update-site
description: The required procedure for ANY change to the WiseQuest website repo (content, pages, Q&A, photos, design, settings, scripts) by any person or agent. Covers setup, building and previewing, where content lives, best practices, versioning (vXX.XX.XXX), and safely committing and pushing when several agents work at once. Use for every edit, e.g. "fix a typo", "add a Q&A", "change a photo", "update the Quran 101 time".
---

# Updating the WiseQuest site

Several people and agents update this site, sometimes at the same time. Follow these steps exactly so nobody's work is lost and every change is built, versioned, committed, and pushed.

**Live site:** https://wisequest.org/
**Repo:** https://github.com/najaphotos5/wisequest

## Golden rules

1. **Sync before you start.** Run `git pull --rebase --autostash` first, every time.
2. **One focused change per release.** Small, separate releases are easier to review and less likely to conflict.
3. **Release with one command:** `npm run release -- <patch|minor|major> "summary"`. It builds, checks links, bumps the version, commits, and pushes, and it retries safely if someone else pushed first.
4. **Never finish with uncommitted or unpushed work.** A change isn't done until it's pushed.
5. **Never edit `VERSION` or `CHANGELOG.md` by hand, never create git tags, and never force-push** (`git push --force` and `git reset --hard` on shared branches are forbidden).
6. **Never invent religious text.** Quran translations, hadith wording, and references must come from the existing content or a source the owner provided. If unsure, leave it unchanged and flag it in your summary.
7. **Stay in scope.** Change only what was asked. Mention other problems you notice instead of fixing them silently.

## The workflow

### 0. Setup (first time on a machine)

```bash
git clone https://github.com/najaphotos5/wisequest.git && cd wisequest
npm ci            # installs exact dependency versions (Node 20+; CI uses Node 22)
```

### 1. Sync

```bash
git status                          # know what's already modified before you touch anything
git pull --rebase --autostash
```
If `git status` shows changes you didn't make, someone else may be mid-change in this checkout. Don't release their work as yours; ask the user.

### 2. Make the change

Where things live:

| What | Where |
| --- | --- |
| Article pages (URL = file path, e.g. `content/pages/learn/quran.mdx` → `/learn/quran/`) | `content/pages/**.mdx` |
| Q&A answers (one file each, listed on `/qa` automatically) | `content/qa/*.mdx` |
| Homepage and app pages (contact, local, Q&A index, Learn index) | `app/**/page.tsx` |
| Menus, contact details, donate/sign-up links | `lib/site.ts` |
| Quran 101 times and places / mosque list | `data/sessions.json`, `data/mosques.json` |
| Page cover photos (route → image) and section colors | `lib/visuals.ts`, files in `public/img/` |
| Photo credits | `data/image-credits.json` |
| Downloadable PDFs and old WordPress images | `public/wp/` |
| Old WordPress URL → new URL redirects | `lib/redirects.ts` |
| Shared components (cards, headers, MDX components) | `components/` |

Content conventions:
- **Front matter:** `title`, `description` (one sentence, used by Google), `section` (one of the menu sections: Start Here, Learn, Q&A, Stories, New Muslims, Local, Resources, About). Q&A files use `category` instead of `section`. Long pages also take `summary:`, a list of 3–5 key-point bullets written only from the page's own text.
- **Chapters:** pages over ~600 words with 3+ `##` headings read chapter by chapter automatically. Each `##` starts a chapter, so keep `##` headings short and meaningful; use `###` for sub-points.
- **`curated: true`:** after hand-editing a page that came from WordPress, make sure its front matter has `curated: true`, so `npm run migrate` never overwrites it.
- **MDX components:** `<Verse cite="Quran 2:255">…</Verse>`, `<Callout title>`, `<Steps>` + `<Step title>`, `<Download href title note>`, `<Figure src alt caption wide>`, `<YouTube id title>`, `<VideoGrid>`, `<ButtonLink href>`.
- **Links and files:** use root paths (`/learn/quran`, `/img/x.jpg`, `/wp/file.pdf`). Never hard-code `/wisequest/`; the GitHub Pages prefix is added at build time.
- **New page:** create the `.mdx` file, then add it to the menus in `lib/site.ts` if it should be in navigation, and add a cover photo in `lib/visuals.ts` (pages without one fall back to the homepage photo).
- **Photos:** public domain, CC0, or Pexels only. Resize to max 1600px wide (`sips -s formatOptions 70 -Z 1600 in.jpg --out public/img/name.jpg` on macOS). Look at the image before using it (no watermarks), and add a credit to `data/image-credits.json`. Every image needs meaningful `alt` text unless it's purely decorative.
- **Wording:** plain, warm, respectful, no pressure. Write "Muhammad ﷺ" (not "Mohammad"/"PBUH") and "Quran" (not "Qur'an").
- **Accessibility:** descriptive link text (never "click here"), one `#` title per page (the template adds it, so content starts at `##`).

### 3. Build and preview

```bash
npm run build          # static site → out/ (must finish without errors)
npm run check-links    # every internal link and image must resolve
npx serve out          # preview at http://localhost:3000 (or: npm run dev for live reload)
```
Open the pages you changed and check them on desktop and at phone width. `npm run release` runs the build and link check again, but look at your change yourself first.

### 4. Choose the version bump

Versions are **vXX.XX.XXX** = major.minor.patch (in `VERSION`, shown in the site footer, history in `CHANGELOG.md`).

| Change | Part | Example |
| --- | --- | --- |
| Small: typo or text edit, swap a photo, fix a link, update a time/address, small style tweak | `patch` (last number) | v01.03.000 → v01.03.001 |
| New page, section, feature, or noticeable design change | `minor` (middle number; resets last) | v01.03.001 → v01.04.000 |
| Redesign, new site structure, or changes that break existing URLs | `major` (first number; resets the others) | v01.04.000 → v02.00.000 |

One release with several changes takes the largest part that applies. The summary is one plain-English line a non-technical reader understands, e.g. `"Updated Quran 101 time to 7:30 PM"`.

### 5. Release (commit + push)

```bash
npm run release -- patch "Updated Quran 101 time to 7:30 PM"
```

What it does, in order:
1. Refuses to run if there's nothing to release, or if `VERSION`/`CHANGELOG.md` were edited by hand.
2. Syncs with `origin` (rebase, keeping your uncommitted work).
3. Runs `npm run build` and `npm run check-links` and stops on any failure.
4. Bumps the version and adds the changelog entry.
5. Commits everything as `vXX.XX.XXX: summary` and pushes.
6. If the push is rejected because someone pushed first, it undoes its own commit (keeping your work), syncs, re-checks, re-bumps on top of the newer version, and retries (up to 5 times).

Use `--dry-run` to check everything without committing. Avoid `--skip-checks`.

It stages **all** changes (`git add -A`), so run `git status` first and make sure only your intended files are modified.

### 6. Confirm and report

- On `main`: the push publishes the site. GitHub Actions builds and deploys it (~2 minutes) and tags the version. Check it with `gh run list --limit 3` and open the changed page on the live site.
- Tell the user what changed, the new version (e.g. `v01.03.001`), and the live link to the changed page.

## Working on a branch / from GitHub (`@claude`)

When you're invoked from a GitHub issue or pull request, or the change is large or needs review:
1. Work on a branch (`git switch -c short-description`, or the branch you were given).
2. Do steps 1–5 as above. `npm run release` pushes the branch (setting upstream the first time).
3. Open or update a pull request into `main` with a short description and the new version.
4. The **Version check** workflow requires the PR's `VERSION` to be higher than `main`'s, with a matching changelog entry, and the build to pass. If `main` moved and the check fails, merge or rebase `main` into your branch, accept `main`'s `VERSION` and `CHANGELOG.md`, then run `npm run version:bump -- <part> "summary"` again, commit, and push.
5. The site goes live when the PR is merged into `main`.

## When several agents work at once

- `npm run release` handles the common race (both bump to the same number) automatically. The later push re-bumps on top of the earlier one, so versions never collide and no changelog entry is lost.
- If it reports a **real content conflict** (two people edited the same lines), it stops without losing anything. Resolve it by hand: `git pull --rebase --autostash`, fix the conflicted files, `git add` them, `git rebase --continue`, then run `npm run release` again.
- Keep releases small and frequent; don't sit on unpushed work.
- Never rewrite published history: no force-push, no amending pushed commits, no deleting tags.

## Troubleshooting

| Problem | Fix |
| --- | --- |
| Build error in an `.mdx` file | Usually a stray `<` or `{` in text: write `&lt;` / `&#123;`, or close the JSX tag. |
| `check-links` reports a broken link | Fix the path, add the missing file, or add a redirect in `lib/redirects.ts`. |
| Image or PDF missing on the live site but fine locally | It was linked with a hard-coded prefix or an absolute URL; use a root path like `/img/x.jpg`. |
| Deploy failed on GitHub | `gh run list --limit 3`, then `gh run view <id> --log-failed`. Fix, then release a `patch`. |
| `npm run release` says no changes | Your edits aren't saved, or are already committed. Check `git status` and `git log -1`. |
| Push rejected 5 times | Others are pushing a lot; wait a minute and run the same command again (your work is still in the working tree). |
| Need to undo a released change | Don't revert by force-push. Make the fix (or `git revert <commit>`) and release it as a new `patch`. |
