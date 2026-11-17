# WiseQuest website

Static Next.js site for WiseQuest (The Universal Message of All Prophets), deployed to GitHub Pages: https://najaphotos5.github.io/wisequest/

**Before making any change to this repository, read and follow the `update-site` skill: [`.claude/skills/update-site/SKILL.md`](.claude/skills/update-site/SKILL.md).** Several agents update this site, so the procedure matters. In short:

1. `git pull --rebase --autostash` before starting.
2. Make one focused change. Never invent Quran or hadith wording.
3. `npm run build && npm run check-links`, then preview the changed pages.
4. `npm run release -- <patch|minor|major> "one-line summary"`. This builds, bumps the vXX.XX.XXX version, commits, and pushes, retrying safely if someone else pushed first.
5. Report the new version and the live link.

Never edit `VERSION`/`CHANGELOG.md` by hand, never create tags, never force-push, and never leave work uncommitted or unpushed.
