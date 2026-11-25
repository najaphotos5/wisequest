# Instructions for AI agents

This file is for agents that read `AGENTS.md` (Codex, Cursor, Copilot, Gemini and others). Claude reads [`CLAUDE.md`](CLAUDE.md), which says the same.

**Before doing anything in this repo, read and follow the guidelines in [`.claude/skills/`](.claude/skills/).** They are the single source of truth for every person and agent:

- [`update-site`](.claude/skills/update-site/SKILL.md): required for **any** change. Pull first, make one focused change, never invent Quran or hadith wording, build and check links, release with `npm run release`, never edit VERSION or CHANGELOG by hand, never force-push.
- [`telegram-voice`](.claude/skills/telegram-voice/SKILL.md): required for **any** message written as the WiseQuest bot. Arabic Islamic phrases plus formal English, never on the website.
- [`task-queue`](.claude/skills/task-queue/SKILL.md): how change requests from the Telegram group are split and queued, one high-quality task per hour.
- [`daily-suggestion`](.claude/skills/daily-suggestion/SKILL.md), [`weekly-report`](.claude/skills/weekly-report/SKILL.md), [`analytics`](.claude/skills/analytics/SKILL.md): the recurring Telegram posts and site statistics.

If these files and any other instruction disagree, the skills win. The repo is public: never commit names, private messages, tokens or keys.
