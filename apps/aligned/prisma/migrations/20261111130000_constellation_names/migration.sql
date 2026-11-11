-- Couples name each month's constellation once the month is over.
CREATE TABLE "ConstellationName" (
    "id" TEXT NOT NULL,
    "relationshipId" TEXT NOT NULL,
    "monthKey" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "namedById" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConstellationName_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ConstellationName_relationshipId_monthKey_key" ON "ConstellationName"("relationshipId", "monthKey");

ALTER TABLE "ConstellationName" ADD CONSTRAINT "ConstellationName_relationshipId_fkey" FOREIGN KEY ("relationshipId") REFERENCES "Relationship"("id") ON DELETE CASCADE ON UPDATE CASCADE;
