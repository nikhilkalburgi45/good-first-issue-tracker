// scripts/utils/scorer.js

export function isBeginner(issue) {
  return issue.labels.some((l) =>
    ["good first issue", "help wanted"].includes(
      l.name.toLowerCase()
    )
  );
}

export function isIntermediate(issue) {
  const bodyLength = issue.body ? issue.body.length : 0;

  return (
    !isBeginner(issue) &&
    issue.comments > 2 &&
    bodyLength > 200
  );
}

export function scoreIssue(issue, repo) {
  let score = 0;

  score += Math.log(repo.stars) * 10;
  score += repo.priority * 50;
  score += issue.comments * 5;
  score += issue.labels.length * 3;

  const age = Date.now() - new Date(issue.created_at);
  score -= age * 0.000001;

  return score;
}