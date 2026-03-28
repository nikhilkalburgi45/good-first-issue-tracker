import { Redis } from "@upstash/redis";

const redis = new Redis({
  url:   process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

const TTL_SEC    = 30 * 24 * 60 * 60; // 30 days per issue
const keyFor = (id) => `tracker:issue:${id}`;

export async function filterUnseen(issues) {
  if (issues.length === 0) return [];

  // Check all issue keys in one pipeline
  const pipeline = redis.pipeline();
  issues.forEach(i => pipeline.exists(keyFor(i.id)));
  const results = await pipeline.exec();

  // Keep only issues where key does NOT exist in Redis
  return issues.filter((_, idx) => results[idx] === 0);
}

export async function markAsSeen(issues) {
  if (issues.length === 0) return;

  const pipeline = redis.pipeline();

  issues.forEach(i => {
    // Store metadata as value — not just "1"
    // Useful for future analytics/debugging
    const value = JSON.stringify({
      repo:      i.repoFullName,
      score:     i.finalScore,
      category:  i.category,
      seenAt:    new Date().toISOString(),
    });

    pipeline.set(keyFor(i.id), value, { ex: TTL_SEC });
  });

  await pipeline.exec();
  console.log(`Marked ${issues.length} issues as seen in Redis`);
}