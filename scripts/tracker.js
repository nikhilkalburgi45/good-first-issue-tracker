import fetch from "node-fetch";
import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";

// ─── Config ───────────────────────────────────────────────────────────────────

const GMAIL_USER = process.env.GMAIL_USER;
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN; // Added for higher rate limits

const SEEN_FILE = path.join(process.cwd(), "scripts", "seen.json");

// Your exact tech stack
const STACK_KEYWORDS = [
  "node", "express", "react", "next", "docker", "redis", 
  "sql", "postgres", "mongo", "python", "fastapi", "django",
  "javascript", "typescript", "backend", "fullstack"
];

// ─── Seen issue persistence ────────────────────────────────────────────────────

function loadSeen() {
  try {
    if (fs.existsSync(SEEN_FILE)) {
      const data = JSON.parse(fs.readFileSync(SEEN_FILE, "utf8"));
      return new Set(data.slice(-1000)); // Increased to 1000 to track more global issues
    }
  } catch {}
  return new Set();
}

function saveSeen(seen) {
  try {
    fs.writeFileSync(SEEN_FILE, JSON.stringify([...seen].slice(-1000)));
  } catch (e) {
    console.warn("Could not save seen.json:", e.message);
  }
}

// ─── GitHub Global Fetcher ─────────────────────────────────────────────────────

async function fetchIssues(seen) {
  const allIssues = [];
  
  // We look for issues created in the last 2 days to ensure we don't miss any 
  // between runs, but 'seen.json' will prevent duplicates.
  const dateLimit = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString().split('T')[0];
  
  // Query: label:"good first issue", open, created after dateLimit, in JS/TS/Python
  const query = encodeURIComponent(`label:"good first issue" state:open created:>${dateLimit} language:javascript language:typescript language:python`);
  const url = `https://api.github.com/search/issues?q=${query}&sort=created&order=desc&per_page=50`;

  try {
    const res = await fetch(url, {
      headers: {
        Accept: "application/vnd.github+json",
        "User-Agent": "good-first-issue-tracker",
        ...(GITHUB_TOKEN && { Authorization: `token ${GITHUB_TOKEN}` })
      },
    });

    if (!res.ok) {
      console.log(`Search failed: ${res.status}`);
      return [];
    }

    const data = await res.json();
    const items = data.items || [];

    for (const issue of items) {
      if (seen.has(issue.id)) continue;

      // Match against your stack
      const text = `${issue.title} ${issue.body || ""} ${issue.labels.map(l => l.name).join(" ")}`.toLowerCase();
      const relevant = STACK_KEYWORDS.some((kw) => text.includes(kw));
      if (!relevant) continue;

      // Extract repo name from URL (e.g., "facebook/react")
      const repoName = issue.html_url.split("/").slice(3, 5).join("/");

      allIssues.push({
        id: issue.id,
        title: issue.title,
        url: issue.html_url,
        repo: repoName,
        body: (issue.body || "").slice(0, 300),
        labels: issue.labels.map((l) => l.name),
        created: issue.created_at,
      });
    }
  } catch (e) {
    console.warn(`Error searching GitHub:`, e.message);
  }

  return allIssues;
}

// ─── Email builder ─────────────────────────────────────────────────────────────

function buildEmail(issues) {
  if (issues.length === 0) return null;

  const rows = issues
    .map(
      (issue, i) => `
    <tr style="border-bottom:1px solid #1a2a2a">
      <td style="padding:14px 10px;color:#00e5cc;font-weight:700;font-size:13px;vertical-align:top">${i + 1}</td>
      <td style="padding:14px 10px;vertical-align:top">
        <a href="${issue.url}" style="color:#e8f4f4;text-decoration:none;font-weight:600;font-size:14px;line-height:1.4">${issue.title}</a>
        <div style="margin-top:6px">
          <span style="background:#0a2020;color:#00e5cc;font-size:10px;padding:2px 7px;border-radius:3px;border:1px solid #1a3a3a;font-family:monospace">${issue.repo}</span>
        </div>
        <div style="margin-top:8px;color:#4a6a6a;font-size:12px;line-height:1.5">${issue.body.replace(/</g, "&lt;").replace(/>/g, "&gt;")}...</div>
      </td>
      <td style="padding:14px 10px;vertical-align:top;white-space:nowrap">
        <a href="${issue.url}" style="background:#00e5cc;color:#000;padding:6px 14px;border-radius:4px;text-decoration:none;font-size:12px;font-weight:700;font-family:monospace">View →</a>
      </td>
    </tr>`
    )
    .join("");

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#060c0c">
  <div style="max-width:700px;margin:32px auto;background:#080e0e;border:1px solid #1a2a2a;border-radius:8px;overflow:hidden;font-family:sans-serif">
    <div style="background:#0a1515;padding:24px 28px;border-bottom:1px solid #1a2a2a">
      <div style="color:#00e5cc;font-size:11px;letter-spacing:0.2em;margin-bottom:6px">// NEW OPPORTUNITIES FOUND</div>
      <div style="color:#e8f4f4;font-size:22px;font-weight:700">good<span style="color:#00e5cc">.</span>first<span style="color:#00e5cc">.</span>issue</div>
      <div style="color:#2a4a4a;font-size:12px;margin-top:6px">${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} IST</div>
    </div>
    <div style="padding:0 16px 16px">
      <table style="width:100%;border-collapse:collapse">
        <tbody>${rows}</tbody>
      </table>
    </div>
  </div>
</body>
</html>`;
}

// ─── Send email ────────────────────────────────────────────────────────────────

async function sendEmail(html, issueCount) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: GMAIL_USER, pass: GMAIL_APP_PASSWORD },
  });

  await transporter.sendMail({
    from: `"Issue Tracker 🟢" <${GMAIL_USER}>`,
    to: GMAIL_USER,
    subject: `🟢 ${issueCount} New Good First Issues — ${new Date().toLocaleDateString("en-IN")}`,
    html,
  });
  console.log(`✓ Email sent with ${issueCount} issues`);
}

// ─── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  if (!GMAIL_USER || !GMAIL_APP_PASSWORD) {
    console.error("Missing credentials");
    process.exit(1);
  }

  const seen = loadSeen();
  const issues = await fetchIssues(seen);

  if (issues.length === 0) {
    console.log("No brand new issues found for your stack.");
    return;
  }

  const html = buildEmail(issues);
  await sendEmail(html, issues.length);

  issues.forEach((i) => seen.add(i.id));
  saveSeen(seen);
  console.log("Done.");
}

main().catch(console.error);