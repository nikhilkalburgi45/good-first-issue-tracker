# good.first.issue tracker

Runs every 30 minutes via GitHub Actions. Fetches good first issues from 22 repos matching your stack, deduplicates them, and sends a Gmail digest.

**Stack tracked:** Node.js · Express · React · Next.js · Docker · Redis · MongoDB · PostgreSQL · MySQL · Python · TypeScript

---

## Setup (5 minutes)

### 1. Create repo & push files

```bash
git init good-first-issue-tracker
cd good-first-issue-tracker
# copy all files here, then:
git add .
git commit -m "init"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/good-first-issue-tracker.git
git push -u origin main
```

### 2. Add GitHub Secrets

Go to your repo → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

Add these two secrets:

| Name | Value |
|------|-------|
| `GMAIL_USER` | your Gmail address e.g. `nikhil@gmail.com` |
| `GMAIL_APP_PASSWORD` | the 16-char App Password you generated |

### 3. Enable Actions

Go to **Actions** tab in your repo → click **"I understand my workflows, go ahead and enable them"**

### 4. Test it manually

Actions tab → **Good First Issue Tracker** → **Run workflow** → **Run workflow**

Check your Gmail in ~30 seconds.

---

## File structure

```
.github/
  workflows/
    issue-tracker.yml   ← cron schedule
scripts/
  tracker.js            ← main script
  package.json          ← dependencies
  seen.json             ← auto-generated, tracks sent issues
README.md
```

---

## Customise

**Add more repos** — edit the `REPOS` array in `scripts/tracker.js`

**Change frequency** — edit the cron in `.github/workflows/issue-tracker.yml`
- Every hour: `"0 * * * *"`
- Every 2 hours: `"0 */2 * * *"`
- Once a day: `"0 9 * * *"` (9am UTC)

**Add more keywords** — edit `STACK_KEYWORDS` in `scripts/tracker.js`
