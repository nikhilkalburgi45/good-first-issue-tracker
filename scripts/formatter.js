import { getPriorityBucket } from "./scorer.js";

const PRIORITY_EMOJI = { high: "🔴", medium: "🟡", low: "🟢" };
const CATEGORY_LABEL = {
  beginner:     "🟢 Beginner",
  intermediate: "🟡 Intermediate",
  advanced:     "🔴 Advanced",
};

function esc(text) {
  return String(text).replace(/[_*[\]()~`>#+\-=|{}.!]/g, "\\$&");
}

export function formatIssue(issue) {
  const priority    = getPriorityBucket(issue.finalScore);
  const updatedHours = Math.round((Date.now() - new Date(issue.updated_at)) / (1000 * 60 * 60));
  const ageLabel    = updatedHours < 1 ? "just now"
    : updatedHours < 24 ? `${updatedHours}h ago`
    : `${Math.round(updatedHours / 24)}d ago`;

  const topLabels = issue.labels.slice(0, 3).map(l => `\#${esc(l.name)}`).join(" ");
  const category  = CATEGORY_LABEL[issue.category] || "🟡 Intermediate";

  const text =
    `${PRIORITY_EMOJI[priority]} *${esc(issue.title)}*\n\n` +
    `📦 \`${esc(issue.repoFullName)}\`\n` +
    `${esc(category)}  \\|  ⭐ Score: ${esc(issue.finalScore)}/10\n` +
    `💬 ${esc(issue.comments)} comments  🕐 ${esc(ageLabel)}\n` +
    `🏷 ${topLabels || "no labels"}`;

  return { text, url: issue.html_url };
}