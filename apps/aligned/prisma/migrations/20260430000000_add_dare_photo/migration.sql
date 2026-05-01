-- CreateTable
CREATE TABLE "Dare" (
    "id" TEXT NOT NULL,
    "weekKey" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Dare_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DareCompletion" (
    "id" TEXT NOT NULL,
    "dareId" TEXT NOT NULL,
    "relationshipId" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "photoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DareCompletion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Dare_weekKey_key" ON "Dare"("weekKey");

-- CreateIndex
CREATE INDEX "Dare_weekKey_idx" ON "Dare"("weekKey");

-- CreateIndex
CREATE UNIQUE INDEX "DareCompletion_dareId_relationshipId_key" ON "DareCompletion"("dareId", "relationshipId");

-- CreateIndex
CREATE INDEX "DareCompletion_dareId_idx" ON "DareCompletion"("dareId");

-- CreateIndex
CREATE INDEX "DareCompletion_relationshipId_idx" ON "DareCompletion"("relationshipId");

-- AddForeignKey
ALTER TABLE "DareCompletion" ADD CONSTRAINT "DareCompletion_dareId_fkey" FOREIGN KEY ("dareId") REFERENCES "Dare"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DareCompletion" ADD CONSTRAINT "DareCompletion_relationshipId_fkey" FOREIGN KEY ("relationshipId") REFERENCES "Relationship"("id") ON DELETE CASCADE ON UPDATE CASCADE;
