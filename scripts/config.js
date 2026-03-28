export const REPOS = [
  // Node / Express
  { full_name: "expressjs/express",         weight: 1.5, tags: ["node", "express"] },
  { full_name: "fastify/fastify",            weight: 1.5, tags: ["node", "express"] },
  { full_name: "nestjs/nest",               weight: 1.4, tags: ["node", "typescript"] },
  // React / Next.js
  { full_name: "vercel/next.js",            weight: 1.3, tags: ["nextjs", "react"] },
  { full_name: "facebook/react",            weight: 1.2, tags: ["react", "javascript"] },
  // MongoDB
  { full_name: "Automattic/mongoose",       weight: 1.5, tags: ["mongodb", "node"] },
  { full_name: "mongodb/node-mongodb-native", weight: 1.3, tags: ["mongodb"] },
  // SQL / ORM
  { full_name: "typeorm/typeorm",           weight: 1.5, tags: ["sql", "typescript"] },
  { full_name: "sequelize/sequelize",       weight: 1.4, tags: ["sql", "node"] },
  { full_name: "prisma/prisma",             weight: 1.4, tags: ["sql", "typescript"] },
  { full_name: "drizzle-team/drizzle-orm",  weight: 1.3, tags: ["sql", "typescript"] },
  // Redis
  { full_name: "redis/node-redis",          weight: 1.5, tags: ["redis", "node"] },
  { full_name: "redis/ioredis",             weight: 1.4, tags: ["redis", "node"] },
  // Docker
  { full_name: "docker/compose",            weight: 1.3, tags: ["docker"] },
  // TypeScript / JS tooling
  { full_name: "axios/axios",               weight: 1.3, tags: ["javascript", "node"] },
  { full_name: "trpc/trpc",                 weight: 1.3, tags: ["typescript", "node"] },
  { full_name: "microsoft/TypeScript",      weight: 1.2, tags: ["typescript"] },
  { full_name: "hoppscotch/hoppscotch",     weight: 1.1, tags: ["javascript"] },
  { full_name: "calcom/cal.com",            weight: 1.2, tags: ["nextjs", "sql"] },
  { full_name: "nocodb/nocodb",             weight: 1.2, tags: ["sql", "node"] },
];

export const LABEL_CATEGORIES = {
  beginner:     ["good first issue", "beginner-friendly"],
  intermediate: ["bug", "enhancement", "api", "database"],
  advanced:     ["performance", "optimization", "concurrency"],
};

export const IGNORE_LABELS = [
  "stale", "duplicate", "invalid", "wontfix", "question", "discussion"
];

export const TITLE_BLACKLIST = [
  "step 1", "step 2", "step 3", "step 4", "step 5",
  "curriculum", "translation", "i18n", "l10n",
  "bump version", "version bump", "release v", "chore:", "typo fix",
];

export const ISSUE_MIX    = { beginner: 3, intermediate: 5, advanced: 2 };
export const MAX_AGE_HOURS = 24;
export const BATCH_SIZE    = 5; // repos per search query