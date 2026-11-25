---
name: telegram-pinned
description: The pinned help message in the WiseQuest Telegram group, which explains what members can do (requests, ideas, queue, reverts, reminders). REQUIRED whenever anyone changes how Telegram messages are processed or what users can do. Update the text below and edit the pinned message so it always matches.
---

# The pinned help message

The WiseQuest Telegram group (chat_id `-1004488348585`) has one pinned message from the bot: **message_id 5**. It tells members what they can do and what to expect. It must **always** match how the bot actually behaves.

## When you must update it

Update it in the same piece of work whenever you change **how Telegram messages are processed or what users can do**. That includes changes to:
- commands: anything in `telegram-commands` (also keep the Telegram command menu in sync, see there)
- how requests are accepted (👍, replies), the task queue or its order, reminders, check-ins, reactions
- the hourly schedule, the daily idea or the weekly report
- any routine prompt or skill that changes the above: the hourly assistant, `task-queue`, `daily-suggestion`, `weekly-report`

Changes that only affect the bot's wording or tone (`telegram-voice`) don't need an update. **Never put anything about conversation tone in the pinned message.**

## How to update it

1. Edit the text in **Current text** below, so the repo is the source of truth. Keep it formal English, plain and short, and under 4,000 characters. Use no markdown, because it is sent as plain text.
2. Edit the pinned message itself. Don't post a new message, so the pin stays:
   ```bash
   python3 - <<'PY'
   import json, os, re, urllib.request
   text = open(".claude/skills/telegram-pinned/SKILL.md").read().split("<!-- PINNED START -->\n```\n", 1)[1].split("```\n<!-- PINNED END -->", 1)[0].strip()
   body = json.dumps({"chat_id": -1004488348585, "message_id": 5, "text": text, "link_preview_options": {"is_disabled": True}}).encode()
   req = urllib.request.Request(f"https://api.telegram.org/bot{os.environ['TELEGRAM_BOT_TOKEN']}/editMessageText", body, {"Content-Type": "application/json"})
   print(json.load(urllib.request.urlopen(req))["ok"])
   PY
   ```
   - Locally, get the token from the Keychain: `security find-generic-password -a wisequest -s telegram-bot-token -w`. Never print it.
   - "message is not modified" means it is already up to date.
3. If message 5 is ever no longer pinned (check `getChat` → `pinned_message`), tell the owners instead of posting a new one. Pinning needs their decision.
4. Release the skill edit with the normal flow (`npm run release`).

## Current text

<!-- PINNED START -->
```
📌 How to use the WiseQuest bot

1️⃣ Request a change to wisequest.org
Type /todo followed by your request in the same message, in English or Arabic.
Example: /todo Add a page about Ramadan with fasting times for Sacramento
• Which page? Paste the link, e.g. wisequest.org/learn/quran
• What should change, and why?
• A screenshot helps: attach it and put /todo in the caption.
You may ask for several things in one message; the bot divides them into tasks. If you write a request without /todo, the bot will ask whether to add it to the queue (👍 = yes).

2️⃣ Daily ideas and the weekly report
Every morning (8 AM Pacific) the bot suggests one improvement. On Thursdays it is a site check for broken links, missing videos and typos. On Fridays it posts a weekly report with one suggested action.
👍 or reply "approve" = please do it
👎 or reply "no" = skip it
To adjust an idea, reply with the change.

3️⃣ The queue: one task per hour
Large requests are divided into small tasks. If you number your steps (1) … 2) …), each step becomes its own task, in your order. The bot completes one task each hour, checks it on computer and phone, and replies with before and after screenshots.
Big changes (homepage, menu, Palestine page, removing pages, long religious texts) get a preview first: 👍 publishes it at once; otherwise it is published after 2 hours unless someone asks for changes.
New requests join the end of the queue.
Reply "move 3 to 1" = change the order (your own tasks; owners can move any task)
/queue remove 3 = remove one of your waiting tasks

4️⃣ Commands
/status = what the bot is doing now
/status 12 = the history of request 12
/queue = the current queue
/history = the last 10 published changes
/undo = undo the last published change
/revert 7 = undo request 7 · /revert 7.2 = undo only task 2 of request 7
/idea = suggest an improvement now
/report = a weekly summary of website statistics
/page jesus = statistics and ideas for one page
/check = check the site for broken links, missing videos and heavy pages
/mute = no reminders about your requests until tomorrow morning
/help = a short version of this message
Owners only: /pause and /resume publishing · /priority 12 = move request 12 to the front

📊 Website statistics (add 7, 28 or 90 for the number of days, e.g. /top 28)
/stats = visitors and views vs the previous period
/top = most viewed pages
/live = people on the site right now
/sources = where visitors come from
/where = visitors by country and city
/devices = mobile vs desktop
/downloads = most downloaded files
/trend = daily visitors chart
/compare = this week vs last week
/journey = how many visitors reach the key pages

5️⃣ What the bot's reactions mean
The bot checks the group every hour, day and night, and answers commands at the next check.
👀 Seen · ✍ Working on it · 💯 Done and live · 🤔 More information needed (please reply) · 🙏 Cannot be done (with the reason)

6️⃣ Reminders and check-ins
If a question or idea receives no answer, the bot sends a gentle reminder after 3 hours, at most two per message, between 8 AM and 9 PM Pacific. After publishing your change, if you have not responded within 3 hours, the bot sends one friendly note asking you to have a look. On quiet days, the bot may post one friendly check-in in the afternoon. A 👎 on any bot message, or a reply of "stop", pauses reminders and check-ins for 7 days.

7️⃣ If something goes wrong
The owners are alerted automatically if the bot stops working. If you sent a request and received no reply within two hours, please send it again.

Changes are published automatically; the bot asks only when a request is unclear.
📖 For Quran verses or hadith, please include the source (e.g. Quran 2:255, Sahih Muslim 26). The bot never invents or rewords religious text.
For questions not about the website, please use wisequest.org/contact
```
<!-- PINNED END -->

## Short help (sent for /help)

<!-- HELP START -->
```
📌 Quick help
/todo <request> = request a change (English or Arabic)
👍 on an idea = do it · 👎 = skip
/status · /queue · /history
/undo = undo the last change · /revert 7 = undo request 7
/idea · /report · /page <name> · /check
📊 /stats · /top · /live · /sources · /where · /devices · /downloads · /trend · /compare · /journey
/mute = no reminders until tomorrow morning
The full guide is in the pinned message.
```
<!-- HELP END -->
