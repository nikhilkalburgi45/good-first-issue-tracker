// scripts/tracker.js

import fs from "fs";
import path from "path";
import { fetchIssues } from "./utils/github.js";
import { isBeginner, isIntermediate, scoreIssue } from "./utils/scorer.js";
import { sendTelegram } from "./utils/telegram.js";
import { USER_PREFERENCES } from "./config.js";

const repoPath = path.join(process.cwd(), "scripts/repoList.json");
const seenPath = path.join(process.cwd(), "scripts/seen.json");

// ─── Loaders ─────────────────────

function loadRepos() {
  return JSON.parse(fs.readFileSync(repoPath));
}

function loadSeen() {
  if (!fs.existsSync(seenPath)) return new Set();
  return new Set(JSON.parse(fs.readFileSync(seenPath)));
}

function saveSeen(seen) {
  fs.writeFileSync(seenPath, JSON.stringify([...seen].slice(-1000)));
}

// ─── Repo Filter ─────────────────

function filterRepos(repoList) {
  return repoList
    .filter(r => r.stars >= USER_PREFERENCES.minStars)
    .filter(r =>
      USER_PREFERENCES.difficulty === "both"
        ? true
        : r.difficulty === USER_PREFERENCES.difficulty
    )
    .filter(r =>
      r.tags.some(tag =>
        USER_PREFERENCES.preferredTags.includes(tag)
      )
    )
    .sort((a, b) => b.priority - a.priority)
    .slice(0, USER_PREFERENCES.maxRepos);
}

// ─── Main ───────────────────────

async function main() {
  const repos = filterRepos(loadRepos());
  const seen = loadSeen();

  let collected = [];

  for (const repo of repos) {
    try {
      const issues = await fetchIssues(repo.full_name);

      for (const issue of issues) {
        if (seen.has(issue.id)) continue;

        const beginner = isBeginner(issue);
        const intermediate = isIntermediate(issue);

        if (!beginner && !intermediate) continue;

        collected.push({
          id: issue.id,
          title: issue.title,
          url: issue.html_url,
          repo: repo.full_name,
          comments: issue.comments,
          score: scoreIssue(issue, repo)
        });
      }

    } catch (e) {
      console.warn("Error:", repo.full_name);
    }
  }

  // Sort + pick top
  collected.sort((a, b) => b.score - a.score);

  const top = collected.slice(0, USER_PREFERENCES.topIssuesLimit);

  if (top.length > 0) {
    await sendTelegram(top);

    top.forEach(i => seen.add(i.id));
    saveSeen(seen);

    console.log("Sent:", top.length);
  } else {
    console.log("No issues found");
  }
}

main().catch(console.error);