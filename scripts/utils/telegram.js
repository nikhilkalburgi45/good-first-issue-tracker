import fetch from "node-fetch";

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

const difficultyLabel = (issue) => {
  // re-derive from score heuristic — just tag passed in
  return issue.level === "beginner"
    ? "🟢 Beginner"
    : issue.level === "advanced"
      ? "🔴 Advanced"
      : "🟡 Intermediate";
};

export async function sendTelegram(issues) {
  if (!TOKEN || !CHAT_ID) {
    console.error("Missing Telegram credentials");
    return;
  }

  for (const issue of issues) {
    const ageHours = Math.round(
      (Date.now() - new Date(issue.createdAt)) / (1000 * 60 * 60),
    );
    const ageLabel =
      ageHours < 48
        ? `🆕 ${ageHours}h ago`
        : `🕐 ${Math.round(ageHours / 24)}d ago`;

    const text =
      `*${issue.title}*\n\n` +
      `📦 \`${issue.repo}\`\n` +
      `💬 Comments: ${issue.comments}  ${ageLabel}`;

    const body = {
      chat_id: CHAT_ID,
      text,
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [[{ text: "🔗 Open Issue", url: issue.url }]],
      },
    };

    const res = await fetch(
      `https://api.telegram.org/bot${TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      },
    );

    const data = await res.json();
    if (!data.ok) console.error("Telegram error:", data.description);

    // Small delay to avoid Telegram rate limiting
    await new Promise((r) => setTimeout(r, 300));
  }
}

export async function sendErrorAlert(message) {
  if (!TOKEN || !CHAT_ID) return;

  await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: CHAT_ID,
      text: `⚠️ *Tracker Error*\n\`${message}\``,
      parse_mode: "Markdown",
    }),
  });
}
