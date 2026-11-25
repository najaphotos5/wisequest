---
name: bot-operations
description: Reliability rules for the WiseQuest Telegram routines. Covers the run lock (two runs never overlap), detecting and announcing missed messages after a gap, health alerts to the owners when runs fail, the separate health-check routine, and daylight-saving-proof scheduling. Required at the START and END of every hourly assistant run.
---

# Bot operations: lock, gaps, health, schedule

All state lives in `state.json` on branch `claude/telegram-state`. It holds ids, times and counts only. Never store names, message text, tokens or error output that could contain secrets.

## 1. Run lock (start of every hourly run, before getUpdates)

1. `git fetch origin claude/telegram-state` and read `state.lock` = `{started_at, run}`. `started_at` is in unix seconds, and `run` is a short id such as the UTC time.
2. If `state.lock` exists and `now − started_at < 75 minutes`, another run is still working. **Stop immediately and quietly:** don't call getUpdates, don't send anything, don't push. Report "skipped: previous run still active" in the summary.
3. Otherwise (no lock, or a stale one older than 75 minutes), take the lock:
   - set `state.lock = {started_at: now, run: "<UTC time>"}`
   - commit "state: lock <UTC time>" and push
   - If the push is rejected because the branch moved, fetch again and go back to step 2. Another run may have just taken it.
4. At the **end** of the run, write `state.lock = null` in the same final state commit. Also do this when the run stops early because of an error, if at all possible.

## 2. Missed messages (start of every run, after taking the lock)

Telegram keeps unread updates for only 24 hours.
- Read `state.last_run_at`, the unix time when the previous run finished successfully.
- If it is more than **20 hours** ago, some messages may have expired. After processing updates, post **one** message:
  - an Arabic apology opening (telegram-voice)
  - then formal English: "I was unable to check the group between <start> and <end> (Pacific time). Some messages from that period may not have reached me. If you sent a request then and have not received a reply, please send it again."
- At the end of every successful run, set `state.last_run_at = now`.

## 3. Health alerts

The hourly run keeps `state.health = {failures, last_error_kind, alerted_at}`.
- `last_error_kind` is one short label: `telegram`, `build`, `deploy`, `merge`, `push`, `github`, `quota` or `other`. No error text. Use `quota` when the run hit a usage or rate limit, or ran out of time before finishing.
- **A failed run** is one that could not finish its main work: the build or check-links failed on main itself, merging or deploying failed, the state push failed after retries, or GitHub was unreachable. Then add 1 to `failures` and set `last_error_kind`.
- **A successful run** sets `failures = 0`.
- **Alert** when `failures ≥ 2` and there has been no alert in the last 12 hours (`alerted_at`). Post one short message to the group:
  - mention both owners as `<a href="tg://user?id=5763295123">owner</a>` and `<a href="tg://user?id=5186537636">owner</a>`, with `parse_mode: HTML`
  - add one formal English line per problem, e.g. "The last 2 runs could not publish: the website build is failing on main. Please take a look."
  - then set `alerted_at`
  - If Telegram itself is the problem, you cannot post. The health-check routine (section 4) covers that case.
- When things work again after an alert, post one short line saying it has recovered, and clear `alerted_at`.

## 3b. Running out of quota (usage limits)

When a run can't finish because of usage or rate limits, there is usually nothing it can post at that moment.
- Before stopping, if possible, record `last_error_kind: "quota"` and `quota_hit_at` in state, and release the lock.
- **The next run that works** should mention the delay in its first message to the group, or in its first reply to whoever was waiting, with Arabic humour from the telegram-voice "Out of quota" row, e.g. "كلود خلّص بطاريته اليوم 🪫😅". Then explain in formal English: "Some requests were delayed because the assistant reached its usage limit. Everything is back to normal, and I am working through the queue now."
- Do this once per incident, then clear `quota_hit_at`.
- The same applies when a run notices it is starting much later than expected (more than 2 hours since `last_run_at`).

## 4. Health-check routine (separate, every 3 hours)

A small separate routine, "WiseQuest health check", runs every 3 hours. It **never** calls getUpdates and never changes the website.
- It reads `state.json` from `claude/telegram-state`.
- If `last_run_at` is more than **3 hours** old (the hourly assistant has stopped running or keeps failing before it finishes), it posts **one** alert to the group, mentioning both owners as in section 3:
  - "The hourly assistant has not completed a run since <time> (Pacific). Requests are not being processed. Messages older than 24 hours will be lost, so please check the routine at https://claude.ai/code/routines."
  - It then records `{alerted_at}` in `health-check.json` on the same branch. That is the only file it writes.
  - It alerts at most once per 12 hours.
- Once `last_run_at` is fresh again, it clears `alerted_at` and stays silent.

## 5. Daylight-saving-proof schedules

Cron times are in UTC, and Pacific time shifts on the second Sunday of March and the first Sunday of November.
- **Daily idea (8 AM Pacific) and weekly report (Friday 9 AM Pacific):** each routine is scheduled at **both** possible UTC hours, and its skill starts with a guard: "If the current hour in America/Los_Angeles is not <the target hour>, stop immediately without doing anything."
  - daily: crons at 15:00 and 16:00 UTC
  - weekly: Fridays at 16:00 and 17:00 UTC
- **The hourly assistant** runs every hour, so it needs no change. Its time-of-day rules (reminders, the check-in) always use America/Los_Angeles time.

## 6. Pause

When owners send `/pause`, `state.paused = {since}`; `/resume` clears it (see telegram-commands).
- **While paused:** keep reading and recording requests, splitting and queueing them, and replying (with a note that publishing is paused). Do **not** work on or publish queued tasks.
- **Still allowed while paused:** reverts (`/revert`, `/undo`), which restore the site, and the read-only commands.
