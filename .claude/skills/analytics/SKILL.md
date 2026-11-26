---
name: analytics
description: Read and analyze Google Analytics (GA4) for wisequest.org — page views, time on page, traffic sources, devices, locations, trends, downloads — and turn them into a short plain-English summary with concrete next steps. Use for "how is the site doing", "which pages are popular", "how long do people stay", weekly/monthly reports, or to inform the daily suggestion.
---

# Analyzing wisequest.org with Google Analytics

Read-only access to the GA4 property **565414333** ("WiseQuest Website", stream "WiseQuest site", measurement ID G-NNLSSQ6TYM) through `scripts/ga-report.ts`. It never changes anything in Google Analytics.

## 1. Get the data

```bash
npm run ga -- all 28          # every report for the last 28 days (default)
npm run ga -- pages 7         # one report, last 7 days
npm run ga -- overview 28 --json   # JSON for further analysis
npm run ga -- pages 7 --compare    # this week vs the previous week (any report)
npm run ga -- realtime        # who is on the site right now
```

Reports: `overview` (totals vs the previous period) · `downloads` (which files were downloaded) · `feedback` ("Was this page helpful?" answers per page: events `feedback_yes`, `feedback_no`, `feedback_no_<unclear|missing|wrong|other>`) · `pages` (views, users, avg engagement time per user) · `sources` (Google, direct, social, referrals) · `geo` (country/city) · `devices` · `daily` (trend) · `landing` (first page seen) · `events` (file_download, click, scroll, video plays…) · `realtime`.

Credentials (service account with **Viewer** access on the property), first found wins: `GA_SA_KEY_B64` (one-line base64 of the JSON — used by cloud routines), `GA_SA_KEY` (JSON text), `GA_SA_KEY_FILE` (path), or the macOS Keychain item `ga-service-account` / account `wisequest` (base64 of the JSON). Never print, log, or commit the key. If credentials are missing, say so and stop.

Data starts on **2026-11-22** (when tracking began). Standard reports lag 24–48 h; `realtime` is immediate. Dev-mode browsers and the owner's test visits are excluded only when dev mode is on.

## 2. Analyze (small-site rules)

WiseQuest is a small site, so numbers are low and noisy. Be honest about that:
- Below ~30 views a page, treat numbers as **anecdotal** ("a handful of visits"), not trends. Don't compute percentages on tiny counts without saying so.
- Compare to the **previous period of the same length** (`overview` does this); call out changes only when both periods have meaningful volume.
- "Time on page" = `avgEngagementSec` (engaged time per user, tab in focus). Under 15 s on an article usually means people bounce; 60 s+ means they read.
- Engagement rate = share of sessions that were engaged (10 s+, 2+ pages, or an event).

Look for:
1. **Top pages** by views and by engagement time — what people come for.
2. **Underperformers**: pages with views but low engagement time → candidates for clearer wording, better intro, fewer videos. Cross-check with build-time quality scores: run `npm run build` and read `out/dev-data/scores.json` (low `textScore` + low engagement = strong case to fix).
3. **Journey**: do visitors reach `/become-muslim`, `/new-muslims`, `/contact`, `/resources/free-quran`, `/local` (Quran 101)? Few visits there = the calls to action need work.
4. **Sources**: Google search vs direct vs social vs referrals — where to invest (SEO titles/descriptions, sharing in WhatsApp groups, flyers/QR codes — QR traffic can be tagged `?utm_source=card`).
5. **Devices**: if most visitors are on mobile, prioritise mobile fixes.
6. **Location**: share of local (Sacramento area / California) vs worldwide — matters for Quran 101 and mosque pages.
7. **Downloads/events**: which PDFs people actually download (`file_download`).

## 3. Report (plain English, short)

Default format (adapt length to the request):

```
📊 WiseQuest — last 28 days
• Visitors: N (▲/▼ x% vs previous 28 days) · Page views: N · Avg time engaged: Xs
• Most read: <page> (N views, Xs) · <page> · <page>
• People come from: Google N% · Direct N% · Social N%
• Mostly on: mobile N% · From: <top city/country>
• Worth fixing: <page> gets visits but people leave quickly (Xs) — <one concrete idea>
• Good news: <something that's working>
Next step: <one action, phrased as a /todo line when useful>
```

Never include personal data (GA4 doesn't give names; don't speculate about individuals). Keep numbers rounded and caveat small samples.

## 4. Use elsewhere

- **Daily suggestion** (`.claude/skills/daily-suggestion/SKILL.md`): when credentials are available, prefer ideas for pages that get real traffic but low engagement.
- **Weekly report** (`.claude/skills/weekly-report/SKILL.md`): the Friday Telegram report — progress vs regression and one action. Use it for any recurring/weekly report so the format stays consistent.
- **Telegram**: for a one-off report in the group, post the short format above (one message).
- **Telegram commands:** members can ask the hourly assistant directly with `/stats`, `/top`, `/live`, `/sources`, `/where`, `/devices`, `/downloads`, `/trend`, `/compare`, `/journey`, `/report` and `/page <name>` (see `.claude/skills/telegram-commands/SKILL.md`). Reports: `overview`, `pages`, `realtime`, `sources`, `geo`, `devices`, `downloads` (file_download events by file), `daily`, `landing`.

## Lessons

<!-- Add what you learn about the site's audience here, newest first. -->
- (none yet — tracking started 2026-11-22)
