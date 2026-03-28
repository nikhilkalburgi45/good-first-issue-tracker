import { getPriorityBucket } from "./scorer.js";

const PRIORITY_EMOJI  = { high: "🔴", medium: "🟡", low: "🟢" };
const CATEGORY_LABEL  = {
  beginner:     "🟢 Beginner",
  intermediate: "🟡 Intermediate",
  advanced:     "🔴 Advanced",
};

export function formatIssue(issue) {
  const priority    = getPriorityBucket(issue.finalScore);
  const updatedHours = Math.round((Date.now() - new Date(issue.updated_at)) / (1000 * 60 * 60));
  const ageLabel    = updatedHours < 1 ? "just now"
    : updatedHours < 24 ? `${updatedHours}h ago`
    : `${Math.round(updatedHours / 24)}d ago`;

  const topLabels = issue.labels.slice(0, 3).map(l => `#${l.name}`).join(" ");
  const category  = CATEGORY_LABEL[issue.category] || "🟡 Intermediate";

  const text =
    `${PRIORITY_EMOJI[priority]} *${esc(issue.title)}*\n\n` +
    `📦 \`${issue.repoFullName}\`\n` +
    `${category}  \\|  ⭐ Score: ${issue.finalScore}/10\n` +
    `💬 ${issue.comments} comments  🕐 ${ageLabel}\n` +
    `🏷 ${topLabels || "no labels"}`;

  return { text, url: issue.html_url };
}

// Escape MarkdownV2 special chars
function esc(text) {
  return text.replace(/[_*[\]()~`>#+\-=|{}.!]/g, "\\$&");
}