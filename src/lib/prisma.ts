import { PrismaClient } from "@/generated/prisma/client";
import { createHash } from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  prismaClientFingerprint?: string;
};

function getProjectRoot(): string {
  return path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
}

function resolveDatabaseUrl(): string {
  const projectRoot = getProjectRoot();
  const defaultDbPath = path.join(projectRoot, "prisma", "dev.db");
  const fromEnv = process.env.DATABASE_URL;

  if (!fromEnv?.startsWith("file:")) {
    return `file:${defaultDbPath}`;
  }

  const filePath = fromEnv.slice("file:".length);

  if (path.isAbsolute(filePath)) {
    return fromEnv;
  }

  if (filePath === "./dev.db" || filePath === "dev.db") {
    return `file:${defaultDbPath}`;
  }

  // Prisma CLI resolves file:./prisma/dev.db relative to the schema folder,
  // which incorrectly creates prisma/prisma/dev.db — always use project prisma/dev.db.
  if (filePath === "./prisma/dev.db" || filePath === "prisma/dev.db") {
    return `file:${defaultDbPath}`;
  }

  const relativePath = filePath.replace(/^\.\//, "");
  return `file:${path.join(projectRoot, relativePath)}`;
}

function getGeneratedClientFingerprint(): string {
  const classPath = path.join(
    getProjectRoot(),
    "src",
    "generated",
    "prisma",
    "internal",
    "class.ts",
  );

  try {
    return createHash("sha256")
      .update(fs.readFileSync(classPath))
      .digest("hex")
      .slice(0, 16);
  } catch {
    return "unknown";
  }
}

function createPrismaClient(): PrismaClient {
  const databaseUrl = resolveDatabaseUrl();

  return new PrismaClient({
    datasources: { db: { url: databaseUrl } },
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

const prismaClientFingerprint = getGeneratedClientFingerprint();

if (process.env.NODE_ENV !== "production") {
  if (
    globalForPrisma.prisma &&
    globalForPrisma.prismaClientFingerprint !== prismaClientFingerprint
  ) {
    void globalForPrisma.prisma.$disconnect();
    globalForPrisma.prisma = undefined;
  }

  globalForPrisma.prismaClientFingerprint = prismaClientFingerprint;
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
