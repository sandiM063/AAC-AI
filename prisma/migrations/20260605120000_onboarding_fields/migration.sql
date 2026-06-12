-- AlterTable
ALTER TABLE "User" ADD COLUMN "aacExperience" TEXT;
ALTER TABLE "User" ADD COLUMN "wantsTutorial" BOOLEAN;
ALTER TABLE "User" ADD COLUMN "onboardingCompletedAt" DATETIME;

-- Backfill users who completed profession-only onboarding
UPDATE "User"
SET "onboardingCompletedAt" = COALESCE("professionSelectedAt", "createdAt")
WHERE "profession" IS NOT NULL AND "onboardingCompletedAt" IS NULL;
