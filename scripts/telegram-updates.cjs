/**
 * The ONE way the hourly assistant reads Telegram (bot-operations skill). Same request every run, cross-checked and logged.
 *
 *   node scripts/telegram-updates.cjs fetch <offset>   → prints JSON { count, firstId, lastId, nextOffset, pendingBefore, updates }
 *   node scripts/telegram-updates.cjs ack <nextOffset> → tells Telegram the updates before <nextOffset> were processed
 *
 * fetch never confirms anything (safe to repeat). It asks for messages AND reactions (allowed_updates is always the same),
 * compares the result with Telegram's own pending count (getWebhookInfo) and retries up to 3 times, 5 s apart,
 * when Telegram says updates are waiting but none came back. A summary line goes to stderr for the run log.
 * Token: env TELEGRAM_BOT_TOKEN (never printed).
 */
const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT = -1004488348585;
const ALLOWED = ["message", "message_reaction"];
if (!TOKEN) {
  console.error("TELEGRAM_BOT_TOKEN is not set");
  process.exit(1);
}

async function call(method, body) {
  const r = await fetch(`https://api.telegram.org/bot${TOKEN}/${method}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body ?? {}) });
  const j = await r.json();
  if (!j.ok) throw new Error(`${method}: ${j.description}`);
  return j.result;
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const [cmd, arg] = process.argv.slice(2);
  const offset = Number(arg);
  if (!["fetch", "ack"].includes(cmd) || !Number.isFinite(offset)) {
    console.error("Usage: node scripts/telegram-updates.cjs fetch <offset> | ack <nextOffset>");
    process.exit(1);
  }
  if (cmd === "ack") {
    await call("getUpdates", { offset, timeout: 0, limit: 1, allowed_updates: ALLOWED });
    console.error(`telegram-updates: acknowledged everything before ${offset}`);
    return;
  }
  let updates = [];
  let pending = 0;
  for (let attempt = 1; attempt <= 4; attempt++) {
    const info = await call("getWebhookInfo");
    if (info.url) throw new Error(`a webhook is set (${info.url}); getUpdates cannot work while it is`);
    pending = info.pending_update_count ?? 0;
    updates = await call("getUpdates", { offset, timeout: 0, limit: 100, allowed_updates: ALLOWED });
    if (updates.length || !pending || attempt === 4) break;
    console.error(`telegram-updates: Telegram reports ${pending} pending but returned none (attempt ${attempt}); retrying in 5 s`);
    await sleep(5000);
  }
  const inChat = updates.filter((u) => (u.message?.chat?.id ?? u.message_reaction?.chat?.id) === CHAT);
  const ids = updates.map((u) => u.update_id);
  const out = {
    count: updates.length,
    countInGroup: inChat.length,
    firstId: ids.length ? Math.min(...ids) : null,
    lastId: ids.length ? Math.max(...ids) : null,
    nextOffset: ids.length ? Math.max(...ids) + 1 : offset,
    pendingBefore: pending,
    updates,
  };
  const ages = updates.map((u) => Math.round(Date.now() / 1000 - (u.message?.date ?? u.message_reaction?.date ?? Date.now() / 1000)));
  console.error(
    `telegram-updates: offset ${offset} → ${out.count} update(s)${out.count ? ` (ids ${out.firstId}–${out.lastId}, oldest sent ${Math.max(...ages)} s ago)` : ""}; Telegram pending count was ${pending}`,
  );
  console.log(JSON.stringify(out));
}

main().catch((e) => {
  console.error(`telegram-updates: ${e.message}`);
  process.exit(1);
});
