-- CreateEnum
CREATE TYPE "IssueCadence" AS ENUM ('weekly', 'monthly', 'yearly', 'milestone');

-- CreateTable
CREATE TABLE "Issue" (
    "id" TEXT NOT NULL,
    "relationshipId" TEXT NOT NULL,
    "cadence" "IssueCadence" NOT NULL,
    "milestoneType" TEXT,
    "issueNumber" INTEGER NOT NULL,
    "volumeNumber" INTEGER NOT NULL DEFAULT 1,
    "windowStart" TIMESTAMP(3) NOT NULL,
    "windowEnd" TIMESTAMP(3) NOT NULL,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "headline" TEXT NOT NULL,
    "coverPhotoUrl" TEXT,
    "coverGradient" JSONB,
    "sections" JSONB NOT NULL,
    "savedAt" TIMESTAMP(3),
    "openedByA" TIMESTAMP(3),
    "openedByB" TIMESTAMP(3),
    "isPremium" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Issue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Issue_relationshipId_cadence_issueNumber_key" ON "Issue"("relationshipId", "cadence", "issueNumber");

-- CreateIndex
CREATE INDEX "Issue_relationshipId_publishedAt_idx" ON "Issue"("relationshipId", "publishedAt");

-- AddForeignKey
ALTER TABLE "Issue" ADD CONSTRAINT "Issue_relationshipId_fkey" FOREIGN KEY ("relationshipId") REFERENCES "Relationship"("id") ON DELETE CASCADE ON UPDATE CASCADE;
