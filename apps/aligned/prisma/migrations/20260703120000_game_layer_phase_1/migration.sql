-- Game Layer Phase 1: Grace Days + WYR "Called It"
-- Additive only — safe for `prisma migrate deploy` against live data.

-- Streak: banked Grace Days + the missed day the last one bridged
ALTER TABLE "Streak" ADD COLUMN "graceDays" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Streak" ADD COLUMN "graceUsedDate" DATE;

-- WYR: optional prediction of the partner's choice
ALTER TABLE "WyrParticipation" ADD COLUMN "guess" INTEGER;
