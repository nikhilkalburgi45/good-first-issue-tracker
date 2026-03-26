import fetch from "node-fetch";
import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";

// ─── Config ───────────────────────────────────────────────────────────────────

const GMAIL_USER = process.env.GMAIL_USER;
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD;

const SEEN_FILE = path.join(process.cwd(), "scripts", "seen.json");

const REPOS = [
  "nodejs/node",
  "expressjs/express",
  "vercel/next.js",
  "facebook/react",
  "docker/compose",
  "redis/redis",
  "Automattic/mongoose",
  "prisma/prisma",
  "fastapi/fastapi",
  "tiangolo/fastapi",
  "axios/axios",
  "typeorm/typeorm",
  "sequelize/sequelize",
  "nestjs/nest",
  "socketio/socket.io",
  "vitejs/vite",
  "tailwindlabs/tailwindcss",
  "supabase/supabase",
  "trpc/trpc",
  "graphql/graphql-js",
  "apollographql/apollo-server",
  "biomejs/biome",
];

const STACK_KEYWORDS = [
  "node", "express", "react", "next", "nextjs",
  "docker", "redis", "mongodb", "mongo", "postgresql",
  "mysql", "sql", "python", "javascript", "typescript",
  "api", "rest", "backend", "server", "database",
  "microservice", "kubernetes", "k8s", "fastapi",
];

// ─── Seen issue persistence ────────────────────────────────────────────────────

function loadSeen() {
  try {
    if (fs.existsSync(SEEN_FILE)) {
      const data = JSON.parse(fs.readFileSync(SEEN_FILE, "utf8"));
      // keep only last 500 to avoid unbounded growth
      return new Set(data.slice(-500));
    }
  } catch {}
  return new Set();
}

function saveSeen(seen) {
  try {
    fs.writeFileSync(SEEN_FILE, JSON.stringify([...seen].slice(-500)));
  } catch (e) {
    console.warn("Could not save seen.json:", e.message);
  }
}

// ─── GitHub fetcher ────────────────────────────────────────────────────────────

async function fetchIssues(seen) {
  const allIssues = [];

  for (const repo of REPOS) {
    try {
      const res = await fetch(
        `https://api.github.com/repos/${repo}/issues?labels=good+first+issue&state=open&per_page=5&sort=created&direction=desc`,
        {
          headers: {
            Accept: "application/vnd.github+json",
            "User-Agent": "good-first-issue-tracker",
          },
        }
      );

      if (!res.ok) {
        console.log(`Skipping ${repo}: ${res.status}`);
        continue;
      }

      const issues = await res.json();

      for (const issue of issues) {
        if (seen.has(issue.id)) continue;

        const text = `${issue.title} ${issue.body || ""} ${issue.labels.map((l) => l.name).join(" ")}`.toLowerCase();
        const relevant = STACK_KEYWORDS.some((kw) => text.includes(kw));
        if (!relevant) continue;

        allIssues.push({
          id: issue.id,
          title: issue.title,
          url: issue.html_url,
          repo,
          body: (issue.body || "").slice(0, 400),
          labels: issue.labels.map((l) => l.name),
          created: issue.created_at,
        });
      }

      // respect rate limit
      await new Promise((r) => setTimeout(r, 200));
    } catch (e) {
      console.warn(`Error fetching ${repo}:`, e.message);
    }
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
          ${issue.labels
            .slice(0, 3)
            .map(
              (l) =>
                `<span style="background:#1a1a0a;color:#f0c040;font-size:10px;padding:2px 7px;border-radius:3px;border:1px solid #2a2a0a;margin-left:4px">${l}</span>`
            )
            .join("")}
        </div>
        ${
          issue.body
            ? `<div style="margin-top:8px;color:#4a6a6a;font-size:12px;line-height:1.5">${issue.body.replace(/</g, "&lt;").replace(/>/g, "&gt;").slice(0, 200)}...</div>`
            : ""
        }
      </td>
      <td style="padding:14px 10px;vertical-align:top;white-space:nowrap">
        <a href="${issue.url}" style="background:#00e5cc;color:#000;padding:6px 14px;border-radius:4px;text-decoration:none;font-size:12px;font-weight:700;font-family:monospace">View →</a>
      </td>
    </tr>`
    )
    .join("");

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#060c0c">
  <div style="max-width:700px;margin:32px auto;background:#080e0e;border:1px solid #1a2a2a;border-radius:8px;overflow:hidden;font-family:'JetBrains Mono',monospace,monospace">
    
    <div style="background:#0a1515;padding:24px 28px;border-bottom:1px solid #1a2a2a">
      <div style="color:#00e5cc;font-size:11px;letter-spacing:0.2em;margin-bottom:6px">// GOOD FIRST ISSUE DIGEST</div>
      <div style="color:#e8f4f4;font-size:22px;font-weight:700">good<span style="color:#00e5cc">.</span>first<span style="color:#00e5cc">.</span>issue</div>
      <div style="color:#2a4a4a;font-size:12px;margin-top:6px">${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} IST · ${issues.length} new issues matched your stack</div>
    </div>

    <div style="padding:0 16px 16px">
      <table style="width:100%;border-collapse:collapse">
        <thead>
          <tr style="border-bottom:2px solid #1a2a2a">
            <th style="padding:12px 10px;color:#2a4a4a;text-align:left;font-size:11px;letter-spacing:0.1em">#</th>
            <th style="padding:12px 10px;color:#2a4a4a;text-align:left;font-size:11px;letter-spacing:0.1em">ISSUE</th>
            <th style="padding:12px 10px;color:#2a4a4a;text-align:left;font-size:11px;letter-spacing:0.1em">LINK</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>

    <div style="background:#0a1515;padding:16px 28px;border-top:1px solid #1a2a2a">
      <div style="color:#1a3a3a;font-size:11px">
        Stack: node · express · react · next · docker · redis · mongo · sql · python<br>
        Next digest in ~30 minutes · <a href="https://github.com" style="color:#1a3a3a">Powered by GitHub Actions</a>
      </div>
    </div>

  </div>
</body>
</html>`;

  return html;
}

// ─── Send email ────────────────────────────────────────────────────────────────

async function sendEmail(html, issueCount) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: GMAIL_USER,
      pass: GMAIL_APP_PASSWORD,
    },
  });

  await transporter.sendMail({
    from: `"Issue Tracker 🟢" <${GMAIL_USER}>`,
    to: GMAIL_USER,
    subject: `🟢 ${issueCount} Good First Issue${issueCount > 1 ? "s" : ""} — ${new Date().toLocaleDateString("en-IN")}`,
    html,
  });

  console.log(`✓ Email sent to ${GMAIL_USER} with ${issueCount} issues`);
}

// ─── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`[${new Date().toISOString()}] Starting issue tracker...`);

  if (!GMAIL_USER || !GMAIL_APP_PASSWORD) {
    console.error("Missing GMAIL_USER or GMAIL_APP_PASSWORD env vars");
    process.exit(1);
  }

  const seen = loadSeen();
  console.log(`Loaded ${seen.size} previously seen issue IDs`);

  const issues = await fetchIssues(seen);
  console.log(`Found ${issues.length} new matching issues`);

  if (issues.length === 0) {
    console.log("No new issues — skipping email");
    return;
  }

  const html = buildEmail(issues);
  await sendEmail(html, issues.length);

  // mark all as seen
  issues.forEach((i) => seen.add(i.id));
  saveSeen(seen);

  console.log("Done.");
}

main().catch((e) => {
  console.error("Fatal error:", e);
  process.exit(1);
});
