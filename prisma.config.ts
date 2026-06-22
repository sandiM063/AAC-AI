
// npm install --save-dev prisma dotenv
import "dotenv/config";
import { defineConfig } from "prisma/config";

/** Build hosts (e.g. Netlify) may not inject env vars during `npm install` / `prisma generate`. */
const databaseUrl =
  process.env.DATABASE_URL?.trim() ||
  "postgresql://localhost:5432/aacnai?schema=public";

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
