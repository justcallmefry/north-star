-- CreateTable
CREATE TABLE "Memory" (
    "id" TEXT NOT NULL,
    "relationshipId" TEXT NOT NULL,
    "savedByUserId" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "sourceId" TEXT,
    "snapshot" JSONB NOT NULL,
    "savedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Memory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Memory_relationshipId_idx" ON "Memory"("relationshipId");

-- CreateIndex
CREATE INDEX "Memory_savedByUserId_idx" ON "Memory"("savedByUserId");

-- CreateIndex
CREATE INDEX "Memory_savedAt_idx" ON "Memory"("savedAt");

-- AddForeignKey
ALTER TABLE "Memory" ADD CONSTRAINT "Memory_relationshipId_fkey" FOREIGN KEY ("relationshipId") REFERENCES "Relationship"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Memory" ADD CONSTRAINT "Memory_savedByUserId_fkey" FOREIGN KEY ("savedByUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
