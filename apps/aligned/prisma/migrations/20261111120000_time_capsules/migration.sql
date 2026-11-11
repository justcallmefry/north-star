-- Time capsules: messages sealed until a chosen date.
CREATE TABLE "TimeCapsule" (
    "id" TEXT NOT NULL,
    "relationshipId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "openOn" DATE NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "openNotifiedAt" TIMESTAMP(3),

    CONSTRAINT "TimeCapsule_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "TimeCapsule_relationshipId_idx" ON "TimeCapsule"("relationshipId");
CREATE INDEX "TimeCapsule_openOn_idx" ON "TimeCapsule"("openOn");

ALTER TABLE "TimeCapsule" ADD CONSTRAINT "TimeCapsule_relationshipId_fkey" FOREIGN KEY ("relationshipId") REFERENCES "Relationship"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TimeCapsule" ADD CONSTRAINT "TimeCapsule_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
