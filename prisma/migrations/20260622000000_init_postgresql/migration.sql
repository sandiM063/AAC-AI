-- PostgreSQL baseline (replaces SQLite migrations for online deployment)

CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT,
    "countryCode" TEXT,
    "phone" TEXT,
    "password" TEXT,
    "googleId" TEXT,
    "authProvider" TEXT NOT NULL DEFAULT 'credentials',
    "profileImageUrl" TEXT,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "phoneVerified" BOOLEAN NOT NULL DEFAULT false,
    "profession" TEXT,
    "professionSelectedAt" TIMESTAMP(3),
    "theme" TEXT NOT NULL DEFAULT 'green',
    "language" TEXT NOT NULL DEFAULT 'en',
    "aacExperience" TEXT,
    "wantsTutorial" BOOLEAN,
    "onboardingCompletedAt" TIMESTAMP(3),
    "profileImageUpdatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CommunityPreset" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "coverSymbolId" TEXT NOT NULL,
    "coverPictogramId" INTEGER NOT NULL,
    "profession" TEXT,
    "stepCount" INTEGER NOT NULL DEFAULT 0,
    "tileCount" INTEGER NOT NULL DEFAULT 0,
    "payload" TEXT NOT NULL,
    "likeCount" INTEGER NOT NULL DEFAULT 0,
    "favoriteCount" INTEGER NOT NULL DEFAULT 0,
    "dailyUserCount" INTEGER NOT NULL DEFAULT 0,
    "useCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommunityPreset_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CommunityPresetInteraction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "presetId" TEXT NOT NULL,
    "liked" BOOLEAN NOT NULL DEFAULT false,
    "favorited" BOOLEAN NOT NULL DEFAULT false,
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommunityPresetInteraction_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AssistantMessage" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssistantMessage_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AssistantMemoryChunk" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "messageId" TEXT,
    "content" TEXT NOT NULL,
    "embedding" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssistantMemoryChunk_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PendingRegistration" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT,
    "countryCode" TEXT,
    "phone" TEXT,
    "password" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "otpHash" TEXT NOT NULL,
    "otpExpiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PendingRegistration_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_googleId_key" ON "User"("googleId");
CREATE UNIQUE INDEX "User_countryCode_phone_key" ON "User"("countryCode", "phone");
CREATE UNIQUE INDEX "CommunityPreset_slug_key" ON "CommunityPreset"("slug");
CREATE INDEX "CommunityPreset_type_idx" ON "CommunityPreset"("type");
CREATE UNIQUE INDEX "CommunityPresetInteraction_userId_presetId_key" ON "CommunityPresetInteraction"("userId", "presetId");
CREATE INDEX "CommunityPresetInteraction_presetId_idx" ON "CommunityPresetInteraction"("presetId");
CREATE INDEX "AssistantMessage_userId_createdAt_idx" ON "AssistantMessage"("userId", "createdAt");
CREATE INDEX "AssistantMemoryChunk_userId_createdAt_idx" ON "AssistantMemoryChunk"("userId", "createdAt");

ALTER TABLE "CommunityPresetInteraction" ADD CONSTRAINT "CommunityPresetInteraction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CommunityPresetInteraction" ADD CONSTRAINT "CommunityPresetInteraction_presetId_fkey" FOREIGN KEY ("presetId") REFERENCES "CommunityPreset"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AssistantMessage" ADD CONSTRAINT "AssistantMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AssistantMemoryChunk" ADD CONSTRAINT "AssistantMemoryChunk_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
