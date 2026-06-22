import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Prisma CLI needs DATABASE_URL even for `generate` (no DB connection). */
if (!process.env.DATABASE_URL?.trim()) {
  process.env.DATABASE_URL = "postgresql://localhost:5432/aacnai?schema=public";
}

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const result = spawnSync("npx", ["prisma", "generate"], {
  stdio: "inherit",
  cwd: projectRoot,
  env: process.env,
  shell: true,
});

process.exit(result.status === null ? 1 : result.status);
