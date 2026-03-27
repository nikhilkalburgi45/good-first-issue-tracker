// scripts/utils/github.js

import fetch from "node-fetch";

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

export async function fetchIssues(repoFullName) {
  const url = `https://api.github.com/repos/${repoFullName}/issues?state=open&per_page=20`;

  const res = await fetch(url, {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `token ${GITHUB_TOKEN}`,
    },
  });

  const data = await res.json();

  // remove PRs
  return data.filter((issue) => !issue.pull_request);
}
