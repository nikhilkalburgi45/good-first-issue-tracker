import fetch from "node-fetch";
import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";

// ─── Config ───────────────────────────────────────────────────────────────────

const GMAIL_USER = process.env.GMAIL_USER;
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN; 

const SEEN_FILE = path.join(process.cwd(), "scripts", "seen.json");

// Your Exact Tech Stack
const STACK_KEYWORDS = [
  "node", "express", "react", "next", "docker", "redis", 
  "sql", "postgres", "mongo", "python", "fastapi", "django",
  "javascript", "typescript", "backend", "fullstack", "mongodb"
];

// ─── Seen issue persistence ────────────────────────────────────────────────────

function loadSeen() {
  try {
    if (fs.existsSync(SEEN_FILE)) {
      const data = JSON.parse(fs.readFileSync(SEEN_FILE, "utf8"));
      return new Set(data.slice(-1000)); 
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
  
  // Look for issues created in the last 48 hours
  const dateLimit = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString().split('T')[0];
  
  // Search Query: label "good first issue", open, created recently, in your languages
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

      const text = `${issue.title} ${issue.body || ""} ${issue.labels.map(l => l.name).join(" ")}`.toLowerCase();
      const relevant = STACK_KEYWORDS.some((kw) => text.includes(kw));
      
      if (relevant) {
        const repoName = issue.html_url.split("/").slice(3, 5).join("/");
        allIssues.push({
          id: issue.id,
          title: issue.title,
          url: issue.html_url,
          repo: repoName,
          body: (issue.body || "").slice(0, 300),
          labels: issue.labels.map((l) => l.name),
        });
      }
    }
  } catch (e) {
    console.warn(`Error searching GitHub:`, e.message);
  }

  return allIssues;
}

// ─── Email builder ─────────────────────────────────────────────────────────────

function buildEmail(issues) {
  const rows = issues.map((issue, i) => `
    <tr style="border-bottom:1px solid #1a2a2a">
      <td style="padding:14px 10px;color:#00e5cc;font-weight:700;font-size:13px;vertical-align:top">${i + 1}</td>
      <td style="padding:14px 10px;vertical-align:top">
        <a href="${issue.url}" style="color:#e8f4f4;text-decoration:none;font-weight:600;font-size:14px">${issue.title}</a>
        <div style="margin-top:4px"><span style="color:#00e5cc;font-size:11px;font-family:monospace">${issue.repo}</span></div>
        <div style="margin-top:8px;color:#4a6a6a;font-size:12px">${issue.body.replace(/</g, "&lt;").slice(0, 200)}...</div>
      </td>
      <td style="padding:14px 10px;vertical-align:top">
        <a href="${issue.url}" style="background:#00e5cc;color:#000;padding:5px 10px;border-radius:4px;text-decoration:none;font-size:11px;font-weight:bold">View</a>
      </td>
    </tr>`).join("");

  return `
    <html>
      <body style="background:#060c0c;font-family:sans-serif;padding:20px;">
        <div style="max-width:600px;margin:auto;background:#080e0e;border:1px solid #1a2a2a;border-radius:8px;padding:20px;">
          <h2 style="color:#e8f4f4;">New <span style="color:#00e5cc;">Good First Issues</span></h2>
          <table style="width:100%;border-collapse:collapse;">${rows}</table>
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
    from: `"Issue Tracker" <${GMAIL_USER}>`,
    to: GMAIL_USER,
    subject: `🟢 ${issueCount} New Issues Found — ${new Date().toLocaleDateString("en-IN")}`,
    html,
  });
}

// ─── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  if (!GMAIL_USER || !GMAIL_APP_PASSWORD) {
    console.error("Missing credentials");
    process.exit(1);
  }

  const seen = loadSeen();
  const issues = await fetchIssues(seen);

  if (issues.length > 0) {
    const html = buildEmail(issues);
    await sendEmail(html, issues.length);
    issues.forEach(i => seen.add(i.id));
    saveSeen(seen);
    console.log(`Success: Sent ${issues.length} issues.`);
  } else {
    console.log("No new matching issues found.");
  }
}

main().catch(console.error);