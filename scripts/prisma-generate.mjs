import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { resolveDatabaseUrlFromEnv } from "./normalize-database-url.mjs";

/** Prisma CLI needs DATABASE_URL even for `generate` (no DB connection). */
if (!resolveDatabaseUrlFromEnv()) {
  process.env.DATABASE_URL = "postgresql://localhost:5432/aacnai?schema=public";
} else {
  process.env.DATABASE_URL = resolveDatabaseUrlFromEnv();
}

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const result = spawnSync("npx", ["prisma", "generate"], {
  stdio: "inherit",
  cwd: projectRoot,
  env: process.env,
  shell: true,
});

process.exit(result.status === null ? 1 : result.status);
