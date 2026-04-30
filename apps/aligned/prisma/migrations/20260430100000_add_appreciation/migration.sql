-- CreateTable
CREATE TABLE "Appreciation" (
    "id" TEXT NOT NULL,
    "relationshipId" TEXT NOT NULL,
    "fromUserId" TEXT NOT NULL,
    "toUserId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "weekKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Appreciation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Appreciation_relationshipId_fromUserId_weekKey_key" ON "Appreciation"("relationshipId", "fromUserId", "weekKey");

-- CreateIndex
CREATE INDEX "Appreciation_relationshipId_idx" ON "Appreciation"("relationshipId");

-- CreateIndex
CREATE INDEX "Appreciation_toUserId_idx" ON "Appreciation"("toUserId");

-- CreateIndex
CREATE INDEX "Appreciation_weekKey_idx" ON "Appreciation"("weekKey");

-- AddForeignKey
ALTER TABLE "Appreciation" ADD CONSTRAINT "Appreciation_relationshipId_fkey" FOREIGN KEY ("relationshipId") REFERENCES "Relationship"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appreciation" ADD CONSTRAINT "Appreciation_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appreciation" ADD CONSTRAINT "Appreciation_toUserId_fkey" FOREIGN KEY ("toUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
