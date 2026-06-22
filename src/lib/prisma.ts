import { PrismaClient } from "@prisma/client";
import { createHash } from "crypto";
import fs from "fs";
import path from "path";
import { getProjectRoot } from "@/lib/app-url";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  prismaClientFingerprint?: string;
};

function resolveDatabaseUrl(): string {
  const fromEnv = process.env.DATABASE_URL?.trim();
  const normalized = fromEnv
    ? fromEnv.replace(/^["']|["']$/g, "").trim()
    : "";

  if (!normalized) {
    throw new Error(
      "DATABASE_URL is not set. Use a PostgreSQL URL (e.g. Neon) — see .env.example.",
    );
  }

  if (normalized.startsWith("postgresql://") || normalized.startsWith("postgres://")) {
    return normalized;
  }

  // Legacy local SQLite fallback (dev only).
  if (normalized.startsWith("file:")) {
    const projectRoot = getProjectRoot();
    const filePath = normalized.slice("file:".length);
    const absolute =
      path.isAbsolute(filePath) ? filePath : path.join(projectRoot, filePath.replace(/^\.\//, ""));
    return `file:${absolute}`;
  }

  return normalized;
}

function getGeneratedClientFingerprint(): string {
  const clientPath = path.join(getProjectRoot(), "node_modules", ".prisma", "client", "index.js");

  try {
    return createHash("sha256")
      .update(fs.readFileSync(clientPath))
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
