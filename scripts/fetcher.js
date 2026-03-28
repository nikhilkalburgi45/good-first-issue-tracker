import fetch from "node-fetch";
import { REPOS } from "./config.js";

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

function getDateFilter() {
  const d = new Date(Date.now() - 72 * 60 * 60 * 1000); // 72h window
  return d.toISOString().split("T")[0];
}

async function searchGitHub(query) {
  const url = `https://api.github.com/search/issues?q=${encodeURIComponent(query)}&sort=updated&order=desc&per_page=30`;

  const res = await fetch(url, {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${GITHUB_TOKEN}`,
    },
  });

  if (!res.ok) {
    const err = await res.json();
    console.warn("GitHub Search error:", err.message);
    return [];
  }

  const data = await res.json();
  return data.items || [];
}

// Wait helper
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

export async function fetchAllIssues() {
  const dateFilter = getDateFilter();
  const seen = new Map();

  // 3 queries total — one per category
  // All repos combined in one query per category
  const repoQuery = REPOS.map((r) => `repo:${r.full_name}`).join(" ");

  const queries = [
    {
      category: "beginner",
      query: `is:issue is:open label:"good first issue" ${repoQuery} updated:>${dateFilter}`,
    },
    {
      category: "intermediate",
      query: `is:issue is:open label:"bug" ${repoQuery} updated:>${dateFilter}`,
    },
    {
      category: "advanced",
      query: `is:issue is:open label:"performance" ${repoQuery} updated:>${dateFilter}`,
    },
  ];

  for (const { category, query } of queries) {
    try {
      const issues = await searchGitHub(query);
      console.log(`[${category}] Found: ${issues.length}`);

      for (const issue of issues) {
        if (seen.has(issue.id)) continue;

        const repoFullName = issue.repository_url.replace(
          "https://api.github.com/repos/",
          "",
        );
        const repoConfig = REPOS.find((r) => r.full_name === repoFullName);

        seen.set(issue.id, {
          ...issue,
          category,
          repoFullName,
          repoWeight: repoConfig?.weight || 1.0,
        });
      }

      // 3 second gap between queries — well within 30 req/min limit
      await wait(3000);
    } catch (e) {
      console.warn(`Search failed [${category}]:`, e.message);
    }
  }

  console.log(`Fetched ${seen.size} unique issues from Search API`);
  return [...seen.values()];
}
