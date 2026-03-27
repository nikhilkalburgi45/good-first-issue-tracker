// scripts/utils/telegram.js

import fetch from "node-fetch";

const TOKEN = process.env.TELEGRAM_BOT_TOKEN; 
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

export async function sendTelegram(issues) {
  if (!TOKEN || !CHAT_ID) {
    console.error("Missing Telegram credentials");
    return;
  }

  const message = issues.map((i, idx) =>
    `🔥 *${idx + 1}. ${i.title}*\n` +
    `📦 ${i.repo}\n` +
    `💬 Comments: ${i.comments}\n` +
    `🔗 ${i.url}`
  ).join("\n\n");

  const url = `https://api.telegram.org/bot${TOKEN}/sendMessage`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      chat_id: CHAT_ID,
      text: message,
      parse_mode: "Markdown"
    })
  });

  const data = await res.json();
  console.log("Telegram:", data);
}