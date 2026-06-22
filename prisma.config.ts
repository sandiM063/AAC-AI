
// npm install --save-dev prisma dotenv
import "dotenv/config";
import { defineConfig } from "prisma/config";
import { resolveDatabaseUrlFromEnv } from "./scripts/normalize-database-url.mjs";

/** Build hosts (e.g. Netlify) may not inject env vars during `npm install` / `prisma generate`. */
const databaseUrl =
  resolveDatabaseUrlFromEnv() || "postgresql://localhost:5432/aacnai?schema=public";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  engine: "classic",
  datasource: {
    url: databaseUrl,
  },
});
