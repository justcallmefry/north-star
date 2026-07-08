-- Funnel analytics: minimal event log (signup -> paired -> first reveal -> checkout).
-- Additive only — safe for `prisma migrate deploy` against live data.

CREATE TABLE "AppEvent" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "userId" TEXT,
    "relationshipId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AppEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AppEvent_type_createdAt_idx" ON "AppEvent"("type", "createdAt");
