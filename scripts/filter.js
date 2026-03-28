import { IGNORE_LABELS, TITLE_BLACKLIST, MAX_AGE_HOURS } from "./config.js";

export function shouldInclude(issue) {
  if (issue.pull_request) return false;

  // Age filter on updated_at (not created_at)
  const ageHours = (Date.now() - new Date(issue.updated_at)) / (1000 * 60 * 60);
  if (ageHours > MAX_AGE_HOURS) return false;

  // Stale / invalid labels
  const labelNames = issue.labels.map(l => l.name.toLowerCase());
  if (labelNames.some(l => IGNORE_LABELS.includes(l))) return false;

  // Title blacklist
  const title = issue.title.toLowerCase();
  if (TITLE_BLACKLIST.some(w => title.includes(w.toLowerCase()))) return false;

  // Must have a meaningful body
  if (!issue.body || issue.body.trim().length < 50) return false;

  return true;
}