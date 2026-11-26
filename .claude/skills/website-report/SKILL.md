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
- **Output:** the command prints JSON with the PDF path and the key numbers (`visitors`, `pageViews`, `engagedSecPerVisitor`, `engagementRate`, `visitors28`, `top`). Use those numbers for the Telegram message.
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
2. **Key numbers** for the last 7 and last 28 days, each with ▲/▼ vs the previous period of the same length: visitors, new visitors, visits, page views, engaged time per visitor, engagement rate, pages per visitor.
3. **Visitors per day** (last 28 days): a bar chart.
4. **Top pages, last 7 days:** views, visitors, engaged time per visitor, engagement rate, quality score, and change in views.
5. **Top pages, last 28 days** (same columns, without the change).
6. **Pages that need attention:** pages with at least 5 views where visitors stay under 15 s, or engagement is under 35%.
7. **Key pages:** Become Muslim, New Muslims, Contact, Free Quran, Quran 101 (local). Are visitors reaching them?
8. **How visitors arrive:** landing pages and traffic sources.
9. **Where visitors are:** the Sacramento-area share, plus countries and cities.
10. **Devices**, and **downloads** (which files).
11. **All tracked actions** (events).

**Rules for the content:**
- Plain, formal English, never Arabic humour.
- No personal data: Google Analytics doesn't provide any, and never guess at individuals.
- Round all numbers.

## 3. Share it (Friday weekly report and /report)

1. Send the **summary message** first. It follows `weekly-report`, written in the `telegram-voice` style, and includes:
   - visitors last week and last 28 days, with ▲/▼
   - page views
   - average engaged time per visitor
   - the top 3 pages, with views and engaged time
   - one page that needs attention
   - where visitors come from (top source and the local share)
   - the week's one action
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
- a month-over-month view
- a trend line per top page
- Google Search Console queries (would need new access)
- comparing pages before and after a change

## Lessons

<!-- Owners or routines add what readers liked, didn't use or asked for. Newest first. -->
- 2026-11-25: First version. Owners want a detailed PDF with the Friday report: top pages, visitors for the week and month, average engagement per page, and more.
