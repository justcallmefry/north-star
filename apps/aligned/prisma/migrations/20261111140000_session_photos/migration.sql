-- One photo per partner per day.
CREATE TABLE "SessionPhoto" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SessionPhoto_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SessionPhoto_sessionId_userId_key" ON "SessionPhoto"("sessionId", "userId");
CREATE INDEX "SessionPhoto_sessionId_idx" ON "SessionPhoto"("sessionId");

ALTER TABLE "SessionPhoto" ADD CONSTRAINT "SessionPhoto_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "DailySession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SessionPhoto" ADD CONSTRAINT "SessionPhoto_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
