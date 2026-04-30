-- CreateEnum
CREATE TYPE "WyrState" AS ENUM ('open', 'revealed');

-- CreateTable
CREATE TABLE "WyrSession" (
    "id" TEXT NOT NULL,
    "relationshipId" TEXT NOT NULL,
    "sessionDate" DATE NOT NULL,
    "questionIndex" INTEGER NOT NULL,
    "state" "WyrState" NOT NULL DEFAULT 'open',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WyrSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WyrParticipation" (
    "id" TEXT NOT NULL,
    "wyrSessionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "choice" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WyrParticipation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartnerSpotlight" (
    "id" TEXT NOT NULL,
    "relationshipId" TEXT NOT NULL,
    "fromUserId" TEXT NOT NULL,
    "toUserId" TEXT NOT NULL,
    "items" JSONB NOT NULL,
    "monthKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PartnerSpotlight_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WyrSession_relationshipId_sessionDate_key" ON "WyrSession"("relationshipId", "sessionDate");
CREATE INDEX "WyrSession_relationshipId_idx" ON "WyrSession"("relationshipId");
CREATE INDEX "WyrSession_sessionDate_idx" ON "WyrSession"("sessionDate");

-- CreateIndex
CREATE UNIQUE INDEX "WyrParticipation_wyrSessionId_userId_key" ON "WyrParticipation"("wyrSessionId", "userId");
CREATE INDEX "WyrParticipation_wyrSessionId_idx" ON "WyrParticipation"("wyrSessionId");
CREATE INDEX "WyrParticipation_userId_idx" ON "WyrParticipation"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "PartnerSpotlight_relationshipId_fromUserId_monthKey_key" ON "PartnerSpotlight"("relationshipId", "fromUserId", "monthKey");
CREATE INDEX "PartnerSpotlight_relationshipId_idx" ON "PartnerSpotlight"("relationshipId");
CREATE INDEX "PartnerSpotlight_toUserId_idx" ON "PartnerSpotlight"("toUserId");

-- AddForeignKey
ALTER TABLE "WyrSession" ADD CONSTRAINT "WyrSession_relationshipId_fkey" FOREIGN KEY ("relationshipId") REFERENCES "Relationship"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WyrParticipation" ADD CONSTRAINT "WyrParticipation_wyrSessionId_fkey" FOREIGN KEY ("wyrSessionId") REFERENCES "WyrSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WyrParticipation" ADD CONSTRAINT "WyrParticipation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PartnerSpotlight" ADD CONSTRAINT "PartnerSpotlight_relationshipId_fkey" FOREIGN KEY ("relationshipId") REFERENCES "Relationship"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PartnerSpotlight" ADD CONSTRAINT "PartnerSpotlight_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PartnerSpotlight" ADD CONSTRAINT "PartnerSpotlight_toUserId_fkey" FOREIGN KEY ("toUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
