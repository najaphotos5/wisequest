---
name: task-queue
description: How the hourly WiseQuest Telegram assistant splits big or multi-part requests into small tasks, keeps ONE shared queue, works on exactly one task per hourly run, tells people the queue order, and lets them reorder it. Used by the hourly /todo routine (Step 3).
---

# Task queue: one task per hour

Every website change waits in **one shared queue**. Each hourly run works on **exactly one task**, the first ready one in the queue, and publishes it. The next run takes the next task.

**Why split at all: quality.** One small task per run means the whole hour goes to doing that one change really well, instead of rushing several. Each task must be finished to a high standard before it is published (see "Quality bar" below). Small tasks are also easier to check and to undo.

## Quality bar (every task, before publishing)

A task is only done when all of these are true. If one fails, fix it in the same run. If it can't be fixed, don't publish: ask, or leave the task `queued` with a note for the next run.

1. **Matches the request exactly.** Re-read the task text and the original request (and any follow-ups). Every part of this task is done, and nothing else was changed. Quotes and given wording are copied character for character.
2. **Reads well.** Re-read the changed page text from start to finish in the built output.
   - It should have plain, warm English, short sentences and correct spelling and grammar.
   - Headings, lists and the tone must match the rest of the page and follow the update-site skill's wording rules.
   - There must be no leftover placeholder text, no duplicated content, and nothing that contradicts what the page already says.
3. **Looks right.** Check the built page at desktop width and at phone width (about 390 px).
   - The layout must not be broken, the text must not overflow, tables and grids must stay readable, and images and videos must load with proper alt text and captions.
   - Compare against how the page looked before, so nothing else moved or broke.
   - If a headless browser is available in the run (e.g. a Chromium already installed), take screenshots at both widths and look at them. Don't add packages to the project for this. Otherwise, check the built HTML and the Tailwind classes for phone layouts: `sm:`/`md:` breakpoints, `overflow-x-auto` on wide content, no fixed widths wider than the screen.
4. **Works.**
   - `npm run build && npm run check-links` must pass, with no new warnings.
   - Links go where they should, buttons and videos work, and dark/light theme and dev mode still look fine.
5. **Respectful and accurate.**
   - Religious content uses only sourced wording (see the main rules).
   - Claims of fact are ones the request or the site already supports. Nothing invented.
6. **Live check.** After publishing, open the live page with a cache-buster (`?t=<time>`). Confirm the change is there and looks the same as in the preview.

In the "done" reply, describe exactly what changed, so people can check it themselves. Never call a task done if you skipped a step: say what is left instead.

## State (in `state.json` on `claude/telegram-state`)

- `queue`: ordered list of task keys waiting, e.g. `["9.1", "11.1", "11.2", "12.1"]`. The front is worked on first.
- On each request: `tasks: [{n, title, status, pr?, merge_sha?, version?}]`.
  - `title` is a short plain description of the change, e.g. "Add 'Jesus in Islam' section under the videos". Never put names in it.
  - `status`: `queued` · `working` · `preview` · `needs-info` · `done` · `declined` · `reverted`.
  - Preview tasks also have `preview_message_id` and `preview_at` (unix seconds).
- The request's own status is `queued` while it has tasks left, and `done` when every task is done or declined.
- Old fields (`branch`, `pr`, `merge_sha` on the request) still work for requests made before the queue existed.

## 1. Turn a request into tasks

Do this for every new request: a `/todo`, an accepted idea or a website request. Also do it for a needs-info request once it has been answered.

- **Simple request** (one focused change on one page): 1 task.
- **Complex request or several asks** (e.g. "add a video, fix the table and write a new section", changes on several pages, or an idea with 3+ separate steps): split it into **2–6 tasks**.
  - Each task is one focused change that can be published on its own and makes sense on its own.
  - Size it so it can be done **really well in one run**, including every check in the Quality bar. If a task looks too big to do carefully in one run, split it further.
  - Order them so each one builds on the one before (e.g. "create the page" before "link to it from the menu").
  - Don't split one small change into pieces just to make more tasks.
- Each task's full instructions are the matching part of the request (or the idea's `todo`). Keep them exact. Quran/hadith wording is copied word for word, never split mid-quote.
- Add the tasks to the **back** of `queue`, in order.
- Then react 👀 and reply once under the request (see Messages).

## 2. Each hourly run: one task

1. First handle reverts, commands and reorder requests (sections 4–5 and the telegram-commands skill). Answering questions doesn't count as the run's task.
   - **If publishing is paused** (`state.paused`, set by an owner with `/pause`): stop here. Keep recording, splitting and queueing new requests, and mention in replies that publishing is paused, but don't work on or publish tasks.
   - **Previews first:** for every task in `preview` (section 2b), publish it if it was approved, or if 2 hours have passed with no 👎 and no change request. Publishing a preview counts as this run's one publish.
2. Take the **first task in `queue` whose status is `queued`**.
   - Skip tasks that are `needs-info`: they keep their place, and the next ready task goes ahead.
   - If the queue is empty, finish quietly.
3. Work on it exactly as the main prompt describes. That means its own branch (`claude/todo-<id>-<n>`, also used as the PR `head`), its own version bump, its own PR, published and checked live. Meet every point of the **Quality bar** before publishing, and take the time you need: this is the only task this run. Then remove it from `queue` and set it to `done` with its `pr`, `merge_sha` and `version`.
4. If the task turns out to need information: ask (🤔 + numbered questions), set the task to `needs-info` and leave it in the queue. If time is left, you may start the next ready task, but **never publish more than one task per run**.
5. If the task isn't allowed: decline that task only (🙏 + reason), set it to `declined`, remove it from the queue. The other tasks of the request carry on.

## 2b. Preview before publishing (big or sensitive changes only)

Most tasks publish straight away. These need a **preview first**:
- the homepage, the main menu/navigation, the footer or anything shown on every page (site-wide layout, colours, fonts, `app/layout.tsx`, `lib/site.ts`, `app/globals.css`)
- the Palestine page
- deleting, renaming or moving a page (anything that changes a URL)
- adding or replacing more than ~300 words of religious content
- a change that touches 5 or more pages

How it works:
1. Do the work on the task's branch and open the PR as usual, meeting the Quality bar, but **don't merge**.
2. Take screenshots of the changed page(s) from the **local build** (section 2c), at phone width and desktop width.
3. Reply under the request with:
   - an Arabic opening, then: "This is a larger change, so here is a preview before it goes live:"
   - the screenshots (a media group)
   - 2–4 bullets saying exactly what changes
   - "👍 = publish it now · Reply with any changes you would like. If there is no reply within 2 hours, I will publish it."
4. Set the task status to `preview`, with `preview_message_id` (the text message) and `preview_at`. It leaves the queue's working slot, so later runs may work on the next task meanwhile.
5. In later runs:
   - **👍 or an approving reply** from the requester or an owner: publish it.
   - **A reply asking for changes:** make them on the same branch (this counts as the run's task) and post a new preview. The 2 hours restart.
   - **👎** with no explanation: set it to `needs-info` and ask what they would like changed.
   - **2 hours with none of these:** publish it.
6. If screenshots can't be taken, the preview is the bullets plus a short quote of the new text (up to ~500 characters).

## 2c. Screenshots (previews and "done" replies)

**After every published task**, send a phone-width **before** and **after** screenshot of the main changed page as a media group, replying to the "done" message. Captions: "Before" and "After". For a brand-new page there is only "After". This lets people check the result without opening the site.

How:
- **Before:** take it from the live site just before merging.
- **After:** take it from the live site after the deploy is confirmed. Add `?t=<time>` to bypass the cache.
- **Previews:** take them from the local build (`npx -y serve out -l 4321` in the background, then http://localhost:4321/<path>/).
- **Viewport:** phone 390×844 at deviceScaleFactor 2; desktop 1280×800. Capture the top of the page plus the changed section (scroll to it), not the whole page.
- **Tool:** use Playwright with Chromium, installed in a scratch folder **outside the repo**. Never add it to the project's package.json. For example: `mkdir -p /tmp/shot && cd /tmp/shot && npm init -y && npm i playwright@1 && npx playwright install --with-deps chromium`, once per run.
- **Sending:** `sendMediaGroup` with `multipart/form-data` (attach://before, attach://after) and `reply_parameters` to the done or preview message.
- **If anything fails** (no browser, blocked download, timeout): skip the screenshots silently and mention it only in the run summary. **Never** let screenshots delay or block publishing.

## 3. Messages (Telegram, following telegram-voice)

- **After splitting**, reply under the request with: an Arabic opening from telegram-voice, then "I have divided this into N tasks and will complete one each hour, so that each is done carefully:" with a numbered list of the task titles. Then "If you would prefer a different order, please reply, for example: do task 3 first."
- **When something is already waiting in the queue**, a new request is added to the back. The reply then also shows the **whole queue order**, marking the new tasks and the one in progress:
  ```
  📋 Queue order (one task per hour):
  1. ✍ Add 'Jesus in Islam' section (request 9), now in progress
  2. Fix photo captions on Stories (request 11)
  3. 🆕 Add Friday times to the Local page (your request)
  If you would prefer a different order, please reply, for example: move 3 to 1.
  ```
  Keep each line short. If more than 8 tasks are waiting, show the first 8 and "…and N more".
- **After each task is done:** the usual "done" reply under the request, starting with "Task n of N done". Include what changed, the version, the live link and "If you would like this task undone, please reply /revert <id>.<n>." Add "Next up: <next task title>" if this request still has tasks left, or the closing duʿāʾ when it was the last one.
- Never post more than one queue message per request per run.

## 4. Changing the order

- People can reorder by **replying to any queue message or request message**, or by writing in the group. For example: "move 3 to 1", "do task 3 first", "put the photo task last", "قدّم المهمة 3".
  - Positions refer to the numbers in the latest queue message.
  - A clear description of a task also works ("the Local page one first").
- **Who:** anyone can move their **own** request's tasks. Owners can move anything. Moving someone else's task ahead of yours needs an owner. If it isn't allowed or isn't clear, ask kindly.
- A task already in progress stays where it is.
- After reordering, reply with the new queue order (same format) and a short friendly line.
- `/queue` from anyone shows the current queue order (same format). If nothing is waiting, say the queue is empty with a fitting phrase.
- `/queue remove N`: the requester (for their own task) or an owner removes a waiting task. Set it to `declined` and say so.

## 5. Reverts

- `/revert <id>.<n>` undoes one task (its `merge_sha`).
- `/revert <id>` undoes every done task of that request, newest first, in one revert branch and PR.
- Also remove that request's waiting tasks from the queue, if any.
- Reverts are handled before the run's task and don't count as it.

## Rules

- If you change these rules (commands, ordering, reverts), also update the pinned help message: see `.claude/skills/telegram-pinned/SKILL.md`.

- Only one task is published per run. Reverts are extra, and needs-info questions are free.
- The queue is first come, first served unless people reorder it.
- Ideas from the daily suggestion join the queue like any request when accepted.
- Never drop a task silently: every task ends as done, declined or reverted, with a message.
