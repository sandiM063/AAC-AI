import { PrismaClient } from "@/generated/prisma/client";
import { createHash } from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { getProjectRoot } from "@/lib/app-url";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  prismaClientFingerprint?: string;
};

function resolveDatabaseUrl(): string {
  const fromEnv = process.env.DATABASE_URL?.trim();
  if (!fromEnv) {
    throw new Error(
      "DATABASE_URL is not set. Use a PostgreSQL URL (e.g. Neon) — see .env.example.",
    );
  }

  if (fromEnv.startsWith("postgresql://") || fromEnv.startsWith("postgres://")) {
    return fromEnv;
  }

  // Legacy local SQLite fallback (dev only).
  if (fromEnv.startsWith("file:")) {
    const projectRoot = getProjectRoot();
    const filePath = fromEnv.slice("file:".length);
    const absolute =
      path.isAbsolute(filePath) ? filePath : path.join(projectRoot, filePath.replace(/^\.\//, ""));
    return `file:${absolute}`;
  }

  return fromEnv;
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
