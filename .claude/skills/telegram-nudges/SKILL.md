---
name: telegram-nudges
description: When and how the WiseQuest bot sends unprompted messages in the Telegram group. (A) gentle reminders when a question or idea gets no answer for 3 hours (at most two per message). (A2) one friendly "did you see it?" follow-up 3 hours after a change is published, if the requester has not responded. (B) one playful Arabic check-in in the afternoon on quiet days. Includes dislike/pause rules. Used every run by the hourly assistant (its Step 4).
---

# Nudges: reminders and the quiet-day check-in

The hourly assistant runs this **every run**, even when nothing else happened. All wording follows `.claude/skills/telegram-voice/SKILL.md`: an Arabic opening and closing, and formal English for all information.

State lives in `state.json` on branch `claude/telegram-state`, as ids, times and counts only. Never store names or message text.

## Shared: when is "3 hours" reached? (round down)

The bot only runs once an hour, so "after 3 hours" means **the run closest to the 3-hour mark, rounding down**: a 3-hour timer is due when **at least 2 h 30 min** have passed (`now − start ≥ 9000 seconds`).

For example, a message sent at 3:11 PM is due at the run around 5:50 PM, not the one around 6:50 PM. The same applies to every 3-hour timer in this file: the first and second reminders, and the follow-up after publishing.

## Shared: dislikes pause all nudges

A **dislike** is any of these:
- a reaction 👎 💩 🤮 😡 🤬 😢 🥱 🙄 on **any** bot message (an idea, reply, report, reminder or check-in)
- a reply rejecting an idea ("no", "skip", "لا")
- a message asking the bot to stop or not to remind ("stop", "no reminders", "كفى" …)

On a dislike:
- close that message's reminder entry (if it has one)
- set `state.reminders_paused_until` = now + 7 days (unix seconds)

While paused, send **no reminders and no check-ins**.

## A. Reminders (no answer after 3 hours)

`state.awaiting` = `[{key, message_id, sent_at, request_id?, reminders?, reminded_at?, closed?}]`
- `sent_at` and `reminded_at` are unix seconds, taken from Telegram's `date` field.
- `key` is `"r<request_id>"` or `"m<message_id>"`.

**Add an entry** whenever a bot message is waiting for people's answer:
- **A needs-info question you send:** key `"r<id>"`, using the newest question message. `sent_at` is the sendMessage response's `date`. If the request already has an entry, update `message_id`/`sent_at`, reset `reminders` to 0 and clear `reminded_at`.
- **An idea message** in `suggestions.json` or `reports.json` (with an action) that has no entry yet:
  - `sent_at` is its `sent_at` if stored, otherwise 16:00 UTC on its date.
  - Ideas that share a `request_id` share the key `"r<request_id>"`, using the newest of those messages.
  - Skip ideas older than 3 days.

**Close an entry** (`closed: true`) when any of these happens:
- anyone (not a bot) replies to it, reacts to it, or answers the request in any other way
- the request leaves needs-info/answered
- its idea is accepted or rejected

**Send** a reminder when all of these hold:
- reminders are not paused
- the person it waits on has not used `/mute` (their key in `state.muted` is missing or expired; see telegram-commands). Ideas waiting on the whole group are not affected by one person's mute.
- the local time is between 8:00 and 21:00 America/Los_Angeles
- the entry is open and has fewer than 2 reminders
- the 3-hour timer since the later of `sent_at` and `reminded_at` is due (rounded down, see above)

Then send **one** gentle reminder as a reply to its `message_id`, add 1 to `reminders` and set `reminded_at`.
- At most **two** reminders per message, and the second is due 3 hours after the first, rounded down.
- At most 2 reminders per run.
- Record the reminder's id in the request's `bot_message_ids`, if there is a request.

**Reminder text:** formal English, short, kind and never pushy. The Arabic opening may sometimes be playful (telegram-voice section 5), e.g. "صحّيت الموضوع من النوم 😄"; never in the second, final reminder.
- Use a warm Arabic opening and closing, chosen fresh from the telegram-voice bank.
- Add one line saying what is waiting, e.g. "This is a gentle reminder about the idea above: a 👍 is enough to proceed, or 👎 to skip." or "When convenient, please reply to the questions above (or react 👍 to the proposal), and I will take care of the rest."
- End with "Please take your time."
- The second reminder uses different phrases and politely says it is the last one, e.g. "This is my final reminder about this; I will leave it with you."
- Use the singular when the message waits on one person (the requester) and the plural for the group.
- Never mention the 3 hours.

## A2. After a change is published: "did you see it?" follow-up

When a request's task is published (the "done" reply), the bot waits for the **requester** to react to it. If they don't respond within 3 hours, the bot sends **one** friendly follow-up asking them to check the result.

- **Add** `{key: "d<id>.<n>", kind: "done", message_id: <the done reply>, request_id, sent_at}` to `state.awaiting` when posting a done reply.
  - Skip it for ideas nobody personally asked for, i.e. daily or weekly ideas accepted by a 👍 from someone other than the requester. In that case the person who accepted counts as the requester.
  - Skip it for reverts.
- **Close** it when the requester or an owner replies to it or reacts to it (any reaction), sends `/revert`/`/undo` for it, or asks for a further change.
- **Send** it when all of these hold:
  - nudges are not paused
  - the requester hasn't used `/mute`
  - the time is 8:00–21:00 America/Los_Angeles
  - the 3-hour timer since `sent_at` is due (rounded down, see above)
  
  Only **one** follow-up per published task (never a second one). It counts toward the "at most 2 reminders per run" limit.
- **Text:** a reply to the done message, addressed to the requester (singular, or plural for the group).
  - Start with an Arabic line with light humour (telegram-voice section 5). This is one of the moments where humour is expected, e.g.:
    - شفت الشغل ولا لسا؟ 😄
    - الموقع عم يستنى رأيك 😅
    - خلصناها وقاعدين نستنى التصفيق 👏😄
    - طبخنا الطبخة، دوقها وقلنا رأيك 😋
    - عم نطّلع عالتلفون كل شوي ناطرين ردك 😅
  - Then formal English: "Please take a look at the change when you have a moment: <live link>. If anything should be adjusted, simply reply here."
  - End with an Arabic closing.
  - **No humour** if the change involved religious or sensitive content (telegram-voice section 5, "Never joke…"). Use a warm, serious Arabic opening instead, e.g. أحسن الله إليك.

## B. Quiet-day check-in (once a day, ~3 PM Pacific)

On a day when people haven't engaged much, the bot posts **one** playful check-in to the **whole group** (plural forms) and offers help.

**Track activity:**
- `state.activity` = `{date: "<YYYY-MM-DD in America/Los_Angeles>", human_events: n}`.
- Every run, add the number of non-bot group messages and reactions from that run's updates.
- When the Pacific date changes, reset it to `{date: today, human_events: 0}`.

**Send** on the first run at or after **15:00 America/Los_Angeles** (or later the same day, up to 21:00, if that run was missed), when all of these hold:
- `state.activity.human_events` today is **≤ 1**
- `state.last_checkin_date` is not today
- nudges are not paused (`reminders_paused_until`)
- the bot sent fewer than 2 reminders today
- nobody was frustrated or upset in the group today
- the "ignored" rule below doesn't apply

Then send one message (not a reply), set `state.last_checkin_date` = today and append `{date, message_id}` to `state.checkins` (keep the last 14).

**Message:** one playful Arabic line, then formal English, then an Arabic closing:
```
شبيك لبيك، كلود بين إيديكم 🧞
It has been a quiet day. Is there anything I can help with? You can send /todo with a request at any time, or reply here with an idea.
دمتم في حفظ الله
```

**Arabic lines** (plural; rotate, never one that is in `recent_phrases` or was used in the last 5 check-ins):
- شبيك لبيك، كلود بين إيديكم 🧞
- وينكم يا جماعة؟ اشتقنالكم 😄
- الهدوء هاد بخوّف 😅
- قاعد لحالي هون من الصبح 🥲
- طول النهار ناطركم 😏
- ما حدا محتاج شي؟ ولا حتى تعديل فاصلة؟ 😏
- يا جماعة أنا موجود ترى 😄
- الموقع عم يسأل عنكم 😅
- صرت أحكي مع حالي 🥲
- خلصت شغلي وقاعد بتفرج على السقف 😅
- حدا يعطيني شغلة قبل ما أنام 😴
- لا تخلوني عاطل عن العمل 😏

Vary the English line too, always formally. For example:
- "If there is anything you would like changed on the website, please let me know."
- "I am available if anyone has a request or an idea."
- "Is there anything on the website you would like me to improve today?"

**Rules:**
- **Once a day at most.** Never a second check-in on the same Pacific date, whatever happens.
- **If ignored:** if the last 3 check-ins got no reaction and no reply, skip the next 3 days. It should never become noise.
- **Humour:** the playful line is always allowed in a check-in, even though nobody asked for a change. All of telegram-voice section 5's other limits still apply: Arabic only, never والله or any religious phrase in the joke, never on a day someone was upset.
- **Replies:** a reply or reaction to the check-in counts as engagement, and a 👎 is a dislike (see above). A request in reply is handled like any `/todo`.

## Lessons

<!-- Newest first. -->
- 2026-11-25: Owner asked for one playful check-in on quiet days, around 3 PM, to the whole group.
