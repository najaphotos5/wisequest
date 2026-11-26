---
name: weekly-report
description: Build and post the weekly wisequest.org report in the WiseQuest Telegram group. It covers visitors and engagement vs last week (Google Analytics), progress and regressions per page, quality-score changes, what was published, and ONE action. Used by the "WiseQuest weekly report" cloud routine every Friday (9 AM Pacific). Edit the Lessons section to steer it.
---

# Weekly report: simple, actionable, progress vs regression

Every Friday, post **one** short report about the previous 7 days (last Friday – Thursday) in the WiseQuest Telegram group (chat_id `-1004488348585`). A busy volunteer should understand it in 30 seconds and know the one thing to do next.

**Time guard (daylight saving):** this routine is scheduled at two UTC times on Fridays. First check the time: if it is not between 9:00 and 9:59 AM in America/Los_Angeles, stop immediately and do nothing (see `bot-operations` section 5). Also stop if `reports.json` already has an entry for this week.

**You only report. Never edit the website in this run**, except the monthly Lessons update below.

## 1. Gather data

1. **Google Analytics**, this week vs the previous week: `npm run ga -- all 7 --compare --json > /tmp/ga.json`. The credentials come from the env var `GA_SA_KEY_B64`; see `.claude/skills/analytics/SKILL.md` for how to read the numbers. If GA fails, still post the report without visitor numbers, and say "visitor stats unavailable this week".
2. **Quality scores:** `npm ci && npm run build`, then read `out/dev-data/scores.json` (site `averageText`/`averagePage`, per-page `pageScore`/`textScore`).
3. **What was published:** `git log --since="8 days ago" --pretty="%s" origin/main` (subjects look like `vXX.XX.XX: summary`). Count the releases and pick the 2–3 most visible ones.
4. **State branch:** `git fetch origin claude/telegram-state`, then read:
   - `reports.json`: past reports `[{week_end, message_id, totals, pages:{path:{views, engagedSec}}, quality:{averageText, averagePage, pages:{path: pageScore}}, action}]`. Last week's entry is the baseline for quality and for anything GA can't compare.
   - `feedback.json`: reactions on past reports (keyed by message_id), adoptions, and requests (did last week's action get done?).
   - `suggestions.json`: avoid choosing the same page as an action that was suggested in the last 3 days.

## 2. Decide what matters (small-site rules)

- Treat changes as real only with enough volume. For pages, at least ~10 views in one of the two weeks. Otherwise say "too few visits to tell".
- Percent changes only when both weeks have at least 20 visitors. Otherwise give plain numbers ("12 → 19 visitors").
- **Progress (📈):** up to 3 of:
  - pages with clearly more views or longer engaged time
  - quality scores that went up (e.g. "Palestine page 39 → 72 after this week's fixes")
  - a working source (e.g. more Google visits)
- **Needs attention (📉):** up to 3 of:
  - pages with fewer views or shorter time
  - pages people leave in under ~15 s (with ≥10 views)
  - quality scores that dropped
  - weak mobile engagement
- **Published:** the number of releases this week, plus 2–3 notable ones in plain words.
- **Action:** exactly ONE, the biggest opportunity: usually the top 📉 item, or a page with high views but low engaged time and a low quality score. Describe it in one plain sentence in the message. Save the full change description (page link + exact change) as `action_todo` in `reports.json`; the hourly assistant does it when someone reacts 👍 or replies "approve" / "go ahead". Never put a `/todo` line in the message.

## 3. Message (plain text, max ~15 lines, no tables)

The Arabic greeting and closing lines in the templates here are only examples: pick fresh ones from the phrase bank in `.claude/skills/telegram-voice/SKILL.md` each time (rotate; don't repeat yesterday's or last week's).

```
السلام عليكم ورحمة الله
جمعة مباركة 🤍

📊 Weekly report: <Fri d> – <Thu d>

👥 Visitors: N this week (▲/▼ x%) · N in the last 28 days (only once 28 days of data exist) · Views: N · Avg time engaged per visitor: Xs
🏆 Top pages: <page> (N views, Xs) · <page> · <page>
🌍 Visitors come mostly from: <source>; Sacramento area: N%
⭐ Site quality: text X/10, pages Y/100 (▲/▼ vs last week) · N of M pages rated 85+
🛠 Improvements this week: N updates, e.g. <page> (<what>), <page> (<what>)

📈 Progress
• <item>
• <item>

💬 Visitor feedback: 👍 N · 👎 N (N% found pages helpful); most 👎: <page> (<top reason>). Leave this line out while there are no votes.

📉 Needs attention
• <page>: <reason> → <fix in a few words>
• <page>: <reason> → <fix>

👉 Suggested action: <one plain sentence naming the page and the change>
👍 = yes, please proceed (or reply "approve") · 👎 = skip

📄 The full report is attached below.

وفقنا الله وإياكم
```

Rules for the text:
- Summarise **everything** in the PDF: visitors, improvements, quality ratings, top pages, pages needing attention, sources, and the action. Keep each point to one line; the PDF has the details. Take the numbers from the `report:pdf` JSON output.
- Follow `.claude/skills/telegram-voice/SKILL.md` for greetings and phrases: e.g. ما شاء الله / الحمد لله for progress, لا بأس for regressions. All English in the report is formal. An Arabic joke is welcome when it fits (telegram-voice section 5), e.g. on a record week.
- Use plain words: "visitors", "time spent reading". Not "sessions", "engagement rate".
- Round numbers. Show ▲ for better and ▼ for worse.
- For the first report, or when there's no baseline, say "first week, no comparison yet" instead of inventing changes.
- Never include names. GA has none; don't guess who visited.

## 4. Post and save

1. **Generate the detailed PDF first:** `npm run build && npm run report:pdf`. Follow `.claude/skills/website-report/SKILL.md`, and use its printed key numbers for the message.
2. Send the message with `sendMessage` to `-1004488348585`, with `link_preview_options={"is_disabled":true}`. Exactly **one** text message, not pinned. **Never call getUpdates.** The hourly assistant is the only reader.
3. Attach the PDF as a reply to that message with `sendDocument` (website-report section 3). If the PDF fails, keep the message and note it in the summary.
2. Append this week's entry to `reports.json` on `claude/telegram-state` (separate worktree): `{week_end, message_id, pdf_sent, totals, pages:{path:{views, engagedSec}}, quality:{averageText, averagePage, pages}, action, action_todo}`. If the push is rejected because the branch moved, fetch, re-apply and push again. Write **only** `reports.json`.

## 5. Keep improving (monthly)

On the **first Friday of each month**, read the last 4 reports and their feedback:
- reactions (👍 = action accepted, 👎 = skipped)
- whether each week's action was done (accepted and published, or a release touching that page)
- whether the flagged 📉 items improved the following week

Add 2–3 short lessons to the **Lessons** section below, e.g. "Actions about photos get done; long rewrites don't" or "Mobile time keeps dropping". Then release them with `npm run release -- patch "Weekly report: monthly lessons"`, changing only this file.

## Lessons

<!-- Owners or the monthly update add lessons here, newest first. -->
- (none yet; the first report is on Friday 2026-11-27)
