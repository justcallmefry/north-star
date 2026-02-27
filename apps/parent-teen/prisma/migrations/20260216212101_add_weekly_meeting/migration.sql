-- CreateTable
CREATE TABLE "Meeting" (
    "id" TEXT NOT NULL,
    "relationshipId" TEXT NOT NULL,
    "weekKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Meeting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MeetingEntry" (
    "id" TEXT NOT NULL,
    "meetingId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "wins" TEXT,
    "stressors" TEXT,
    "request" TEXT,
    "plan" TEXT,
    "appreciation" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MeetingEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Meeting_relationshipId_idx" ON "Meeting"("relationshipId");

-- CreateIndex
CREATE INDEX "Meeting_weekKey_idx" ON "Meeting"("weekKey");

-- CreateIndex
CREATE UNIQUE INDEX "Meeting_relationshipId_weekKey_key" ON "Meeting"("relationshipId", "weekKey");

-- CreateIndex
CREATE INDEX "MeetingEntry_meetingId_idx" ON "MeetingEntry"("meetingId");

-- CreateIndex
CREATE INDEX "MeetingEntry_userId_idx" ON "MeetingEntry"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "MeetingEntry_meetingId_userId_key" ON "MeetingEntry"("meetingId", "userId");

-- AddForeignKey
ALTER TABLE "Meeting" ADD CONSTRAINT "Meeting_relationshipId_fkey" FOREIGN KEY ("relationshipId") REFERENCES "Relationship"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingEntry" ADD CONSTRAINT "MeetingEntry_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "Meeting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingEntry" ADD CONSTRAINT "MeetingEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
