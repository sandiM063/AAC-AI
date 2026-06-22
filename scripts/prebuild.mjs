import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { resolveDatabaseUrlFromEnv } from "./normalize-database-url.mjs";

const PLACEHOLDER_DATABASE_URL =
  "postgresql://localhost:5432/aacnai?schema=public";

const RHEL_ENGINE = "libquery_engine-rhel-openssl-3.0.x.so.node";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const prismaClientDir = path.join(projectRoot, "node_modules", ".prisma", "client");

function runPrisma(args) {
  const result = spawnSync("npx", ["prisma", ...args], {
    stdio: "inherit",
    cwd: projectRoot,
    env: process.env,
    shell: true,
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function assertRhelEnginePresent() {
  const enginePath = path.join(prismaClientDir, RHEL_ENGINE);
  if (fs.existsSync(enginePath)) {
    console.log(`[build] Prisma RHEL engine OK (${RHEL_ENGINE})`);
    return;
  }

  console.error(`
[build] Missing Prisma engine for Netlify/AWS Lambda: ${RHEL_ENGINE}
Expected at: ${enginePath}

Ensure prisma/schema.prisma includes:
  binaryTargets = ["native", "rhel-openssl-3.0.x"]
`);
  process.exit(1);
}

const productionDatabaseUrl = resolveDatabaseUrlFromEnv();

if (!productionDatabaseUrl) {
  process.env.DATABASE_URL = PLACEHOLDER_DATABASE_URL;
}

runPrisma(["generate"]);
assertRhelEnginePresent();

if (!productionDatabaseUrl) {
  console.error(`
[build] DATABASE_URL is not set.

Netlify: Site configuration → Environment variables
  Key:   DATABASE_URL
  Value: postgresql://user:pass@host/neondb?sslmode=require
         (paste the URL only — no quotes around it)

Scopes: check "Builds" and "Production", then redeploy.
`);
  process.exit(1);
}

process.env.DATABASE_URL = productionDatabaseUrl;
runPrisma(["migrate", "deploy"]);
