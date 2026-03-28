import { fetchAllIssues }        from "./fetcher.js";
import { scoreIssue }            from "./scorer.js";
import { shouldInclude }         from "./filter.js";
import { filterUnseen, markAsSeen } from "./deduplicator.js";
import { formatIssue }           from "./formatter.js";
import { sendIssue, sendErrorAlert } from "./telegram.js";
import { ISSUE_MIX }             from "./config.js";

async function main() {
  console.log("🚀 Tracker started");

  const raw      = await fetchAllIssues();
  const filtered = raw.filter(shouldInclude);
  console.log(`Raw: ${raw.length} → After filter: ${filtered.length}`);

  const unseen = await filterUnseen(filtered);
  console.log(`Unseen (Redis): ${unseen.length}`);

  const scored = unseen.map(issue => ({
    ...issue,
    finalScore: scoreIssue(issue),
  }));

  const bucket = (cat) =>
    scored
      .filter(i => i.category === cat)
      .sort((a, b) => b.finalScore - a.finalScore);

  const top = [
    ...bucket("beginner").slice(0,    ISSUE_MIX.beginner),
    ...bucket("intermediate").slice(0, ISSUE_MIX.intermediate),
    ...bucket("advanced").slice(0,    ISSUE_MIX.advanced),
  ];

  console.log(`Sending: ${top.length} issues`);

  if (top.length === 0) {
    console.log("No new issues found in last 24h");
    return;
  }

  for (const issue of top) {
    await sendIssue(formatIssue(issue));
  }

  await markAsSeen(top);
  console.log("✅ Done. Sent:", top.length);
}

main().catch(async err => {
  console.error(err);
  await sendErrorAlert(err.message);
});