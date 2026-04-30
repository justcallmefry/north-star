-- Extend Prompt model with v3 taxonomy fields. All defaults chosen so
-- existing rows remain valid without a backfill step.

ALTER TABLE "Prompt"
  ADD COLUMN "subcategory"          TEXT,
  ADD COLUMN "depthLevel"           INTEGER NOT NULL DEFAULT 2,
  ADD COLUMN "funScore"             INTEGER NOT NULL DEFAULT 3,
  ADD COLUMN "emotionalIntensity"   INTEGER NOT NULL DEFAULT 2,
  ADD COLUMN "partnerGuessEnabled"  BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "isDateActivation"     BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "isMilestone"          BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "weekendOnly"          BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "relationshipStage"    TEXT,
  ADD COLUMN "tags"                 TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "qualityScore"         INTEGER,
  ADD COLUMN "sourceVersion"        INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN "repeatCooldownDays"   INTEGER NOT NULL DEFAULT 21;

CREATE INDEX "Prompt_subcategory_idx" ON "Prompt"("subcategory");
CREATE INDEX "Prompt_isMilestone_idx" ON "Prompt"("isMilestone");
