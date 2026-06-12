-- CreateTable
CREATE TABLE "CommunityPreset" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "CommunityPresetInteraction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "presetId" TEXT NOT NULL,
    "liked" BOOLEAN NOT NULL DEFAULT false,
    "favorited" BOOLEAN NOT NULL DEFAULT false,
    "lastUsedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CommunityPresetInteraction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CommunityPresetInteraction_presetId_fkey" FOREIGN KEY ("presetId") REFERENCES "CommunityPreset" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "CommunityPreset_slug_key" ON "CommunityPreset"("slug");

-- CreateIndex
CREATE INDEX "CommunityPreset_type_idx" ON "CommunityPreset"("type");

-- CreateIndex
CREATE INDEX "CommunityPresetInteraction_presetId_idx" ON "CommunityPresetInteraction"("presetId");

-- CreateIndex
CREATE UNIQUE INDEX "CommunityPresetInteraction_userId_presetId_key" ON "CommunityPresetInteraction"("userId", "presetId");
