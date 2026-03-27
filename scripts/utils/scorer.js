export function isBeginner(issue) {
  return issue.labels.some((l) =>
    [
      "good first issue",
      "good-first-issue",
      "beginner friendly",
      "easy",
    ].includes(l.name.toLowerCase()),
  );
}

export function isAdvanced(issue) {
  const bugLabels = [
    "bug",
    "confirmed-bug",
    "type: bug",
    "kind/bug",
    "status: bug",
  ];
  const hasBugLabel = issue.labels.some((l) =>
    bugLabels.includes(l.name.toLowerCase()),
  );
  const title = issue.title.toLowerCase();
  const hasBugKeyword = [
    "bug",
    "fix",
    "broken",
    "crash",
    "regression",
    "error",
    "fails",
    "incorrect",
    "wrong",
  ].some((k) => title.includes(k));
  const bodyLength = issue.body ? issue.body.length : 0;

  return (
    !isBeginner(issue) &&
    (hasBugLabel || hasBugKeyword) &&
    issue.comments >= 2 &&
    bodyLength > 200
  );
}

export function isIntermediate(issue) {
  const bodyLength = issue.body ? issue.body.length : 0;
  return (
    !isBeginner(issue) &&
    !isAdvanced(issue) &&
    issue.comments > 1 &&
    bodyLength > 150
  );
}

export function scoreIssue(issue, repo) {
  let score = 0;

  score += Math.log(repo.stars) * 10;
  score += repo.priority * 50;
  score += issue.comments * 5;
  score += issue.labels.length * 3;

  // Recency boost — issues newer than 48hrs get +100
  const ageHours = (Date.now() - new Date(issue.created_at)) / (1000 * 60 * 60);
  if (ageHours < 48) score += 100;
  else score -= ageHours * 0.05;

  return score;
}

export function isBlacklisted(issue, blacklist) {
  const title = issue.title.toLowerCase();
  return blacklist.some((word) => title.includes(word.toLowerCase()));
}
