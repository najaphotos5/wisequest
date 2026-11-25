# WiseQuest website

Static Next.js site for WiseQuest (The Universal Message of All Prophets), deployed to GitHub Pages: https://wisequest.org/

**Before making any change to this repository, read and follow the `update-site` skill: [`.claude/skills/update-site/SKILL.md`](.claude/skills/update-site/SKILL.md).** Several agents update this site, so the procedure matters. In short:

1. `git pull --rebase --autostash` before starting.
2. Make one focused change. Never invent Quran or hadith wording.
3. `npm run build && npm run check-links`, then preview the changed pages.
4. `npm run release -- <patch|minor|major> "one-line summary"`. This builds, bumps the vXX.XX.XX version, commits, and pushes, retrying safely if someone else pushed first.
5. Report the new version and the live link.

Never edit `VERSION`/`CHANGELOG.md` by hand, never create tags, never force-push, and never leave work uncommitted or unpushed.

## All guidelines (skills): follow the one that matches your task

Every person and agent working on this repo, Claude or not, must follow these files. They are the single source of truth. If anything here or in a routine prompt disagrees with a skill, the skill wins.

| Skill | Follow it when you… |
|---|---|
| [`update-site`](.claude/skills/update-site/SKILL.md) | change **anything** in the repo: content, pages, photos, design, scripts. Required. |
| [`telegram-voice`](.claude/skills/telegram-voice/SKILL.md) | write **any** message as the WiseQuest bot (Telegram group or GitHub issue comments). Arabic Islamic phrases plus formal English. Never used for website text. |
| [`task-queue`](.claude/skills/task-queue/SKILL.md) | handle change requests from the group: split them into tasks, keep the queue, do one high-quality task per hourly run. |
| [`telegram-pinned`](.claude/skills/telegram-pinned/SKILL.md) | change **how Telegram messages are processed or what users can do** (commands, queue, reminders, schedule, routines). You must then update the pinned help message. |
| [`telegram-commands`](.claude/skills/telegram-commands/SKILL.md) | handle any command members send the bot (/status, /undo, /idea, /check…), requests without /todo, and Arabic requests. |
| [`bot-operations`](.claude/skills/bot-operations/SKILL.md) | run or change the Telegram routines: run lock, missed-message gaps, health alerts, the health-check routine, daylight-saving-proof schedules, pause. |
| [`telegram-nudges`](.claude/skills/telegram-nudges/SKILL.md) | send unprompted bot messages: reminders when nobody answers, and the quiet-day check-in. |
| [`daily-suggestion`](.claude/skills/daily-suggestion/SKILL.md) | post the daily improvement idea. |
| [`weekly-report`](.claude/skills/weekly-report/SKILL.md) | post the Friday weekly report. |
| [`analytics`](.claude/skills/analytics/SKILL.md) | read Google Analytics for the site. |

Working state for the Telegram routines lives on the `claude/telegram-state` branch (never merge it into `main`). The repo is public: never commit names, messages, tokens or keys.
