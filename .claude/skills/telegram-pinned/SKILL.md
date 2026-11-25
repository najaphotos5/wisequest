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
Type /todo followed by your request in the same message.
Example: /todo Add a page about Ramadan with fasting times for Sacramento
(Tapping /todo in the menu sends it empty, so please type your request after it.)
• Which page? Paste the link, e.g. wisequest.org/learn/quran
• What should change, and why?
• A screenshot helps: attach it and put /todo in the caption.
You may ask for several things in one message. The bot will divide them into tasks.

2️⃣ Daily ideas and the weekly report
Every morning (8 AM Pacific) the bot suggests one improvement. On Fridays it posts a weekly report with one suggested action.
👍 or reply "approve" = please do it
👎 or reply "no" = skip it
To adjust an idea, reply with the change, e.g. "yes, but make the buttons green".

3️⃣ The queue: one task per hour
Large or multi-part requests are divided into small tasks. The bot completes one task each hour, so that every change is done carefully and checked on computer and phone before it is published.
New requests join the end of the queue, and the bot replies with the current order.
/queue = show the current queue
Reply "move 3 to 1" or "do task 3 first" = change the order (your own tasks; owners can move any task)
/queue remove 3 = remove one of your waiting tasks

4️⃣ What the bot's reactions mean
The bot checks the group every hour, day and night.
👀 Seen
✍ Working on it
🎉 Done and live, with a reply listing the changes and a link
🤔 More information needed: please reply to the bot's question
🙏 Cannot be done (the reply explains why)

5️⃣ Undo a change
/revert 7 = undo request 7 (all of its tasks)
/revert 7.2 = undo only task 2 of request 7
It is undone within the hour.

6️⃣ Reminders
If a question or idea receives no answer, the bot sends a gentle reminder after 3 hours, at most two per message, between 8 AM and 9 PM Pacific. On quiet days, the bot may post one friendly check-in in the afternoon. A 👎 on any bot message, or a reply of "stop", pauses reminders and check-ins for 7 days.

Changes are published automatically, without an approval step. The bot asks only when a request is unclear.

📖 For Quran verses or hadith, please include the source (e.g. Quran 2:255, Sahih Muslim 26). The bot never invents or rewords religious text.

For questions not about the website, please use wisequest.org/contact
```
<!-- PINNED END -->
