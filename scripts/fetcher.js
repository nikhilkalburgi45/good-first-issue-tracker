import fetch from "node-fetch";
import { REPOS, LABEL_CATEGORIES, BATCH_SIZE } from "./config.js";

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

function getDateFilter() {
  const d = new Date(Date.now() - 24 * 60 * 60 * 1000);
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

function chunkArray(arr, size) {
  const chunks = [];
  for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size));
  return chunks;
}

export async function fetchAllIssues() {
  const dateFilter  = getDateFilter();
  const repoBatches = chunkArray(REPOS, BATCH_SIZE);
  const seen        = new Map(); // dedupe within fetch

  for (const [category, labels] of Object.entries(LABEL_CATEGORIES)) {
    for (const label of labels) {
      for (const batch of repoBatches) {
        const repoQuery = batch.map(r => `repo:${r.full_name}`).join(" ");
        const query = `is:issue is:open label:"${label}" ${repoQuery} updated:>${dateFilter}`;

        try {
          const issues = await searchGitHub(query);

          for (const issue of issues) {
            if (seen.has(issue.id)) continue;

            const repoFullName = issue.repository_url.replace(
              "https://api.github.com/repos/", ""
            );
            const repoConfig = REPOS.find(r => r.full_name === repoFullName);

            seen.set(issue.id, {
              ...issue,
              category,
              repoFullName,
              repoWeight: repoConfig?.weight || 1.0,
            });
          }

          // Respect GitHub Search rate limit (30 req/min)
          await new Promise(r => setTimeout(r, 2100));

        } catch (e) {
          console.warn(`Search failed [${category}/${label}]:`, e.message);
        }
      }
    }
  }

  console.log(`Fetched ${seen.size} unique issues from Search API`);
  return [...seen.values()];
}