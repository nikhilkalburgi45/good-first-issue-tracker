import fetch from "node-fetch";

const TOKEN   = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

async function send(body) {
  const res = await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(body),
  });
  const data = await res.json();
  if (!data.ok) console.error("Telegram error:", data.description);
}

export async function sendIssue(formatted) {
  if (!TOKEN || !CHAT_ID) { console.error("Missing Telegram credentials"); return; }

  await send({
    chat_id:      CHAT_ID,
    text:         formatted.text,
    parse_mode:   "MarkdownV2",
    reply_markup: { inline_keyboard: [[{ text: "🔗 Open Issue", url: formatted.url }]] },
  });

  await new Promise(r => setTimeout(r, 300));
}

export async function sendHeader(text) {
  if (!TOKEN || !CHAT_ID) return;
  await send({ chat_id: CHAT_ID, text, parse_mode: "MarkdownV2" });
}

export async function sendErrorAlert(message) {
  if (!TOKEN || !CHAT_ID) return;
  await send({
    chat_id:    CHAT_ID,
    text:       `⚠️ *Tracker Error*\n\`${message}\``,
    parse_mode: "MarkdownV2",
  });
}