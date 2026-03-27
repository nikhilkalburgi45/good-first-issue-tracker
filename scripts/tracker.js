import fs from "fs";
import path from "path";
import { fetchIssues } from "./utils/github.js";
import {
  isBeginner,
  isIntermediate,
  isAdvanced,
  scoreIssue,
  isBlacklisted,
} from "./utils/scorer.js";
import { sendTelegram, sendErrorAlert } from "./utils/telegram.js";
import { USER_PREFERENCES } from "./config.js";

const repoPath = path.join(process.cwd(), "scripts/repoList.json");
const seenPath = path.join(process.cwd(), "scripts/seen.json");

function loadRepos() {
  return JSON.parse(fs.readFileSync(repoPath));
}

function loadSeen() {
  if (!fs.existsSync(seenPath)) return new Set();
  return new Set(JSON.parse(fs.readFileSync(seenPath)));
}

function saveSeen(seen) {
  fs.writeFileSync(seenPath, JSON.stringify([...seen].slice(-2000)));
}

function filterRepos(repoList) {
  return repoList
    .filter((r) => r.stars >= USER_PREFERENCES.minStars)
    .filter((r) =>
      r.tags.some((tag) => USER_PREFERENCES.preferredTags.includes(tag)),
    )
    .sort((a, b) => b.priority - a.priority)
    .slice(0, USER_PREFERENCES.maxRepos);
}

async function main() {
  const repos = filterRepos(loadRepos());
  const seen = loadSeen();

  const beginners = [];
  const intermediates = [];
  const advanced = [];

  const MAX_AGE_HOURS = 168; // 7 days — change to 48 if you want strict 2 days

  for (const repo of repos) {
    try {
      const issues = await fetchIssues(repo.full_name);

      for (const issue of issues) {
        if (seen.has(issue.id)) continue;
        if (isBlacklisted(issue, USER_PREFERENCES.titleBlacklist)) continue;

        // Hard age filter — skip issues older than MAX_AGE_HOURS
        const ageHours =
          (Date.now() - new Date(issue.created_at)) / (1000 * 60 * 60);
        if (ageHours > MAX_AGE_HOURS) continue;

        const entry = {
          id: issue.id,
          title: issue.title,
          url: issue.html_url,
          repo: repo.full_name,
          comments: issue.comments,
          score: scoreIssue(issue, repo),
          createdAt: issue.created_at,
          ageHours: Math.round(ageHours),
        };

        if (isBeginner(issue)) beginners.push(entry);
        else if (isAdvanced(issue)) advanced.push(entry);
        else if (isIntermediate(issue)) intermediates.push(entry);
      }
    } catch (e) {
      console.warn("Error fetching:", repo.full_name, e.message);
    }
  }

  // Sort each bucket by score
  beginners.sort((a, b) => b.score - a.score);
  intermediates.sort((a, b) => b.score - a.score);
  advanced.sort((a, b) => b.score - a.score);

  const {
    beginner: bCount,
    intermediate: iCount,
    advanced: aCount,
  } = USER_PREFERENCES.issuesMix;

  const top = [
    ...beginners.slice(0, bCount),
    ...intermediates.slice(0, iCount),
    ...advanced.slice(0, aCount),
  ];

  console.log(
    `Found — Beginner: ${beginners.length}, Intermediate: ${intermediates.length}, Advanced: ${advanced.length}`,
  );
  console.log(`Sending: ${top.length} issues`);

  if (top.length > 0) {
    await sendTelegram(top);
    top.forEach((i) => seen.add(i.id));
    saveSeen(seen);
    console.log("Sent:", top.length);
  } else {
    console.log("No new issues found within last", MAX_AGE_HOURS, "hours");
  }
}

main().catch(async (err) => {
  console.error(err);
  await sendErrorAlert(err.message);
});
