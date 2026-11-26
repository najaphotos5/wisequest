---
name: website-report
description: The detailed wisequest.org analytics report as a PDF (Google Analytics + quality scores) and how to share it. Generate it with `npm run report:pdf`, summarise the key points in the Telegram message, and attach the PDF. Used by the Friday weekly report and the /report command. Keep improving it through the Lessons section and the checklist below.
---

# Website report (PDF)

A clear, well-designed PDF that a volunteer can read in 3–5 minutes. It shows how the site is doing: who visits, what they read, how long they stay, and where to improve. The Telegram message gives the key points, and the PDF holds the details.

## 1. Generate it

```bash
npm ci                      # once per run
npm run build               # so out/dev-data/scores.json exists (quality scores per page)
npm run report:pdf          # last 7 days + last 28 days → /tmp/wisequest-report-<date>.pdf
npm run report:pdf -- --days 28 --out /tmp/report.pdf --html /tmp/report.html   # other period; keep the HTML
```

- **Inputs:** Google Analytics comes through `scripts/ga-report.ts`, which is read-only and uses the credentials described in the `analytics` skill. Quality scores come from `out/dev-data/scores.json`, and page titles from the content front matter.
- **Output:** the command prints JSON with the PDF path and everything the Telegram message needs: `visitors`, `pageViews`, `engagedSecPerVisitor`, `engagementRate`, `visitors28`, `top`, `quality` (averageText, averagePage, prevText, prevPage), `attention` (top 5 pages with reasons and the fix) and `improvements` (count and groups by topic).
- **Rendering:** the preinstalled Chrome (`/usr/bin/google-chrome` in the cloud, or Chrome.app on macOS) prints the HTML to PDF. There are no extra packages, and none may be added.
- **Checking the layout:** whenever you change the design, keep the HTML (`--html`) and take a screenshot of it with headless Chrome, then look at it.
- **If Google Analytics fails:** don't send a PDF. Say "visitor statistics are unavailable this week" in the message.

## 2. What the PDF contains (keep this order)

**Until 28 full days of data exist** (tracking began on 2026-11-22, so on 2026-12-20; set by `GA_TRACKING_START` in the script):
- show only the last 7 days, without the 28-day key numbers and the 28-day top pages
- label every other section "last 7 days"
- add a short note that the 28-day figures will appear later

The script does this automatically, and prints `visitors28: null` and `daysOfData`. In the Telegram message, mention the 28-day numbers only when `visitors28` is not null.


1. **Cover:** both periods (dates) and the generation date. Below it, a "small numbers" note while weekly page views are under 300.
2. **Improvements published** in the period: visitor-facing changes from `git log origin/main` (content, app, components, public, lib, data), grouped by page or topic, with version and date. Internal tools (dev mode) and bot or skill updates are left out.
3. **Page quality ratings:** the average text rating (/10) and average page rating (/100), compared with last week's report (`reports.json`), plus the number of pages rated 85+. Then every page, lowest rated first, with its text and page scores, views and main issue. Scores come from `out/dev-data/scores.json`, so run `npm run build` first.
4. **Key numbers** for the last 7 and last 28 days, each with ▲/▼ vs the previous period of the same length: visitors, new visitors, visits, page views, engaged time per visitor, engagement rate, pages per visitor.
5. **Visitors per day** (last 28 days): a bar chart.
6. **Top pages, last 7 days:** views, visitors, engaged time per visitor, engagement rate, quality score, and change in views.
7. **Top pages, last 28 days** (same columns, without the change).
8. **Pages that need attention**, busiest first: visitors stay under 15 s, engagement is under 35%, the page rating is under 75, or the text rating is under 6/10. Each one shows why, the main issue and the suggested fix.
9. **Visitor feedback** ("Was this page helpful?"): 👍/👎 per page, % helpful, and the most common reason for 👎. Totals are in the JSON as `feedback` (yes, no, and pages where No outweighs Yes).
10. **Key pages:** Become Muslim, New Muslims, Contact, Free Quran, Quran 101 (local). Are visitors reaching them?
11. **How visitors arrive:** landing pages and traffic sources.
12. **Where visitors are:** the Sacramento-area share, plus countries and cities.
13. **Devices**, and **downloads** (which files).
14. **All tracked actions** (events).

**Rules for the content:**
- Plain, formal English, never Arabic humour.
- No personal data: Google Analytics doesn't provide any, and never guess at individuals.
- Round all numbers.

## 3. Share it (Friday weekly report and /report)

1. Send the **summary message** first. It follows `weekly-report`, written in the `telegram-voice` style, and includes:
   - **Visitors:** last week and last 28 days (once available), with ▲/▼, page views, and average engaged time per visitor
   - **Improvements:** how many visitor-facing updates were published, and the top 2–3 grouped by page (e.g. "Jesus page (10 updates): new 'Jesus in Islam' section, videos, comparison table")
   - **Quality:** average text and page ratings with ▲/▼ vs last week, and how many pages are rated 85+
   - **Top 3 pages:** with views and engaged time
   - **Visitor feedback:** 👍 N · 👎 N (N% helpful), and any page where 👎 outweighs 👍 (only once there are votes)
   - **Needs attention:** the top 2–3 pages, each with its reason and the fix in a few words
   - **Visitors come from:** the top source and the local share
   - **The week's one action**
   - a final line: "📄 The full report is attached below."
2. Then send the **PDF** as a reply to that message:
   - use `sendDocument` (multipart/form-data, `document=@/tmp/wisequest-report-<date>.pdf`, `reply_parameters` to the summary message)
   - the file name is `WiseQuest-report-<YYYY-MM-DD>.pdf`
   - the caption is "WiseQuest website report, <period>"
3. If the PDF fails to generate or send, keep the summary message and note it in the run summary. Never block the report on the PDF.
4. Log in `reports.json` (weekly routine) or in the run summary (/report): `pdf_sent: true/false`.

## 4. Improving the report

Use this checklist when changing the script, `scripts/report-pdf.ts`:
- Readable on a phone screen: 11 px body text minimum, tables no wider than the page.
- Every number has a label and, where useful, a comparison.
- Show ▲/▼ only when both periods have data, otherwise "n/a".
- New sections go **after** the existing ones unless the owners ask otherwise.
- After any change: generate it, screenshot the HTML, check it, then `npm run release`.

Ideas that are not yet built (add them when they make sense):
- per page, "changed since the original site" (words and sections added), using `npm run original`
- a month-over-month view
- a trend line per top page
- Google Search Console queries (would need new access)
- comparing pages before and after a change

## Lessons

<!-- Owners or routines add what readers liked, didn't use or asked for. Newest first. -->
- 2026-11-25: First version. Owners want a detailed PDF with the Friday report: top pages, visitors for the week and month, average engagement per page, and more.
