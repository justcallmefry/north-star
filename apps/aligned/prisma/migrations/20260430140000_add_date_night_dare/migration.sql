-- CreateTable
CREATE TABLE "DateNightDare" (
    "id" TEXT NOT NULL,
    "relationshipId" TEXT NOT NULL,
    "weekKey" TEXT NOT NULL,
    "dareIndex" INTEGER NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DateNightDare_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DateNightDare_relationshipId_weekKey_key" ON "DateNightDare"("relationshipId", "weekKey");
CREATE INDEX "DateNightDare_relationshipId_idx" ON "DateNightDare"("relationshipId");

-- AddForeignKey
ALTER TABLE "DateNightDare" ADD CONSTRAINT "DateNightDare_relationshipId_fkey" FOREIGN KEY ("relationshipId") REFERENCES "Relationship"("id") ON DELETE CASCADE ON UPDATE CASCADE;
