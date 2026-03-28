import { IGNORE_LABELS } from "./config.js";

export function scoreIssue(issue) {
  let score = 0;
  const labelNames = issue.labels.map(l => l.name.toLowerCase());

  // 1. Label signals
  if (labelNames.includes("good first issue"))                     score += 1.0;
  if (labelNames.some(l => ["bug", "confirmed-bug"].includes(l))) score += 2.0;
  if (labelNames.some(l => ["performance", "optimization"].includes(l))) score += 3.0;
  if (labelNames.some(l => ["enhancement", "feature"].includes(l))) score += 1.5;
  if (labelNames.includes("help wanted"))                          score += 1.0;
  if (labelNames.includes("bounty"))                               score += 2.0;
  if (labelNames.some(l => IGNORE_LABELS.includes(l)))            score -= 5.0;

  // 2. Body quality
  const body = issue.body || "";
  if (body.length > 300)                                           score += 0.5;
  if (body.length > 600)                                           score += 0.5;
  if (body.toLowerCase().includes("steps to reproduce"))           score += 0.5;
  if (body.toLowerCase().includes("expected behavior"))            score += 0.5;
  if (body.includes("```"))                                        score += 0.5;

  // 3. Activity signals
  if (issue.comments >= 2)  score += 1.0;
  if (issue.comments >= 5)  score += 1.0;
  if (!issue.assignee)      score += 1.0; // not yet taken

  // 4. Recency of last update
  const updatedHours = (Date.now() - new Date(issue.updated_at)) / (1000 * 60 * 60);
  if (updatedHours < 6)       score += 2.0;
  else if (updatedHours < 12) score += 1.5;
  else if (updatedHours < 24) score += 1.0;

  // 5. Apply repo weight
  score *= issue.repoWeight || 1.0;

  return Math.min(10, Math.round(score * 10) / 10);
}

export function getPriorityBucket(score) {
  if (score >= 7) return "high";
  if (score >= 4) return "medium";
  return "low";
}